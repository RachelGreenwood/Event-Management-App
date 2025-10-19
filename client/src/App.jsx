import { useEffect, useState } from "react";

function App() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/users")
      .then((res) => res.json())
      .then(setUsers)
      .catch(console.error);
  }, []);

  return (
    <div>
      <h1>Event Management App</h1>
      <ul>
        {users.map((u) => (
          <li key={u.id}>{u.name} – {u.email}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
