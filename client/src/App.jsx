import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import ChooseRole from "./components/ChooseRole.jsx";
import HomePage from "./components/HomePage.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Navbar from "./components/Navbar.jsx";
import CreateEvent from "./components/CreateEvent.jsx";
import SeeEvents from "./components/SeeEvents.jsx";
import MyEvents from "./components/MyEvents.jsx";
import Event from "./components/Event.jsx";
import MyTickets from "./components/MyTickets.jsx";

function App() {
  const { loginWithRedirect, logout, user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isAuthenticated || !user) return;

      try {
        const token = await getAccessTokenSilently();
        const response = await fetch(`http://localhost:5000/api/profile/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, [isAuthenticated, user, getAccessTokenSilently]);

  return (
    <div>
      <Navbar profile={profile} />
      <Routes>
        <Route path="/" element={<HomePage />} />
      <Route path="/choose-role" element={<ChooseRole setProfile={setProfile} />} />
      <Route path="/dashboard" element={<Dashboard />} />   
      <Route path="/create-event" element={<CreateEvent />} /> 
      <Route path="/events" element={<SeeEvents />} />
      <Route path="/my-events" element={<MyEvents />} />
      <Route path="/event/:eventId" element={<Event />} />
      <Route path="/my-tickets" element={<MyTickets />} />
    </Routes>
    </div>
  );
}

export default App;
