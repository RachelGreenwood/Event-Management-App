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

    // Handle ticket type/price array changes
  const handleTicketChange = (index, field, value) => {
    const updatedTickets = [...formData.ticket_types];
    const updatedPrices = [...formData.prices];

    if (field === "type") {
      updatedTickets[index] = value;
    } else {
      updatedPrices[index] = value;
    }

    setFormData({ ...formData, ticket_types: updatedTickets, prices: updatedPrices });
  };

  // Add icket type
  const addTicketField = () => {
    setFormData({
      ...formData,
      ticket_types: [...formData.ticket_types, ""],
      prices: [...formData.prices, ""],
    });
  };

  // Remove ticket type
  const removeTicketField = (index) => {
    const updatedTickets = [...formData.ticket_types];
    const updatedPrices = [...formData.prices];
    updatedTickets.splice(index, 1);
    updatedPrices.splice(index, 1);
    setFormData({ ...formData, ticket_types: updatedTickets, prices: updatedPrices });
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
              <label>Ticket Types and Prices</label>
              {formData.ticket_types.map((type, index) => (
                <div key={index}>
                  <input type="text" placeholder="Ticket Type (e.g. VIP)" value={type} onChange={(e) => handleTicketChange(index, "type", e.target.value)} />
                  <input type="number" placeholder="Price (in $USD)" value={formData.prices[index]} onChange={(e) => handleTicketChange(index, "price", e.target.value)} />
                  <button type="button" onClick={() => removeTicketField(index)}>Remove Ticket Type</button>
                </div>
              ))}
              <button type="button" onClick={addTicketField}>Add Ticket Type</button>
            </div>
            <div>
                <label>Venue: </label>
                <input type="text" name="venue" value={formData.venue} onChange={handleChange} />
            </div>
            <div>
              <label>Event Schedule: </label>
              <textarea name="schedule" value={formData.schedule} onChange={handleChange} rows={"2"} />
            </div>
        </form>
    </div>
  )
}