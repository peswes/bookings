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

// ✅ Use EMAIL_USER and EMAIL_PASS from .env
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export default async function handler(req, res) {
  // ✅ CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // Handle preflight
  }

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
  from: process.env.EMAIL_USER,
  to: email,
  subject: 'Booking Approved - Chez Nous Chez Vous Apartments',
  html: `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h2 style="color: #2c3e50;">Dear ${name},</h2>
      <p>We are pleased to inform you that your booking for the <strong>${roomType}</strong> flat from <strong>${checkIn}</strong> to <strong>${checkOut}</strong> has been <span style="color:green; font-weight: bold;">approved</span>.</p>
      <p>Thank you for choosing Chez Nous Chez Vous Apartments. We look forward to making your stay comfortable and enjoyable.</p>
      
      <h3 style="color: #2c3e50; margin-top: 30px;">Guest Policies</h3>
      <ul style="list-style-type: disc; margin-left: 20px;">
        <li><strong>Check-in and Check-out:</strong> Check-in is from 14:00 and check-out before 12:00. Keys will be received from the manager or host upon arrival and returned upon departure.</li>
        <li><strong>During Your Stay:</strong> Maximum of 4 guests for 1-bedroom flat and 6 guests for 2-bedroom flat. Additional guests must be approved by the host.</li>
        <li>No pets allowed.</li>
        <li>No smoking inside the flats; smoking is only allowed in designated areas.</li>
        <li>No parties or events unless approved in advance by the host.</li>
        <li><strong>Additional Rules:</strong> Proof of ID is required before arrival. A maximum of 2 cars per flat can be parked inside the property.</li>
        <li>Please take good care of the flat and furniture; any damages may result in forfeiture of your deposit and further actions.</li>
        <li>Be mindful of the neighborhood, especially regarding noise levels.</li>
      </ul>

      <p>If you have any questions or need assistance, please do not hesitate to contact us.</p>
      <p>We wish you a pleasant stay!</p>

      <p style="margin-top: 40px;">Best regards,<br>
      <strong>Chez Nous Chez Vous Apartments Team</strong></p>
    </div>
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
