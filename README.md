# Eventage

## Project Overview
This is a fullstack PERN (PostgreSQL, Express, React, Node.js) event and ticket management application with Auth0 authentication and Stripe for ticket purchasing.

---

## Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/)
- [PostgreSQL](https://www.postgresql.org/) installed and running
- Auth0 account with an application set up for your project
- Stripe account with API keys
- A VAPID key pair for push notifications (can be generated with the web-push CLI)

---

## Backend Setup

1. **Clone the repository**  
   ```bash
   git clone https://github.com/RachelGreenwood/Event-Management-App.git
   cd Event Management App/server```


2. **Install dependencies**

```npm install```


3. **Create a .env file in the server folder with the following variables:**

DATABASE_URL=<your_postgres_database_url>
PORT=<port_for_backend_server, e.g., 5000>
AUTH0_DOMAIN=<your_auth0_domain>
AUTH0_AUDIENCE=<your_auth0_audience>
STRIPE_SECRET_KEY=<sk_test_XXXXXXXXXXXXXXXXXXXXXXXX>
STRIPE_PUBLIC_KEY=<pk_test_XXXXXXXXXXXXXXXXXXXXXXXX>
VAPID_PUBLIC_KEY=<your_vapid_public_key>
VAPID_PRIVATE_KEY=<your_vapid_private_key>


4. **Start the backend server in development mode**

```npm run dev```


The server will start and listen on the port specified in your .env.

5. **(Optional) Seed the database**
If you have initial data to populate, run your seed script (if available) or manually insert data using psql or a database GUI.

## Stripe Setup

1. **Sign in to your Stripe Dashboard**

2. **Add your Secret Key and Punishable Key into your .env**

3. **Initialize Stripe**

```import { loadStripe } from "@stripe/stripe-js";
const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);```

4. The server handles payment intents through:

```POST /create-payment-intent```

with body:

```{ "amount": 2000, "currency": "usd" }```

## Push Notifications

To enable push notifications:

1. **Generate VAPID keys (once)**

```npx web-push generate-vapid-keys```

2. **Add keys to .env under VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY**

3. The server registers subscriptions via:

```POST /api/subscribe```

and sends notifications when events are updated.

## Frontend Setup

1. **Navigate to the frontend folder**

```cd ../client```


2. **Install dependencies**

```npm install```


3. **Create a .env file in the client folder with the following variables:**

VITE_AUTH0_DOMAIN=<your_auth0_domain>
VITE_AUTH0_CLIENT_ID=<your_auth0_client_id>
VITE_AUTH0_AUDIENCE=<your_auth0_audience>
VITE_API_URL=http://localhost:<backend_port>
VITE_AUTH0_REDIRECT_URI=http://localhost:5173


4. **Start the frontend in development mode**

```npm run dev````


The app should now be running at http://localhost:5173.

**Notes**

Make sure the backend is running before starting the frontend.

Adjust .env variables to match your Auth0 application and PostgreSQL setup.

For production deployment, set the appropriate environment variables in your hosting platform.

# 📦 Dependencies

This project uses several key libraries to support backend functionality — including authentication, database integration, payments, and notifications.

---

## 🧠 Core Framework & Middleware

- **express** — Fast, minimal web framework for Node.js used to define routes and API endpoints.  
- **cors** — Enables **Cross-Origin Resource Sharing**, allowing your frontend (React) and backend (Express) to communicate securely.  
- **dotenv** — Loads environment variables from a `.env` file so you can securely manage API keys and credentials.  
- **express.json() / express.urlencoded()** — Built-in middleware for parsing incoming JSON and URL-encoded request bodies.  

---

## 🗃️ Database

- **pg** — PostgreSQL client for Node.js; handles SQL queries, transactions, and connections to the database.  
- **./db.js** — Custom module that initializes a `pg.Pool` connection to PostgreSQL using your environment variables.  
- **

---

## 🔐 Authentication & Authorization

- **jsonwebtoken (jwt)** — Verifies and decodes JSON Web Tokens (JWTs) issued by Auth0 for user authentication.  
- **jwks-rsa** — Retrieves and caches **JSON Web Key Sets (JWKS)** from your Auth0 domain to validate JWT signatures securely.  

---

## 💳 Payments

- **stripe** — Official Stripe SDK for Node.js; used to create **Payment Intents** and handle secure purchase transactions.  

---

## 🎟️ QR Code Generation

- **qrcode** — Generates scannable **QR codes** (as Base64 image URLs) for tickets during purchase or registration.  

---

## 🔔 Push Notifications

- **web-push** — Implements the **Web Push Protocol (VAPID)**, allowing your server to send real-time browser notifications to users.  

---

## 🧰 Development Tools

- **nodemon** *(dev dependency)* — Automatically restarts your server when file changes are detected — streamlines development.  
- **eslint / prettier** *(optional)* — Linting and formatting tools for maintaining clean, consistent code style.  

---

## 🧩 Supporting Services & Infrastructure

- **Auth0** — Provides secure user authentication, token management, and user identity.  
- **Stripe** — Handles payments and checkout flow.  
- **PostgreSQL** — Relational database for storing users, events, tickets, and notifications.  

---

## ⚙️ Dependency Overview

| Category | Key Packages | Function |
|-----------|---------------|-----------|
| **Server Core** | express, cors, dotenv | Routing, security, configuration |
| **Database** | pg | Querying and managing PostgreSQL |
| **Auth & Security** | jsonwebtoken, jwks-rsa | JWT verification with Auth0 |
| **Payments** | stripe | Handles secure ticket purchases |
| **Event Tools** | qrcode, web-push | QR tickets and notifications |
| **Dev Tools** | nodemon | Auto-reload during development |

# 🗃️ Database Schema

The backend uses **PostgreSQL** to store users, events, tickets, notifications, and push subscriptions. Below is a detailed overview of the tables and their relationships.

---

## 1. Profiles

Stores information about authenticated users.

| Column      | Type    | Description |
|------------|--------|-------------|
| `id`       | SERIAL PRIMARY KEY | Unique numeric ID for each profile. |
| `auth0_id` | TEXT UNIQUE NOT NULL | Auth0 user identifier (used for JWT verification). |
| `name`     | TEXT   | User's full name. |
| `email`    | TEXT   | User's email address. |
| `role`     | TEXT   | Role of the user (e.g., attendee, organizer). |

---

## 2. Events

Stores all events created by organizers.

| Column          | Type          | Description |
|-----------------|---------------|-------------|
| `id`            | SERIAL PRIMARY KEY | Unique ID for each event. |
| `name`          | TEXT NOT NULL | Event title. |
| `description`   | TEXT          | Event description/details. |
| `event_date`    | TIMESTAMP     | Start date and time of the event. |
| `end_date`      | TIMESTAMP     | Optional end date and time. |
| `venue`         | TEXT          | Location of the event. |
| `schedule`      | TEXT          | Event schedule or agenda. |
| `performer`     | TEXT          | Name of performer(s) or speakers. |
| `created_by`    | INTEGER REFERENCES profiles(id) | Organizer who created the event. |
| `ticket_types`  | TEXT[]        | Array of ticket types (e.g., ["VIP", "Standard"]). |
| `prices`        | NUMERIC[]     | Array of ticket prices corresponding to `ticket_types`. |
| `tickets_sold`  | INTEGER DEFAULT 0 | Total tickets sold. |
| `revenue`       | NUMERIC DEFAULT 0 | Total revenue from ticket sales. |
| `attendance_count` | INTEGER DEFAULT 0 | Number of attendees checked in. |

---

## 3. Tickets

Stores tickets purchased or registered for users.

| Column       | Type          | Description |
|-------------|---------------|-------------|
| `id`        | SERIAL PRIMARY KEY | Unique ID for each ticket. |
| `profile_id`| INTEGER REFERENCES profiles(id) | User who owns the ticket. |
| `event_id`  | INTEGER REFERENCES events(id) | Event associated with the ticket. |
| `ticket_type` | TEXT        | Type of ticket ("Free", "VIP", etc.). |
| `price`     | NUMERIC       | Ticket price. |
| `purchase_date` | TIMESTAMP DEFAULT NOW() | When the ticket was purchased or registered. |
| `qr_code`   | TEXT          | Base64 image of the ticket QR code. |
| `qr_data`   | TEXT UNIQUE   | Unique string encoded in the QR code. |
| `checked_in` | BOOLEAN DEFAULT FALSE | Indicates if the ticket has been scanned at the event. |

---

## 4. Notifications

Stores notifications for users about events.

| Column       | Type          | Description |
|-------------|---------------|-------------|
| `id`        | SERIAL PRIMARY KEY | Unique ID for each notification. |
| `profile_id`| INTEGER REFERENCES profiles(id) | Recipient user of the notification. |
| `event_id`  | INTEGER REFERENCES events(id) | Event the notification is about. |
| `message`   | TEXT          | Notification message. |
| `created_at`| TIMESTAMP DEFAULT NOW() | Timestamp when the notification was created. |

---

## 5. Push Subscriptions

Stores browser push subscription data for sending Web Push notifications.

| Column       | Type          | Description |
|-------------|---------------|-------------|
| `id`        | SERIAL PRIMARY KEY | Unique ID for each subscription. |
| `user_id`   | INTEGER REFERENCES profiles(id) | Profile associated with the subscription. |
| `endpoint`  | TEXT UNIQUE   | Push service endpoint URL. |
| `p256dh`    | TEXT          | Public encryption key for Web Push. |
| `auth`      | TEXT          | Authentication secret for Web Push. |

---

## 🔗 Relationships

- **profiles → events**: `profiles.id = events.created_by`  
- **profiles → tickets**: `profiles.id = tickets.profile_id`  
- **events → tickets**: `events.id = tickets.event_id`  
- **profiles → notifications**: `profiles.id = notifications.profile_id`  
- **profiles → push_subscriptions**: `profiles.id = push_subscriptions.user_id`  

This schema ensures referential integrity and allows efficient querying of events, tickets, and notifications.

## Database Dump

A PostgreSQL dump file `event_management.dump` is included for easy setup of the database.  
To restore the database:

```bash
createdb -U <your_postgres_username> event_management
pg_restore -U <your_postgres_username> -h localhost -d event_management -v event_management.dump```

# 🛣️ API Routes

This section summarizes all backend endpoints, their HTTP methods, authentication requirements, and purpose.

---

## 🔐 Profile Routes

| Method | Endpoint | Auth Required | Description |
|--------|---------|---------------|-------------|
| GET    | `/api/profile` | ✅ | Fetch the authenticated user’s profile. |
| POST   | `/api/profile` | ✅ | Create or update the authenticated user’s profile (name, email, role). |

---

## 🎫 Ticket Routes

| Method | Endpoint | Auth Required | Description |
|--------|---------|---------------|-------------|
| GET    | `/tickets/user` | ✅ | Get all tickets purchased or registered by the authenticated user, including event details. |
| POST   | `/register-paid-ticket` | ✅ | Register a paid ticket for the authenticated user (creates QR code). |
| POST   | `/register-free-ticket` | ✅ | Register a free ticket for the authenticated user (creates QR code). |
| DELETE | `/tickets/:ticketId` | ✅ | Delete a specific ticket by its ID. |
| POST   | `/validate-ticket` | ✅ | Validate a QR code for check-in and mark ticket as checked in. |

---

## 📅 Event Routes

| Method | Endpoint | Auth Required | Description |
|--------|---------|---------------|-------------|
| GET    | `/events` | ✅ | Get all events (ordered by date). |
| POST   | `/events` | ✅ | Create a new event (organizer only). |
| GET    | `/events/:eventId` | ✅ | Get details for a single event by ID. |
| GET    | `/events/user/:auth0Id` | ❌ | Get all events created by a specific user. |
| PUT    | `/events/:id` | ✅ | Update an existing event; sends notifications to attendees. |

---

## 💳 Payment Routes

| Method | Endpoint | Auth Required | Description |
|--------|---------|---------------|-------------|
| POST   | `/create-payment-intent` | ❌ | Create a Stripe payment intent for a given amount (in cents). |

---

## 📊 Analytics Routes

| Method | Endpoint | Auth Required | Description |
|--------|---------|---------------|-------------|
| PUT    | `/analytics/:id` | ❌ | Update event analytics (tickets sold, revenue). |

---

## 🔔 Notification & Push Routes

| Method | Endpoint | Auth Required | Description |
|--------|---------|---------------|-------------|
| GET    | `/notifications` | ✅ | Fetch all notifications for the authenticated user. |
| POST   | `/api/subscribe` | ✅ | Save a push notification subscription for the authenticated user. |

---

## 🔄 Notes

- **✅ Auth Required**: Routes that require a valid Auth0 JWT in the `Authorization` header (`Bearer <token>`).  
- **QR Code Handling**: `/register-paid-ticket`, `/register-free-ticket`, and `/validate-ticket` handle generation and verification of ticket QR codes.  
- **Push Notifications**: Updating events triggers notifications to attendees via `/events/:id` PUT route.  
- **Stripe Payments**: Payment processing is done via `/create-payment-intent` and then ticket registration.  

# 🔐 Authentication

This application uses **Auth0** for user authentication and JWT (JSON Web Token) validation to secure API routes.

---

## 1. Overview

- Users authenticate via **Auth0**, which issues a JWT upon successful login.
- The JWT must be included in the `Authorization` header for protected routes:

```Authorization: Bearer <JWT_TOKEN>```


- The backend verifies the token using:
  - `jsonwebtoken` to decode and validate the token.
  - `jwks-rsa` to fetch the public key from Auth0 for signature verification.
- The server checks:
  - **Issuer**: matches your Auth0 domain.
  - **Audience**: matches your API audience.
  - **Algorithm**: RS256.

- Once validated, the decoded token payload is attached to `req.user`, which includes the Auth0 `sub` (user ID).

---

## 2. Protected Routes

The following routes require a valid JWT:

### Profile
- `GET /api/profile`
- `POST /api/profile`

### Tickets
- `GET /tickets/user`
- `POST /register-paid-ticket`
- `POST /register-free-ticket`
- `DELETE /tickets/:ticketId`
- `POST /validate-ticket`

### Events
- `GET /events`
- `GET /events/:eventId`
- `POST /events`
- `PUT /events/:id`

### Notifications & Push
- `GET /notifications`
- `POST /api/subscribe`

> ⚠️ Routes that **do not require authentication**:
> - `GET /events/user/:auth0Id` (fetch events by a specific user)
> - `POST /create-payment-intent` (Stripe payment intent creation)
> - `PUT /analytics/:id` (event analytics update)

---

## 3. How to Use

1. Obtain a JWT by logging in through Auth0 (usually via frontend).
2. Include the JWT in the `Authorization` header for protected API requests.
3. The server will attach the decoded token to `req.user`, which can be used to access the current user's `auth0_id` and other claims.

---

## 4. Implementation Notes

- Authentication logic is implemented in `verifyJwt` middleware.
- The middleware handles:
  - Missing token → `401 Unauthorized`
  - Invalid token → `401 Unauthorized`
  - Successful verification → `req.user` populated with decoded token
- `req.user.sub` is used to map requests to the corresponding profile in the database.

