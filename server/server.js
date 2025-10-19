import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./db.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/users", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
