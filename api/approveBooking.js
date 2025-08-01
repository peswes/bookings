import { MongoClient, ObjectId } from "mongodb";

export default async function handler(req, res) {
  // ✅ Handle CORS
  res.setHeader("Access-Control-Allow-Origin", "*"); // Change "*" to specific domain for better security
  res.setHeader("Access-Control-Allow-Methods", "PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ✅ Restrict to PATCH only
  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { id, status } = req.body;

  // ✅ Basic input validation
  if (!id || !status || !["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid input" });
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
      return res.status(200).json({ message: `Booking ${status}` });
    } else {
      return res.status(404).json({ message: "Booking not found or already updated" });
    }
  } catch (err) {
    console.error("Error updating booking:", err);
    return res.status(500).json({ message: "Error updating booking", error: err.message });
  } finally {
    await client.close();
  }
}
