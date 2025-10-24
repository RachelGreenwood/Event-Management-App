import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import ChooseRole from "./components/ChooseRole.jsx";
import HomePage from "./components/HomePage.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Navbar from "./components/Navbar.jsx";
import CreateEvent from "./components/CreateEvent.jsx";
import SeeEvents from "./components/SeeEvents.jsx";
import MyEvents from "./components/MyEvents.jsx";

function App() {
  const { loginWithRedirect, logout, user, isAuthenticated, getAccessTokenSilently } = useAuth0();

  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
      <Route path="/choose-role" element={<ChooseRole />} />
      <Route path="/dashboard" element={<Dashboard />} />   
      <Route path="/create-event" element={<CreateEvent />} /> 
      <Route path="/events" element={<SeeEvents />} />
      <Route path="/my-events" element={<MyEvents />} />
    </Routes>
    </div>
  );
}

export default App;
