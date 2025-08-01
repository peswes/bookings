export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const { username, password } = req.body;

  const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    res.status(200).json({ authenticated: true });
  } else {
    res.status(401).json({ authenticated: false, message: "Invalid credentials" });
  }
}
