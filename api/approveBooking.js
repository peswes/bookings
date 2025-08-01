// api/approveBooking.js

import mongoose from 'mongoose';
import nodemailer from 'nodemailer';

// Connect to MongoDB
const uri = process.env.MONGODB_URI;
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  isConnected = true;
}

// Define booking schema
const bookingSchema = new mongoose.Schema({
  name: String,
  email: String,
  date: String,
  time: String,
  service: String,
  status: String,
});

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

// Email setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_EMAIL_PASSWORD,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests are allowed.' });
  }

  const { bookingId } = req.body;

  if (!bookingId) {
    return res.status(400).json({ message: 'Missing bookingId in request body.' });
  }

  try {
    await connectDB();

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    booking.status = 'Approved';
    await booking.save();

    // Send email to client
    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: booking.email,
      subject: 'Appointment Approved',
      html: `
        <p>Dear ${booking.name},</p>
        <p>Your appointment for <strong>${booking.service}</strong> on <strong>${booking.date}</strong> at <strong>${booking.time}</strong> has been approved.</p>
        <p>Thank you for choosing our service!</p>
        <br/>
        <p>Best regards,<br/>West K Enterprises</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: 'Booking approved and email sent.' });

  } catch (error) {
    console.error('Approval error:', error);
    return res.status(500).json({ message: 'Internal server error.', error });
  }
}
