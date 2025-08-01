import dbConnect from '../../lib/dbConnect';
import Booking from '../../models/Booking';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // ✅ Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*'); // Replace '*' with your domain for security
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ✅ Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id, email, name, checkIn, checkOut, roomType } = req.body;

  if (!id || !email || !name || !checkIn || !checkOut || !roomType) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    await dbConnect();

    // ✅ Update booking status to 'approved'
    const booking = await Booking.findByIdAndUpdate(
      id,
      { status: 'approved' },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // ✅ Send confirmation email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,     // e.g., "your@gmail.com"
        pass: process.env.EMAIL_PASS      // App-specific password
      }
    });

    const mailOptions = {
      from: `"Guest House" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Booking Approved',
      html: `
        <h2>Dear ${name},</h2>
        <p>Your booking has been <strong>approved</strong>.</p>
        <p><strong>Room Type:</strong> ${roomType}</p>
        <p><strong>Check-In:</strong> ${checkIn}</p>
        <p><strong>Check-Out:</strong> ${checkOut}</p>
        <p>We look forward to welcoming you!</p>
        <br>
        <p>Best regards,<br>Guest House Team</p>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: 'Booking approved and email sent' });

  } catch (error) {
    console.error('Error approving booking:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
