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

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
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
  subject: "Payment Confirmation - Chez Nous Chez Vous Apartments",
  html: `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto;">
      <h2 style="color: #27ae60; text-align: center;">Payment Confirmed</h2>
      <p>Dear <strong>${name}</strong>,</p>
      
      <p>We are pleased to inform you that your payment for the <strong>${roomType}</strong> booking has been successfully confirmed.</p>
      
      <p>Thank you for choosing Chez Nous Chez Vous Apartments. We look forward to hosting you and ensuring you have a comfortable and enjoyable stay.</p>
      
      <p>If you have any questions or need assistance, please feel free to contact us at <a href="mailto:support@cheznouschezvous.com" style="color: #2980b9; text-decoration: none;">support@cheznouschezvous.com</a>.</p>
      
      <p>Safe travels and see you soon!</p>
      
      <p style="margin-top: 40px;">Best regards,<br>
      <strong>The Chez Nous Chez Vous Apartments Team</strong></p>
    </div>
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
