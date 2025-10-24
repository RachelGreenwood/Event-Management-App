import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Link } from "react-router-dom"

export default function MyEvents() {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const [myEvents, setMyEvents] = useState([]);

  useEffect(() => {
    if (isAuthenticated && user?.sub) {
      fetchUserEvents(user.sub);
    }
  }, [isAuthenticated, user]);

  const fetchUserEvents = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/events/user/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch user events");
      const data = await response.json();
      setMyEvents(data);
    } catch (err) {
      console.error("Error fetching user events:", err);
    }
  };

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <h1>My Events</h1>
      {myEvents.length === 0 ? (
        <p>No events found. Create one on the Create Event page!</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Date/Time</th>
            </tr>
          </thead>
          <tbody>
            {myEvents.map((event) => (
              <tr key={event.id}>
                <td><Link to={`/event/${event.id}`}>{event.name}</Link></td>
                <td>{event.description}</td>
                <td>{new Date(event.event_date).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
