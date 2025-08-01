import mongoose from 'mongoose';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

  // 🔗 MongoDB Connection (inline)
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!mongoose.connection.readyState) {
    try {
      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    } catch (err) {
      console.error('MongoDB connection error:', err);
      return res.status(500).json({ message: 'Database connection error' });
    }
  }

  // 🧾 Define Booking model inline (if not already defined)
  const BookingSchema = new mongoose.Schema({
    name: String,
    email: String,
    checkIn: String,
    checkOut: String,
    roomType: String,
    status: {
      type: String,
      enum: ['pending', 'approved'],
      default: 'pending'
    }
  });

  const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);

  try {
    const booking = await Booking.findByIdAndUpdate(
      id,
      { status: 'approved' },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
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
        <p>Regards,<br>Guest House Team</p>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: 'Booking approved and email sent' });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
