import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const mongoURI = process.env.MONGODB_URI;

async function connectDB() {
  if (mongoose.connections[0].readyState !== 1) {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
}

const bookingSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  roomType: String,
  checkIn: String,
  checkOut: String,
  status: { type: String, default: 'pending' },
  paymentStatus: { type: String, default: 'unpaid' }
});

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    try {
      const { id, email, name, roomType } = req.body;

      await connectDB();

      const updatedBooking = await Booking.findByIdAndUpdate(
        id,
        {
          paymentStatus: 'paid',
          status: 'paid'
        },
        { new: true }
      );

      if (!updatedBooking) {
        return res.status(404).json({ message: 'Booking not found.' });
      }

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Payment Confirmed',
        html: `
          <h3>Dear ${name},</h3>
          <p>Your payment for <strong>${roomType}</strong> has been successfully confirmed.</p>
          <p>Thank you for choosing our Guest House.</p>
        `
      };

      await transporter.sendMail(mailOptions);

      return res.status(200).json({
        message: 'Marked as paid and email sent.',
        booking: updatedBooking
      });

    } catch (error) {
      console.error('Error marking as paid:', error);
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}
