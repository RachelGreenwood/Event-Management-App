import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db.js";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import Stripe from "stripe";
import QRCode from "qrcode";
import webpush from "web-push";

dotenv.config();
const app = express();

webpush.setVapidDetails(
  "mailto:rachelgreenwood3301@gmail.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});


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
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
      end_date,
      max_capacity
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
      (name, event_date, description, ticket_types, prices, venue, schedule, performer, created_by, end_date, max_capacity)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [name, event_date, description, ticket_types, prices, venue, schedule, performer, profileId, end_date, max_capacity]
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
      `SELECT t.id AS ticket_id, t.ticket_type, t.price, t.purchase_date, t.qr_code,
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

// Handles Stripe payments (in cents)
app.post("/create-payment-intent", async (req, res) => {
  const { amount, currency = "usd" } = req.body;
  console.log("Received amount:", amount);

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: err.message });
  }
});

// Register a paid ticket to a user
app.post("/register-paid-ticket", verifyJwt, async (req, res) => {
  const { eventId, profileId, ticketType, price } = req.body;
  console.log("Received paid ticket:", req.body);
  const auth0Id = req.user.sub;

  try {
    const profileResult = await pool.query(
      "SELECT id FROM profiles WHERE auth0_id = $1",
      [auth0Id]
    );
    if (profileResult.rows.length === 0)
      return res.status(404).json({ error: "User profile not found" });

    const profileId = profileResult.rows[0].id;
    
    // Generates QR code
    const qrData = `${eventId}-${profileId}-${Date.now()}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrData);
    
    // Save ticket and QR code
    const ticketResult = await pool.query(
      `INSERT INTO tickets (profile_id, event_id, ticket_type, price, purchase_date, qr_code, qr_data)
       VALUES ($1, $2, $3, $4, NOW(), $5, $6)
       RETURNING *`,
      [profileId, eventId, ticketType, price, qrCodeDataUrl, qrData]
    );

    res.json(ticketResult.rows[0]);
  } catch (err) {
    console.error("Error registering paid ticket:", err);
    res.status(500).json({ error: "Failed to register paid ticket" });
  }
});

