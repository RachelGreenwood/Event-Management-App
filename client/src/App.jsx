import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import ChooseRole from "./components/ChooseRole.jsx";
import HomePage from "./components/HomePage.jsx";
import Dashboard from "./components/Dashboard.jsx";
import NavBar from "./components/Navbar.jsx";

function App() {
  const { loginWithRedirect, logout, user, isAuthenticated, getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    const createProfile = async () => {
      // If user is not logged in and doesn't have an account, create profile
      if (!isAuthenticated || !user) return;

      try {
        const accessToken = await getAccessTokenSilently();
        const response = await fetch("http://localhost:5000/api/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            name: user.name,
            email: user.email,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to sync profile");
        }

        const profile = await response.json();
        console.log("Profile synced:", profile);
      } catch (err) {
        console.error("Error syncing profile:", err);
      }
    };

    createProfile();
  }, [isAuthenticated, user, getAccessTokenSilently]);

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
      {!isAuthenticated ? (
        <button onClick={() => loginWithRedirect()}>Log In</button>
      ) : (
        <>
          <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
            Log Out
          </button>
        </>
      )}
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
