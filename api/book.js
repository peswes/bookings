import { MongoClient } from "mongodb";

export default async function handler(req, res) {
  // ✅ CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*"); // Change '*' to your domain for more security
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { name, email, checkIn, checkOut, roomType, adults, kids } = req.body;

  // ✅ Basic validation
  if (!name || !email || !checkIn || !checkOut || !roomType) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const booking = {
    name,
    email,
    checkIn,
    checkOut,
    roomType,
    adults: adults || 0,
    kids: kids || 0,
    status: "pending",              // Status of approval
    paymentStatus: "unpaid",        // ✅ Add this field
    createdAt: new Date()
  };

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    await db.collection("bookings").insertOne(booking);

    return res.status(201).json({ message: "Booking successful" });
  } catch (err) {
    console.error("Booking save error:", err);
    return res.status(500).json({ message: "Error saving booking", error: err.message });
  } finally {
    await client.close();
  }
}
