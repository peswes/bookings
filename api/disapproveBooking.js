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

    // ✅ Update status to disapproved
    const result = await db.collection("bookings").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status: "disapproved" } },
      { returnDocument: "after" }
    );

    if (!result.value) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const { email, name, roomType } = result.value;

    // // ✅ Send email notification
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
  subject: "Booking Disapproval Notice - Chez Nous Chez Vous Apartments",
  html: `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto;">
      <h2 style="color: #c0392b; text-align: center;">Booking Disapproval Notice</h2>
      <p>Dear <strong>${name}</strong>,</p>
      
      <p>Thank you for your interest in Chez Nous Chez Vous Apartments. Unfortunately, we must inform you that your booking request for the <strong>${roomType}</strong> has been <span style="color: #e74c3c; font-weight: bold;">disapproved</span>.</p>
      
      <p>This decision may be due to unavailability of the flat during your requested dates or other unforeseen circumstances. We sincerely apologize for any inconvenience this may cause.</p>
      
      <p>If you have any questions or would like assistance with alternative dates or options, please do not hesitate to reach out to our support team at <a href="tel:+2349030927285" style="color: #2980b9; text-decoration: none;">+2349030927285 to check for other available time</a>. We are here to help you find the best solution.</p>
      
      <p>We appreciate your understanding and hope to welcome you to Chez Nous Chez Vous Apartments in the near future.</p>

          <p style="color: #c0392b; text-align: center;">Note: If you have other secured your spot through other platform like our whatsapp, tiktok and instagram please ignore</p>
      
      
      <p style="margin-top: 40px;">Warm regards,<br>
      <strong>The Chez Nous Chez Vous Apartments Team</strong></p>
    </div>
  `
};

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: "Booking disapproved and email sent." });

  } catch (error) {
    console.error("Disapprove error:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
}
