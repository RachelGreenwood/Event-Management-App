export default function Analytics({ ticketSales, revenue, expired }) {

    // Exports analytics report as CSV
    const exportCSV = () => {
    const headers = ["Metric", "Value"];
    const rows = [
      ["Ticket Sales", ticketSales],
      ["Attendance", 0],
      ["Revenue Earned (USD)", revenue],
    ];

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(r => r.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics_report_${Date.now()}.csv`);
    document.body.appendChild(link); // required for Firefox
    link.click();
    document.body.removeChild(link);
  };

    return (
        <div>
            <h1>{!expired ? "See Your Analytics" : "Post-Event Feedback Analytics"}</h1>
            <p>Ticket Sales: {ticketSales} </p>
            <p>Attendance: </p>
            <p>0</p>
            <p>Revenue Earned (in USD): {revenue} </p>
            <button onClick={exportCSV}>{expired ? "Export as CSV" : ""}</button>
        </div>
    )
}