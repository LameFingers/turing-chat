import { useState } from "react";
import MasterRoom from "./pages/MasterRoom";
import GuestRoom from "./pages/GuestRoom";

export default function App() {
  const [role, setRole] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [inputRoom, setInputRoom] = useState("");

  if (!role) {
    return (
      <div style={styles.center}>
        <h1>🧠 Turing Chat</h1>
        <p>Are you the host or the guesser?</p>
        <div style={styles.row}>
          <button style={styles.btn} onClick={() => {
            const id = Math.random().toString(36).substring(2, 8).toUpperCase();
            setRoomId(id);
            setRole("master");
          }}>
            🎛️ Start as Host
          </button>
        </div>
        <hr style={{ width: "100%", margin: "20px 0" }} />
        <div style={styles.row}>
          <input
            placeholder="Enter Room Code"
            value={inputRoom}
            onChange={(e) => setInputRoom(e.target.value.toUpperCase())}
            style={styles.input}
          />
          <button style={styles.btn} onClick={() => {
            setRoomId(inputRoom);
            setRole("guest");
          }}>
            🚪 Join as Guest
          </button>
        </div>
      </div>
    );
  }

  return role === "master"
    ? <MasterRoom roomId={roomId} />
    : <GuestRoom roomId={roomId} />;
}

const styles = {
  center: { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"sans-serif", gap:"12px" },
  row: { display:"flex", gap:"10px", alignItems:"center" },
  btn: { padding:"10px 20px", fontSize:"16px", cursor:"pointer", borderRadius:"8px", border:"none", background:"#4f46e5", color:"#fff" },
  input: { padding:"10px", fontSize:"16px", borderRadius:"8px", border:"1px solid #ccc", width:"180px" },
};
