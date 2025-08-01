import { MongoClient, ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "DELETE") return res.status(405).json({ message: "Method Not Allowed" });

  const { id } = req.query;
  if (!id) return res.status(400).json({ message: "Missing booking ID" });

  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    const result = await db.collection("bookings").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 1) {
      res.status(200).json({ message: "Booking deleted" });
    } else {
      res.status(404).json({ message: "Booking not found" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error deleting booking", error: err });
  } finally {
    await client.close();
  }
}
