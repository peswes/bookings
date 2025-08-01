import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const { email, name, roomType, guests, date } = req.body;

  if (!email || !name || !roomType || !guests || !date) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // your Gmail address
        pass: process.env.EMAIL_PASS, // your Gmail app password
      },
    });

    const mailOptions = {
      from: `"GuestHouse Booking" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Booking Approved ✔',
      html: `
        <h2>Hello ${name},</h2>
        <p>Your booking has been <strong>approved</strong>.</p>
        <p><strong>Room Type:</strong> ${roomType}</p>
        <p><strong>Guests:</strong> ${guests}</p>
        <p><strong>Date:</strong> ${new Date(date).toLocaleString()}</p>
        <br>
        <p>We look forward to hosting you!</p>
        <p><em>GuestHouse Booking Team</em></p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ message: 'Failed to send email' });
  }
}
