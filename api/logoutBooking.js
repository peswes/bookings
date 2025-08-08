import { MongoClient, ObjectId } from "mongodb";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Missing booking ID" });
  }

  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);

    const result = await db.collection("bookings").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status: "logged out" } },
      { returnDocument: "after" }
    );

    if (!result.value) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const { email, name, roomType } = result.value;

    // const transporter = nodemailer.createTransport({
    //   service: "gmail",
    //   auth: {
    //     user: process.env.EMAIL_USER,
    //     pass: process.env.EMAIL_PASS
    //   }
    // });

    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,          // or 587 for TLS
      secure: true,       // true for port 465, false for 587
      auth: {
        user: process.env.EMAIL_USER,  // your full Zoho email address
        pass: process.env.EMAIL_PASS   // your Zoho password or app password
      }
    });

   const mailOptions = {
  from: process.env.EMAIL_USER,
  to: email,
  subject: "Guest Checkout Confirmation - Chez Nous Chez Vous Apartments",
  html: `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto;">
      <h2 style="color: #2980b9; text-align: center;">Checkout Confirmation</h2>
      <p>Dear <strong>${name}</strong>,</p>
      
      <p>This email is to confirm that you have successfully checked out from your booking for the <strong>${roomType}</strong>.</p>
      
      <p>We hope your stay was comfortable and enjoyable. It was our pleasure to have you as our guest.</p>
      
      <p>If you have any feedback or need assistance for future bookings, please do not hesitate to contact us at <a href="mailto:support@cheznouschezvous.com" style="color: #2980b9; text-decoration: none;">support@cheznouschezvous.com</a>.</p>
      
      <p>We look forward to welcoming you back at Chez Nous Chez Vous Apartments soon.</p>
      
      <p style="margin-top: 40px;">Warm regards,<br>
      <strong>The Chez Nous Chez Vous Apartments Team</strong></p>
    </div>
  `
};


    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: "Booking logged out and email sent." });

  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
}
