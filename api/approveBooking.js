import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const mongoURI = process.env.MONGODB_URI;

async function connectDB() {
  if (mongoose.connections[0].readyState === 1) return;
  await mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

const bookingSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  roomType: String,
  checkIn: String,
  checkOut: String,
  status: { type: String, default: 'pending' }
});

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.ADMIN_EMAIL,
    pass: process.env.ADMIN_PASS
  }
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { id, email, name, checkIn, checkOut, roomType } = req.body;

      await connectDB();

      const updatedBooking = await Booking.findByIdAndUpdate(
        id,
        { status: 'accepted' },
        { new: true }
      );

      if (!updatedBooking) {
        return res.status(404).json({ message: 'Booking not found.' });
      }

      const mailOptions = {
        from: process.env.ADMIN_EMAIL,
        to: email,
        subject: 'Booking Approved',
        html: `
          <h3>Dear ${name},</h3>
          <p>Your booking for <strong>${roomType}</strong> from <strong>${checkIn}</strong> to <strong>${checkOut}</strong> has been <span style="color:green;">approved</span>.</p>
          <p>Thank you for choosing our Guest House!</p>
        `
      };

      await transporter.sendMail(mailOptions);

      return res.status(200).json({ message: 'Booking approved and email sent.' });
    } catch (error) {
      console.error('Error approving booking:', error);
      return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}
