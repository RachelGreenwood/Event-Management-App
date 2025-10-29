import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import Analytics from "./Analytics";
import TicketCheckout from "./TicketCheckout";

export default function Event() {
  const { eventId } = useParams();
  const { getAccessTokenSilently, user } = useAuth0();
  const [event, setEvent] = useState(null);
  const [ticketSales, setTicketSales] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [expired, setExpired] = useState(false);
  const [profile, setProfile] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const token = await getAccessTokenSilently();
        const res = await fetch(`http://localhost:5000/events/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch event");
        const data = await res.json();
        setEvent(data);
        setFormData(data);
        setTicketSales(data.tickets_sold || 0);
        setRevenue(data.revenue || 0);
      } catch (err) {
        console.error(err);
      }
    };

    fetchEvent();
  }, [eventId, getAccessTokenSilently]);

  useEffect(() => {
  if (!event?.end_date) return;

  const endDate = new Date(event.end_date);
  const checkExpiration = () => {
    setExpired(Date.now() > endDate.getTime());
  };

  checkExpiration(); // run once immediately
  const interval = setInterval(checkExpiration, 60 * 1000); // recheck every minute

  return () => clearInterval(interval);
}, [event]);

useEffect(() => {
  const fetchProfile = async () => {
    const token = await getAccessTokenSilently();
    const res = await fetch("http://localhost:5000/api/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
    }
  };
  fetchProfile();
}, [getAccessTokenSilently]);


  const handleTicketPurchase = async (amount) => {
  try {
    const token = await getAccessTokenSilently();
    const res = await fetch(`http://localhost:5000/events/${eventId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
       },
      body: JSON.stringify({
        tickets_sold: ticketSales + 1,
        revenue: revenue + amount
      }),
    });

    if (!res.ok) throw new Error("Failed to update event");

    const updatedEvent = await res.json();
    setTicketSales(updatedEvent.tickets_sold);
    setRevenue(updatedEvent.revenue);
  } catch (err) {
    console.error("Error updating event:", err);
  }
};

// Handle editing the event
  const handleEditChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveEdits = async (e) => {
    e.preventDefault();
    try {
      const token = await getAccessTokenSilently();
      const res = await fetch(`http://localhost:5000/events/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save event edits");

      const updated = await res.json();
      setEvent(updated);
      setEditMode(false);
      alert("Event updated successfully!");
    } catch (err) {
      console.error("Error saving edits:", err);
      alert("Failed to save event changes.");
    }
  };

  if (!event) return <p>Loading...</p>;

   if (editMode) {
    return (
      <div>
        <h1>Edit Event</h1>
        <form onSubmit={handleSaveEdits}>
          <input
            name="name"
            value={formData.name || ""}
            onChange={handleEditChange}
            placeholder="Event name"
          />
          <textarea
            name="description"
            value={formData.description || ""}
            onChange={handleEditChange}
            placeholder="Description"
          />
          <input
            name="venue"
            value={formData.venue || ""}
            onChange={handleEditChange}
            placeholder="Venue"
          />
          <textarea
            name="schedule"
            value={formData.schedule || ""}
            onChange={handleEditChange}
            placeholder="Schedule"
          />
          <input
            name="performer"
            value={formData.performer || ""}
            onChange={handleEditChange}
            placeholder="Performer"
          />
          <button type="submit">Save Changes</button>
          <button type="button" onClick={() => setEditMode(false)}>
            Cancel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h1>{formData.name}</h1>
      <p>Description: {formData.description}</p>
      <p>Date: {new Date(event.event_date).toLocaleString()}</p>
      <p>Venue:{formData.venue}</p>
      <p>Schedule: {formData.schedule}</p>
      <p>Performer: {formData.performer}</p>
      <div>Tickets: {event.ticket_types?.map((t, i) => (
        <div key={i}><span>{t} (${event.prices[i]})</span><TicketCheckout amount={event.prices[i]} expired={expired} userId={user?.sub} eventId={eventId} ticketType={event.ticket_types[i]} profile={profile} onTicketSold={() => handleTicketPurchase(event.prices[i])} /></div>
      ))}</div>
      <button onClick={() => setEditMode(true)}>Edit Event</button>
      {(profile.role === "organizer" || profile.role === "vendor") && <Analytics ticketSales={ticketSales} revenue={revenue} expired={expired} profile={profile} attendance={event.attendance_count} />}
    </div>
  );
}
