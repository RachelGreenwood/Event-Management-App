export default function Analytics({ ticketSales, revenue, expired }) {
    return (
        <div>
            <h1>{!expired ? "See Your Analytics" : "Post-Event Feedback Analytics"}</h1>
            <p>Ticket Sales: {ticketSales} </p>
            <p>Attendance: </p>
            <p>0</p>
            <p>Revenue Earned (in USD): {revenue} </p>
        </div>
    )
}