import React, { useState } from "react";

export default function CreateEvent() {
    const [formData, setFormData] = useState({
        name: "",
        event_date: "",
        description: "",
        ticket_types: [""],
        prices: [""],
        venue: "",
        schedule: "",
        performer: "",
    });

    // Updates form with user's input
    const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

//   Handles submit button
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Sends event data to BE
     try {
      const res = await fetch("http://localhost:5000/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          prices: formData.prices.map(Number),
          created_by: userId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Event created successfully!");
        console.log("Event:", data);
      } else {
        alert("Error creating event.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error.");
    }
  };
    
  return (
    <div>
        <form onSubmit={handleSubmit}>
            <div>
                <label>Event Name: </label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} />
            </div>
            <div>
                <label>Event Date: </label>
                <input type="date" name="date" value={formData.event_date} onChange={handleChange} />
            </div>
            <div>
                <label>Description: </label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="4" />
            </div>
            <div>
                <label>Venue: </label>
                <input type="text" name="venue" value={formData.venue} onChange={handleChange} />
            </div>
        </form>
    </div>
  )
}