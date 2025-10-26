export default function Analytics({ ticketSales, revenue }) {
    return (
        <div>
            <h1>See Your Analytics</h1>
            <p>Ticket Sales: {ticketSales} </p>
            <p>Attendance: </p>
            <p>0</p>
            <p>Revenue Earned (in USD): {revenue} </p>
        </div>
    )
}