import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db.js";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Sets up Auth0 authentication
const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err || !key) {
      console.error("Failed to get signing key:", err || "No key returned");
      // Pass error to callback instead of throwing
      return callback(err || new Error("No signing key found"));
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}



function verifyJwt(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).send("No token provided");

  jwt.verify(
    token,
    getKey,
    {
      audience: process.env.AUTH0_AUDIENCE,
      issuer: `https://${process.env.AUTH0_DOMAIN}/`,
      algorithms: ["RS256"],
    },
    (err, decoded) => {
      if (err) return res.status(401).send("Invalid token");
      req.user = decoded;
      next();
    }
  );
}

// Adds profile
const router = express.Router();

// GET profile for the authenticated user
router.get("/", verifyJwt, async (req, res) => {
  try {
    // Fully qualified table name: public.profiles
    const result = await pool.query(
      `SELECT * FROM profiles WHERE auth0_id = $1`,
      [req.user.sub]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Return the first row (there should only be one per user)
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ message: "Database error" });
  }
});

// POST (create or update) profile for the authenticated user
router.post("/", verifyJwt, async (req, res) => {
  const { name, email, role } = req.body;
  const auth0_id = req.user.sub;

  try {
    // Fully qualified table name: public.profiles
    const result = await pool.query(
      `INSERT INTO profiles (auth0_id, name, email, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (auth0_id)
       DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, role = EXCLUDED.role
       RETURNING *`,
      [auth0_id, name, email, role]
    );

    // Return the inserted or updated row
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ message: "Database error" });
  }
});

// GET all events from events table
app.get("/events", verifyJwt, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM events ORDER BY event_date ASC`);
    res.json(result.rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ message: "Database error" });
  }
});


// Organizer can add an event
app.post("/events", verifyJwt, async (req, res) => {
  const {
      name,
      event_date,
      description,
      ticket_types,
      prices,
      venue,
      schedule,
      performer,
    } = req.body;
    const auth0Id = req.user.sub;

  try {
    const profileResult = await pool.query(
      "SELECT id FROM profiles WHERE auth0_id = $1",
      [auth0Id]
    );
    const profileId = profileResult.rows[0].id;
    const newEvent = await pool.query(
      `INSERT INTO events 
      (name, event_date, description, ticket_types, prices, venue, schedule, performer, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [name, event_date, description, ticket_types, prices, venue, schedule, performer, profileId]
    );

    res.json(newEvent.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get all events created by a specific user
app.get("/events/user/:auth0Id", async (req, res) => {
  const { auth0Id } = req.params;

  try {
    const profileResult = await pool.query(
      "SELECT id FROM profiles WHERE auth0_id = $1",
      [auth0Id]
    );
    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }
    const profileId = profileResult.rows[0].id;
    const result = await pool.query(
      "SELECT * FROM events WHERE created_by = $1 ORDER BY event_date DESC",
      [profileId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching user events:", err);
    res.status(500).json({ error: "Failed to fetch user events" });
  }
});

// GET single event by ID
app.get("/events/:eventId", verifyJwt, async (req, res) => {
  const { eventId } = req.params;
  try {
    const result = await pool.query("SELECT * FROM events WHERE id = $1", [eventId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch event" });
  }
});

// GET all tickets a user has bought
app.get("/tickets/user", verifyJwt, async (req, res) => {
  const auth0Id = req.user.sub;

  try {
    const profileResult = await pool.query(
      "SELECT id FROM profiles WHERE auth0_id = $1",
      [auth0Id]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: "User profile not found" });
    }

    const profileId = profileResult.rows[0].id;

    // Join tickets with events to get event info
    const ticketsResult = await pool.query(
      `SELECT t.id AS ticket_id, t.ticket_type, t.price, t.purchase_date,
              e.id AS event_id, e.name AS event_name, e.event_date, e.venue
       FROM tickets t
       JOIN events e ON t.event_id = e.id
       WHERE t.profile_id = $1
       ORDER BY t.purchase_date DESC`,
      [profileId]
    );

    res.json(ticketsResult.rows);
  } catch (err) {
    console.error("Error fetching tickets:", err);
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
});

app.use("/api/profile", router);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));