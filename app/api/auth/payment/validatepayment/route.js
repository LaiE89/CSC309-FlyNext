// lib/validatePayment.js
import { NextResponse } from "next/server";


export function validatePaymentDetails(cardNumber, expiryDate) {
    if (!/^\d{16}$/.test(cardNumber)) {
      return { isValid: false, error: "Invalid card number format" };
    }
  
    const [month, year] = expiryDate.split("/");
    if (!month || !year) {
      return { isValid: false, error: "Invalid expiry date format" };
    }
    
    const mm = parseInt(month, 10);
    const yy = parseInt(year, 10) + 2000; 
  
    if (mm < 1 || mm > 12) {
      return { isValid: false, error: "Invalid month in expiry date" };
    }
  
    const now = new Date();
    const expiry = new Date(yy, mm - 1, 1); 
    if (expiry < now) {
      return { isValid: false, error: "Card has expired" };
    }
  
    return { isValid: true };
  }
  
  export async function POST(request) {
  try {

    const { cardNumber, expiryDate } = await request.json();
    console.log(cardNumber,expiryDate);
    if (!cardNumber || !expiryDate) {
      return NextResponse.json(
        { message: "Missing required fields: cardNumber and expiryDate" },
        { status: 400 }
      );
    }
  
    const result = validatePaymentDetails(cardNumber, expiryDate);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Invalid JSON data" },
      { status: 400 }
    );
  }
}