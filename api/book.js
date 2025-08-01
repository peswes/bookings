import { MongoClient } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

  const { name, email, checkIn, checkOut, roomType, adults, kids } = req.body;

  if (!name || !email || !checkIn || !checkOut || !roomType) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const booking = {
    name,
    email,
    checkIn,
    checkOut,
    roomType,
    adults,
    kids,
    status: "pending", // NEW
    createdAt: new Date()
  };

  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    await db.collection("bookings").insertOne(booking);
    res.status(201).json({ message: "Booking successful" });
  } catch (err) {
    res.status(500).json({ message: "Error saving booking", error: err });
  } finally {
    await client.close();
  }
}
