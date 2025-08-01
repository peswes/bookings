import { MongoClient, ObjectId } from "mongodb";

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id, status } = req.body;

  if (!id || !status) {
    return res.status(400).json({ message: "ID and new status are required" });
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    const result = await db.collection("bookings").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
    );

    if (result.modifiedCount === 1) {
      return res.status(200).json({ message: "Status updated successfully" });
    } else {
      return res.status(404).json({ message: "Booking not found or status unchanged" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Error updating status", error: error.message });
  } finally {
    await client.close();
  }
}
