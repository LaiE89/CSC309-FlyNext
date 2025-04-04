import PDFDocument from "pdfkit";
export const runtime = 'nodejs';
import { PassThrough } from "stream";
import { prisma } from "@/utils/db";

export async function generateInvoice(booking, payment, user) {
  console.log("generateInvoice: started");
  console.log("Booking:", booking);
  console.log("Payment:", payment);
  console.log("User:", user);

  // Fetch the full user details from the DB
  const fullUser = await prisma.user.findUnique({ where: { id: user.id } });

  // Parse flight booking info (if provided)
  let flightData = null;
  let flightDetails = "";
  if (booking.flightBookingInfo) {
    try {
      flightData = JSON.parse(booking.flightBookingInfo);
    } catch (error) {
      console.error("Error parsing flightBookingInfo:", error);
    }
    if (flightData) {
      // Check if flightData contains a flights array (round-trip or multi-segment)
      if (Array.isArray(flightData.flights)) {
        flightDetails += "Flight Information (Round/Multiple Segments):\n";
        flightData.flights.forEach((flight, index) => {
          flightDetails += `  Flight ${index + 1}:\n`;
          flightDetails += `    Flight Number: ${flight.flightNumber}\n`;
          flightDetails += `    Origin: ${flight.origin}\n`;
          flightDetails += `    Destination: ${flight.destination}\n`;
          flightDetails += `    Airline: ${flight.airline}\n`;
          flightDetails += `    Departure: ${new Date(flight.departureTime).toLocaleString()}\n`;
          flightDetails += `    Arrival: ${new Date(flight.arrivalTime).toLocaleString()}\n`;
          flightDetails += `    Status: ${flight.status}\n`;
          flightDetails += `    Price: $${flight.price}\n\n`;
        });
      } else {
        // If it's a single flight object rather than an array of flights
        flightDetails += "Flight Information:\n";
        flightDetails += `  Flight Number: ${flightData.flightNumber}\n`;
        flightDetails += `  Origin: ${flightData.origin}\n`;
        flightDetails += `  Destination: ${flightData.destination}\n`;
        flightDetails += `  Airline: ${flightData.airline}\n`;
        flightDetails += `  Departure: ${new Date(flightData.departureTime).toLocaleString()}\n`;
        flightDetails += `  Arrival: ${new Date(flightData.arrivalTime).toLocaleString()}\n`;
        flightDetails += `  Status: ${flightData.status}\n`;
        flightDetails += `  Price: $${flightData.price}\n`;
      }
    }
  }

  // Determine the effective flight price. If flight data is provided, use the total,
  // otherwise default to payment.amount.

  // For room booking details, parse roomBookingInfo (if provided)
  let parsedRoomBooking = null;
  let finalCheckIn = null;
  let finalCheckOut = null;
  let finalHotelId = null;
  let finalRoomId = null;
  if (booking.roomBookingInfo) {
    try {
      parsedRoomBooking = JSON.parse(booking.roomBookingInfo);
    } catch (error) {
      console.error("Error parsing roomBookingInfo:", error);
    }
    if (parsedRoomBooking) {
      finalHotelId = parsedRoomBooking.hotelId || null;
      finalRoomId = parsedRoomBooking.roomId || null;
      finalCheckIn = parsedRoomBooking.checkIn ? new Date(parsedRoomBooking.checkIn) : null;
      finalCheckOut = parsedRoomBooking.checkOut ? new Date(parsedRoomBooking.checkOut) : null;
    }
  }
  // Alternatively, if the booking record itself holds checkIn/checkOut and hotelId/roomId,
  // you might use those:
  finalCheckIn = finalCheckIn || (booking.checkIn ? new Date(booking.checkIn) : null);
  finalCheckOut = finalCheckOut || (booking.checkOut ? new Date(booking.checkOut) : null);
  finalHotelId = finalHotelId || booking.hotelId || null;
  finalRoomId = finalRoomId || booking.roomId || null;

  const doc = new PDFDocument({ autoFirstPage: false });
  const passThroughStream = new PassThrough();
  const buffers = [];

  doc.pipe(passThroughStream);
  passThroughStream.on("data", (chunk) => buffers.push(chunk));

  doc.addPage();
  doc.font("Times-Roman");

  // Header
  doc.fontSize(18).text("FlyNext Booking Invoice", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Name: ${fullUser.firstName} ${fullUser.lastName}`);
  doc.text(`Email: ${fullUser.email}`);
  doc.moveDown();
  doc.text(`Booking ID: ${booking.id}`);
  doc.moveDown();

  // Flight booking details (if any)
  if (booking.flightBookingInfo) {
    doc.text("Flight Details:");
    if (flightDetails) {
      doc.text(flightDetails);
    } else {
      doc.text(booking.flightBookingInfo);
    }
    doc.moveDown();
  }

  // Hotel booking details (if any)
  if (finalHotelId && finalRoomId) {
    doc.text(`Hotel Booking: Hotel ID ${finalHotelId}, Room ID ${finalRoomId}`);
    if (finalCheckIn && finalCheckOut) {
      doc.text(`Check-In: ${finalCheckIn.toLocaleDateString()}`);
      doc.text(`Check-Out: ${finalCheckOut.toLocaleDateString()}`);
    }
    doc.moveDown();
  }

  // Totals and payment info
  doc.text(`Total Amount: $${payment.amount}`);
  doc.text(`Payment Status: ${payment.status}`);

  doc.end();

  return new Promise((resolve, reject) => {
    passThroughStream.on("end", () => {
      console.log("generateInvoice: Invoice generated successfully");
      resolve(Buffer.concat(buffers));
    });
    passThroughStream.on("error", (error) => {
      console.error("generateInvoice: Error generating invoice:", error);
      reject(new Error("Failed to generate PDF invoice."));
    });
  });
}

export async function POST(request) {
  try {
    const { booking, payment, user } = await request.json();
    if (!booking || !payment || !user) {
      return new Response(JSON.stringify({ message: "Missing required fields: booking, payment, and user" }), { status: 400 });
    }

    // Generate the invoice PDF
    const pdfBuffer = await generateInvoice(booking, payment, user);

    // Return the PDF as a downloadable response
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="invoice.pdf"',
      },
    });
  } catch (error) {
    console.error("Error in invoice endpoint:", error);
    return new Response(JSON.stringify({ message: "Error generating invoice", error: error.message }), { status: 500 });
  }
}
