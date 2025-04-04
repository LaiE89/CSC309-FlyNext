import { PaymentStatus, BookingStatus, FlightStatus } from '@prisma/client';
import { prisma } from "@/utils/db";
import { NextResponse } from 'next/server';
import { validatePaymentDetails } from '@/app/api/auth/payment/validatepayment/route';
import { generateInvoice } from '@/app/api/auth/payment/generateinvoice/route';
import { verifyToken } from "@/utils/auth";

export async function POST(request) {
    const token = request.cookies.get("token")?.value;
    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token, true);
    if (!decoded) {
        return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    if (decoded.role !== "USER" && decoded.role !== "HOTEL_OWNER") {
        return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    try {
        // Extract payment details and booking id from request
        const body = await request.json();
        const { bookingId, cardNumber, expiryDate } = body;
        if (!bookingId || !cardNumber || !expiryDate) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Retrieve booking (with hotel & room info)
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { hotel: true, room: true },
        });

        if (!booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        if (booking.userId !== decoded.id) {
            return NextResponse.json({ error: "Access Denied" }, { status: 403 });
        }

        if (booking.bookStatus !== BookingStatus.PENDING) {
            return NextResponse.json({ error: "This booking is not pending" }, { status: 400 });
        }

        // Validate payment details and create a payment record
        const validation = validatePaymentDetails(cardNumber, expiryDate);
        if (!validation.isValid) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }
        
        const existingPayment = await prisma.payment.findUnique({
            where: { bookingId: booking.id },
        });
        
        if (existingPayment) {
            return NextResponse.json({ error: "Payment already exists for this booking" }, { status: 400 });
        }
        
        let totalPrice = 0;
        let nightsStayed = 0;

        if (booking.roomId) {
            const room = await prisma.room.findUnique({
                where: { id: Number(booking.roomId) },
            });

            if (booking.checkIn && booking.checkOut) {
                const checkInDate = new Date(booking.checkIn);
                const checkOutDate = new Date(booking.checkOut);
            
                const diffInMs = checkOutDate.getTime() - checkInDate.getTime();
                nightsStayed = diffInMs / (1000 * 60 * 60 * 24);
                totalPrice += room.pricePerNight * (nightsStayed);
            }
        }

        if (booking.flightBookingInfo) {
            const parsed = JSON.parse(booking.flightBookingInfo);
            totalPrice += parsed.flights.reduce((sum, curFlight) => sum + curFlight.price, 0);
        }

        const payment = await prisma.payment.create({
            data: {
                bookingId: booking.id,
                cardNumber,
                expiryDate,
                amount: totalPrice,
                status: PaymentStatus.SUCCESS,
            },
        });

        // Process flight portion if exists (post booking to AFS)
        if (booking.flightBookingInfo) {
            const flightData = JSON.parse(booking.flightBookingInfo);
            if (flightData.flights && flightData.flights.length > 0) {

                // Retrieve full user details for payload fields
                const fullUser = await prisma.user.findUnique({ where: { id: decoded.id } });
                
                const bookingPayload = {
                    firstName: fullUser.firstName,
                    lastName: fullUser.lastName,
                    email: fullUser.email,
                    passportNumber: "A12345678", // Dummy value (adjust as needed)
                    flightIds: flightData.flights.map((flight) => flight.flightid),
                };
        
                const afsBaseUrl = process.env.AFS_URL;
                const afsApiKey = process.env.AFS_API_KEY;
                const afsUrl = `${afsBaseUrl}/api/bookings`;
        
                try {
                    const response = await fetch(afsUrl, {
                        method: "POST",
                        headers: {
                            "x-api-key": afsApiKey,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(bookingPayload),
                    });
                    const afsBooking = await response.json();
        
                    if (afsBooking.status !== "CONFIRMED") {
                        return NextResponse.json(
                            { error: `AFS booking not confirmed: ${afsBooking.status}` },
                            { status: 400 }
                        );
                    }
        
                    // Update local booking with AFS booking reference
                    await prisma.booking.update({
                        where: { id: booking.id },
                        data: { reference: afsBooking.bookingReference },
                    });
                } catch (afsError) {
                    return NextResponse.json({ error: "AFS booking failed" }, { status: 500 });
                }
            }
        }
    
        // 6. Process room portion if exists: update room availability
        if (booking.roomBookingInfo && booking.room) {
            // Adjust the logic based on your room availability model (e.g., decrement count or mark as unavailable)
            await prisma.room.update({
                where: { id: booking.room.id },
                data: { available: false },
            });
        }

        // 7. Update booking status to CONFIRMED
        const updatedBooking = await prisma.booking.update({
            where: { id: booking.id },
            data: { bookStatus: BookingStatus.CONFIRMED },
        });

        // 8. Generate invoice
        let invoiceBuffer;
        try {
            invoiceBuffer = await generateInvoice(updatedBooking, payment, decoded);
        } catch (invoiceError) {
            return NextResponse.json({ error: "Invoice generation failed" }, { status: 500 });
        }
        const invoiceBase64 = invoiceBuffer.toString("base64");

        // 9. Create notifications
        const userNotification = await prisma.notification.create({
            data: {
                userId: decoded.id,
                message: `🎉 Your booking #${booking.id} has been confirmed! 
                ${booking.hotel ? `\nHotel: ${booking.hotel.name}` : ''}
                ${booking.flightBookingInfo ? '\nFlight details have been confirmed' : ''}
                \nCheck your email for the invoice and booking details.`,
            },
        });

        if (booking.hotel && booking.hotel.ownerId) {
            const ownerNotification = await prisma.notification.create({
                data: {
                    userId: booking.hotel.ownerId,
                    message: `📅 New Booking Alert!
                    \nBooking #${booking.id} has been confirmed for your hotel.
                    ${booking.checkIn ? `\nCheck-in: ${new Date(booking.checkIn).toLocaleDateString()}` : ''}
                    ${booking.checkOut ? `\nCheck-out: ${new Date(booking.checkOut).toLocaleDateString()}` : ''}`,
                },
            });
        }

        return NextResponse.json({
            message: "Payment processed, booking confirmed, and invoice generated.",
            invoice: invoiceBase64,
            amount: payment.amount,
        }, { status: 200 });
        
    } catch (err) {
        console.log(err.message);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
