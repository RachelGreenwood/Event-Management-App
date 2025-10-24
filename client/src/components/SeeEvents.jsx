import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

export default function SeeEvents() {

  const [events, setEvents] = useState([]);
  const { getAccessTokenSilently } = useAuth0();

  useEffect(() => {
      const getEvents = async () => {
        try {
          const token = await getAccessTokenSilently();
          const response = await fetch("http://localhost:5000/events", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) {
            throw new Error("Failed to fetch events");
          }
          const data = await response.json();
          setEvents(data);
        } catch (err) {
          console.error("Error fetching events:", err);
        }
      };
  
      getEvents();
    }, [getAccessTokenSilently]);

  return (
    <div>
      <h1>See All Events</h1>
      {events.length === 0 ? ( <p>No events found. Check back later!</p> ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Date</th>
              <th>Venue</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td>{event.name}</td>
                <td>{new Date(event.event_date).toLocaleString()}</td>
                <td>{event.venue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
