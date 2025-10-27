import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Link } from "react-router-dom";

export default function MyTickets() {
    const [events, setEvents] = useState([]);
    const { getAccessTokenSilently, isAuthenticated, user } = useAuth0();

    useEffect(() => {
    if (isAuthenticated && user?.sub) {
      fetchUserEvents();
    }
  }, [isAuthenticated, user]);

    const fetchUserEvents = async () => {
    try {
    const token = await getAccessTokenSilently();
      const response = await fetch("http://localhost:5000/tickets/user", {
        headers: {
            Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch user events");
      const data = await response.json();
      console.log(data);
      setEvents(data);
    } catch (err) {
      console.error("Error fetching user events:", err);
    }
  };

    return (
        <div>
            <h1>My Tickets</h1>
            <table>
                <thead>
                    <tr>
                    <th>Name</th>
                    <th>Date</th>
                    <th>Venue</th>
                    <th>Ticket Type</th>
                    </tr>
                </thead>
                <tbody>
                    {events.map((event) => (
                    <tr key={event.id}>
                        <td><Link to={`/event/${event.event_id}`}>{event.event_name}</Link></td>
                        <td>{new Date(event.event_date).toLocaleString()}</td>
                        <td>{event.venue}</td>
                        <td>{event.ticket_type}</td>
                    </tr>
                    ))}
                </tbody>
        </table>
        </div>
    )
}