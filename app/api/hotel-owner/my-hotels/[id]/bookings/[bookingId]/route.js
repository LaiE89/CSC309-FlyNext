import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";
import { prisma } from "@/utils/db";

export async function DELETE(request, { params }) {
  const token = request.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decoded = verifyToken(token, true);
  if (!decoded) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  // Only hotel owners are allowed.
  if (decoded.role !== "HOTEL_OWNER") {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  try {
    const { id, bookingId } = await params;
    console.log("Hotel ID:", id, "Booking ID:", bookingId);
    if (!bookingId || !id) {
      return NextResponse.json(
        { error: "Booking ID and Hotel ID are required" },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }


    // Get the hotel record to ensure the logged-in hotel owner owns the hotel.
    const hotel = await prisma.hotel.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (hotel.ownerId != decoded.id) {
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    const booking = await prisma.booking.findUnique({
        where: { id: parseInt(bookingId, 10) },
      });
      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }
    let updateData = {
        hotelId: null,
        roomId: null,
      };
      if (!booking.flightBookingInfo) {
        updateData.bookStatus = "CANCELLED";
      }
  
      // Update the booking record
      const updatedBooking = await prisma.booking.update({
        where: { id: parseInt(bookingId, 10) },
        data: updateData,
      });
      console.log("Cancel Booking: Updated booking:", updatedBooking);

    // Create a notification for the user.
    await prisma.notification.create({
      data: {
        userId: updatedBooking.userId,
        message: `⚠️ Booking Update
              \nThe room portion of your booking #${booking.id} has been cancelled by the owner.
              ${booking.flightBookingInfo ? '\nYour flight booking remains active.' : ''}
              \nPlease check your email for more details.`,
      },
    });

    return NextResponse.json(
      { booking: updatedBooking },
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
