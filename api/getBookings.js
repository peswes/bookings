import { MongoClient } from "mongodb";

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);

    const bookings = await db
      .collection("bookings")
      .find({})
      .project({
        name: 1,
        email: 1,
        phone: 1,
        checkin: 1,
        checkout: 1,
        roomType: 1,
        adults: 1,
        kids: 1,
        message: 1,
        status: 1,       // ✅ Track status
        createdAt: 1     // ✅ Optional for sorting or display
      })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json(bookings);
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving bookings", error: error.message });
  } finally {
    await client.close();
  }
}
