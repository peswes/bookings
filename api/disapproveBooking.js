import { MongoClient, ObjectId } from "mongodb";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Missing booking ID" });
  }

  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);

    const result = await db.collection("bookings").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "disapproved" } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Booking not found or not updated" });
    }

    return res.status(200).json({ message: "Booking disapproved successfully" });
  } catch (error) {
    console.error("Disapprove error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
