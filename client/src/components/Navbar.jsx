import AuthenticationButton from "./AuthenticationButton"
import { Link } from "react-router-dom";

export default function Navbar({ profile }) {

    return (
        <div>
            <nav>
                <ul>
                    <li><AuthenticationButton /></li>
                    <li><Link to="/dashboard">Dashboard</Link></li>
                    {profile?.role === "organizer" && (
                        <li><Link to="/create-event">Create an Event</Link></li>
                    )}
                    <li><Link to="/events">See All Events</Link></li>
                    {profile?.role === "organizer" && (
                        <li><Link to="/my-events">My Events</Link></li>
                    )}
                    <li><Link to="/my-tickets">My Tickets</Link></li>
                </ul>
            </nav>
        </div>
    )
}