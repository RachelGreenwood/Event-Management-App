import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth0 } from "@auth0/auth0-react";

export default function CreateEvent({userId}) {
  const { getAccessTokenSilently, user } = useAuth0();
  const [formData, setFormData] = useState({
      name: "",
      event_date: "",
      end_date: "",
      description: "",
      ticket_types: [""],
      prices: [""],
      venue: "",
      schedule: "",
      performer: "",
      max_capacity: ""
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
      const token = await getAccessTokenSilently();
      const res = await fetch("http://localhost:5000/events", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
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
                <DatePicker selected={formData.event_date} onChange={(date) => setFormData({...formData, event_date: date})} showTimeSelect timeFormat="HH:mm" timeIntervals={15} dateFormat="yyyy--MM-dd HH:mm" />
            </div>
            <div>
              <label>End Date: </label>
              <DatePicker selected={formData.end_date} onChange={(date) => setFormData({...formData, end_date: date })} showTimeSelect timeFormat="HH:mm" timeIntervals={15} dateFormat="yyyy--MM--dd HH:mm" />
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
            <div>
              <label>Performer: </label>
              <input type="text" name="performer" onChange={handleChange} value={formData.performer} />
            </div>
            <div>
              <label>Maximum Attendance Capacity: </label>
              <input type="number" name="max_capacity" value={formData.max_capacity} onChange={handleChange} />
            </div>
            <button type="submit">Create Event</button>
        </form>
    </div>
  )
}