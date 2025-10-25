import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import Analytics from "./Analytics";

export default function Event() {
  const { eventId } = useParams();
  const { getAccessTokenSilently } = useAuth0();
  const [event, setEvent] = useState(null);

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
      } catch (err) {
        console.error(err);
      }
    };

    fetchEvent();
  }, [eventId, getAccessTokenSilently]);

  if (!event) return <p>Loading...</p>;

  return (
    <div>
      <h1>{event.name}</h1>
      <p>Description: {event.description}</p>
      <p>Date: {new Date(event.event_date).toLocaleString()}</p>
      <p>Venue:{event.venue}</p>
      <p>Schedule: {event.schedule}</p>
      <p>Performer: {event.performer}</p>
      <p>Tickets: {event.ticket_types?.map((t, i) => (
        <span key={i}>{t} (${event.prices[i]}) <button>Buy Ticket</button> </span>
      ))}</p>
      <Analytics />
    </div>
  );
}
