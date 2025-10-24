import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthenticationButton() {
    const { loginWithRedirect, logout, user, isAuthenticated, getAccessTokenSilently } = useAuth0();
    const navigate = useNavigate();

    // If user already has a profile, go to Dashboard page. If not, go to Profile Setup page
  useEffect(() => {
    const checkProfile = async () => {
      if (!isAuthenticated) return;

      try {
        const token = await getAccessTokenSilently({
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        });

        const response = await fetch("http://localhost:5000/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 404) {
          navigate("/choose-role");
        } else if (response.ok) {
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Error checking profile:", err);
      }
    };

    checkProfile();
  }, [isAuthenticated]);

    return (
        <div>
            {/* If user isn't logged in, show Log In button. If user is logged in, show Log Out button and personalized welcome */}
            {!isAuthenticated ? (
        <button onClick={() => loginWithRedirect()}>Log In</button>
      ) : (
        <>
          <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
            Log Out
          </button>
        </>
      )}
        </div>
    )
}