import { MongoClient } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method Not Allowed" });

  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    const bookings = await db.collection("bookings").find().sort({ createdAt: -1 }).toArray();
    res.status(200).json(bookings);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving bookings", error: err });
  } finally {
    await client.close();
  }
}
