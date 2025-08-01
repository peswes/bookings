import { MongoClient, ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "PATCH") return res.status(405).json({ message: "Method Not Allowed" });

  const { id, status } = req.body;

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
      res.status(200).json({ message: `Booking ${status}` });
    } else {
      res.status(404).json({ message: "Booking not found or already updated" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error updating booking", error: err });
  } finally {
    await client.close();
  }
}
