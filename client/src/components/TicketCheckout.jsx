import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useAuth0 } from "@auth0/auth0-react";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ amount, userId, eventId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { getAccessTokenSilently } = useAuth0();

//   Handles ticket payments (in cents)
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Handles free tickets
    if (amount === 0) {
    setSuccess(true);
    const token = await getAccessTokenSilently();
    await fetch("http://localhost:5000/register-free-ticket", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
    },
      body: JSON.stringify({ userId, eventId }),
    });
    return;
  }
    console.log("Sending amount to server:", amount, "converted:", amount * 100);

    const response = await fetch("http://localhost:5000/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amount * 100 }),
    });

    const { clientSecret } = await response.json();

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement) },
    });

    if (result.error) {
      setError(result.error.message);
    } else if (result.paymentIntent.status === "succeeded") {
      setSuccess(true);
        // Register ticket in database
  await fetch("http://localhost:5000/register-paid-ticket", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${await getAccessTokenSilently()}`
    },
    body: JSON.stringify({
      eventId,
      ticketType: ticketType,
      price: amount
    }),
    }
)
  };
}

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe}>
        {amount === 0 ? "Get Ticket (Free)" : `Pay $${amount}`}
      </button>
      {error && <div>{error}</div>}
      {success && <div>Payment successful!</div>}
    </form>
  );
};

export default function TicketCheckout({ amount, userId, eventId }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm amount={amount} userId={userId} eventId={eventId} />
    </Elements>
  );
}
