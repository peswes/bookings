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

    // ✅ Send email notification
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Booking Disapproved",
      html: `
        <h3>Dear ${name},</h3>
        <p>We regret to inform you that your booking for <strong>${roomType}</strong> has been <strong>disapproved</strong>.</p>
        <p>Please feel free to reach out for clarification or rebooking.</p>
        <p>Thank you for your interest in our Guest House.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: "Booking disapproved and email sent." });

  } catch (error) {
    console.error("Disapprove error:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
}
