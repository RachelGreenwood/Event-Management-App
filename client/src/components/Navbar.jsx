import AuthenticationButton from "./AuthenticationButton"
import CreateEvent from "./CreateEvent"
import { Link } from "react-router-dom"

export default function Navbar() {
    return (
        <div>
            <nav>
                <ul>
                    <li><AuthenticationButton /></li>
                    <li><Link to="/create-event">Create an Event</Link></li>
                    <li><Link to="/events">See All Events</Link></li>
                    <li><Link to="/my-events">My Events</Link></li>
                </ul>
            </nav>
        </div>
    )
}