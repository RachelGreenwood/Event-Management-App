import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import QrReader from "react-qr-reader-es6";

export default function ScanQRCode({ eventId }) {
  const { getAccessTokenSilently } = useAuth0();
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleScan = async (data) => {
    if (!data || loading) return; // avoid multiple scans
    setLoading(true);
    setError("");
    setScanResult(null);

    try {
      const token = await getAccessTokenSilently();
      const res = await fetch("http://localhost:5000/validate-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ qrCode: data, eventId }),
      });

      const response = await res.json();

      if (response.valid) {
        setScanResult({
          status: "✅ Ticket valid",
          details: response.ticket,
        });
      } else {
        setScanResult({
          status: "❌ Invalid ticket",
          message: response.message,
        });
      }
    } catch (err) {
      console.error("Error validating ticket:", err);
      setError("Error validating ticket. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleError = (err) => {
    console.error(err);
    setError("Camera access error. Please allow camera permissions.");
  };

  return (
    <div>
      <h1>Scan QR Code</h1>
      <div>
        <QrReader delay={500} onError={handleError} onScan={handleScan} />
      </div>
      {loading && <p>Validating ticket...</p>}
      {error && <p>{error}</p>}

      {scanResult && (
        <div>
          <h2>{scanResult.status}</h2>
          {scanResult.details && (
            <div>
              <p>
                <strong>Ticket Type:</strong> {scanResult.details.ticket_type}
              </p>
              <p>
                <strong>Purchased:</strong>{" "}
                {new Date(scanResult.details.purchase_date).toLocaleString()}
              </p>
              <p>
                <strong>Event:</strong> {scanResult.details.event_name}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(scanResult.details.event_date).toLocaleDateString()}
              </p>
            </div>
          )}
          {scanResult.message && <p>{scanResult.message}</p>}
        </div>
      )}
    </div>
  );
}