// Register a free ticket to a user
app.post("/register-free-ticket", verifyJwt, async (req, res) => {
  const { eventId, profileId, ticketType } = req.body;
  const auth0Id = req.user.sub;

  try {
    const profileResult = await pool.query(
      "SELECT id FROM profiles WHERE auth0_id = $1",
      [auth0Id]
    );
    if (profileResult.rows.length === 0)
      return res.status(404).json({ error: "User profile not found" });

    const profileId = profileResult.rows[0].id;

    // Generates QR code
    const qrData = `${eventId}-${profileId}-${Date.now()}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrData);

    console.log("Length of qrCodeDataUrl:", qrCodeDataUrl.length);
console.log("First 50 chars:", qrCodeDataUrl.slice(0, 50));


    // Save ticket + QR code
    const ticketResult = await pool.query(
      `INSERT INTO tickets (profile_id, event_id, ticket_type, price, purchase_date, qr_code, qr_data)
       VALUES ($1, $2, $3, $4, NOW(), $5, $6)
       RETURNING *`,
      [profileId, eventId, "Free", 0, qrCodeDataUrl, qrData]
    );

    res.json(ticketResult.rows[0]);
  } catch (err) {
    console.error("Error registering free ticket:", err);
    res.status(500).json({ error: "Failed to register free ticket" });
  }
});

// Updates event's analytics
app.put("/analytics/:id", async (req, res) => {
  const { id } = req.params;
  const { tickets_sold, revenue } = req.body; // updated values

  try {
    const result = await pool.query(
      `UPDATE events
       SET tickets_sold = $1,
           revenue = $2
       WHERE id = $3
       RETURNING *`,
      [tickets_sold, revenue, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error updating event" });
  }
});

// DELETEs a user's ticket
app.delete("/tickets/:ticketId", verifyJwt, async (req, res) => {
  const { ticketId } = req.params;

  try {
    await pool.query("DELETE FROM tickets WHERE id = $1", [ticketId]);
    res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (err) {
    console.error("Error deleting ticket:", err);
    res.status(500).json({ error: "Failed to delete ticket" });
  }
});

// Validates QR code for event check-in
app.post("/validate-ticket", verifyJwt, async (req, res) => {
  const { qrCode } = req.body;
  console.log("Received QR validation request:", req.body);

  if (!qrCode) {
    return res.status(400).json({ valid: false, message: "QR code and event ID are required" });
  }

  try {
    const ticketResult = await pool.query(
      `
      SELECT t.id AS ticket_id, t.ticket_type, t.purchase_date, t.profile_id, t.qr_code, t.checked_in,
             e.id AS event_id, e.name AS event_name, e.event_date, e.venue
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      WHERE t.qr_data = $1
      `,
      [qrCode]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ valid: false, message: "Ticket not found or invalid QR code" });
    }

    const ticket = ticketResult.rows[0];

    if (ticket.checked_in) {
      return res.status(400).json({ valid: false, message: "Ticket already checked in" });
    }

    // Mark ticket as checked-in
    const updatedTicket = await pool.query(
      `
      UPDATE tickets
      SET checked_in = TRUE
      WHERE id = $1
      RETURNING id AS ticket_id, ticket_type, purchase_date, profile_id, qr_code, checked_in
      `,
      [ticket.ticket_id]
    );

    // Optionally increment event attendance count
    await pool.query(
      `
      UPDATE events
      SET attendance_count = attendance_count + 1
      WHERE id = $1
      `,
      [ticket.event_id]
    );

    res.json({
      valid: true,
      ticket: {
        ...updatedTicket.rows[0],
        event_name: ticket.event_name,
        event_date: ticket.event_date,
        venue: ticket.venue,
      },
    });
  } catch (err) {
    console.error("Error validating ticket:", err);
    res.status(500).json({ valid: false, message: "Server error" });
  }
});


app.put("/events/:id", verifyJwt, async (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  const {
    name,
    event_date,
    end_date,
    description,
    ticket_types,
    prices,
    venue,
    schedule,
    performer,
    tickets_sold,
    revenue
  } = req.body;

  // Updates event
  try {
    const query = `
      UPDATE events
      SET
        name = COALESCE($1, name),
        event_date = COALESCE($2, event_date),
        end_date = COALESCE($3, end_date),
        description = COALESCE($4, description),
        ticket_types = COALESCE($5::text[], ticket_types),
        prices = COALESCE($6::numeric[], prices),
        venue = COALESCE($7, venue),
        schedule = COALESCE($8, schedule),
        performer = COALESCE($9, performer),
        tickets_sold = COALESCE($10, tickets_sold),
        revenue = COALESCE($11, revenue)
      WHERE id = $12
      RETURNING *;
    `;

    const values = [
      name,
      event_date,
      end_date,
      description,
      ticket_types,
      prices,
      venue,
      schedule,
      performer,
      tickets_sold,
      revenue,
      eventId
    ];

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Event not found or no changes made" });
    }

    const updatedEvent = result.rows[0];

    // Shares notifications on attendees' dashboards
    const attendeesResult = await pool.query(
      `SELECT DISTINCT profile_id FROM tickets WHERE event_id = $1`,
      [eventId]
    );

    const notificationMessage = `Your event "${updatedEvent.name}" has been updated. Check the new details!`;

    for (const attendee of attendeesResult.rows) {
      await pool.query(
        `INSERT INTO notifications (profile_id, event_id, message)
         VALUES ($1, $2, $3)`,
        [attendee.profile_id, eventId, notificationMessage]
      );
    }

// Sends browser push notifications to attendees
    const subscriptionsResult = await pool.query(
      `SELECT ps.endpoint, ps.p256dh, ps.auth
       FROM tickets t
       JOIN push_subscriptions ps ON ps.user_id = t.profile_id
       WHERE t.event_id = $1`,
      [eventId]
    );

    const payload = JSON.stringify({
      title: "Event Updated!",
      body: `An event you’re attending has new details — check your dashboard.`,
      url: `/events/${eventId}`
    });

    for (const sub of subscriptionsResult.rows) {
      if (!sub.endpoint) continue; // safety check

      const subscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      };

      try {
        await webpush.sendNotification(subscription, payload);
      } catch (err) {
        console.error("Push error:", err);
      }
    }

    res.json(updatedEvent);

  } catch (err) {
    console.error("Error updating event:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/notifications", verifyJwt, async (req, res) => {
  try {
    const auth0Id = req.user.sub;
    const profileResult = await pool.query(
      "SELECT id FROM profiles WHERE auth0_id = $1",
      [auth0Id]
    );

    if (profileResult.rows.length === 0)
      return res.status(404).json({ error: "Profile not found" });

    const profileId = profileResult.rows[0].id;

    const notifications = await pool.query(
      `SELECT * FROM notifications
       WHERE profile_id = $1
       ORDER BY created_at DESC`,
      [profileId]
    );

    res.json(notifications.rows);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Save push notification subscription for logged-in user
app.post("/api/subscribe", verifyJwt, async (req, res) => {
  const { subscription } = req.body;

  // Validate subscription payload
  if (
    !subscription ||
    !subscription.endpoint ||
    !subscription.keys ||
    !subscription.keys.p256dh ||
    !subscription.keys.auth
  ) {
    return res.status(400).json({ error: "Invalid subscription object" });
  }

  try {
    const profileResult = await pool.query(
      "SELECT id FROM profiles WHERE auth0_id = $1",
      [req.user.sub]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const userId = profileResult.rows[0].id; // numeric FK

    const insertQuery = `
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (endpoint) DO NOTHING
      RETURNING *;
    `;
    const values = [
      userId,
      subscription.endpoint,
      subscription.keys.p256dh,
      subscription.keys.auth
    ];

    const insertResult = await pool.query(insertQuery, values);

    if (insertResult.rows.length === 0) {
      return res.status(200).json({ message: "Subscription already exists" });
    }

    res.status(201).json({ message: "Subscription saved", subscription: insertResult.rows[0] });
  } catch (err) {
    console.error("Error saving subscription:", err);
    res.status(500).json({ error: "Failed to save subscription" });
  }
});


app.use("/api/profile", router);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));