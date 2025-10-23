import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import ChooseRole from "./components/ChooseRole.jsx";
import HomePage from "./components/HomePage.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Navbar from "./components/Navbar.jsx";

function App() {
  const { loginWithRedirect, logout, user, isAuthenticated, getAccessTokenSilently } = useAuth0();

  function AuthRedirect() {
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const checkProfile = async () => {
      const token = await getAccessTokenSilently();
      const res = await fetch("http://localhost:5000/api/profile", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const profile = await res.json();

      if (!profile.role) {
        // If no role set yet, redirect to ChooseRole page
        navigate("/choose-role");
      } else {
        // Otherwise go home
        navigate("/");
      }
    };

    checkProfile();
  }, [isAuthenticated, user, getAccessTokenSilently, navigate]);

  return null;
}

  return (
    <div>
      <Navbar />
      <AuthRedirect />
      <Routes>
        <Route path="/" element={<HomePage />} />
      <Route path="/choose-role" element={<ChooseRole />} />
      <Route path="/dashboard" element={<Dashboard />} />    
    </Routes>
    </div>
  );
}

export default App;
