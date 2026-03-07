import { useEffect, useState, useRef } from "react";
import socket from "../socket";

export default function MasterRoom({ roomId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [aiEnabled, setAiEnabled] = useState(false);
  const [guestJoined, setGuestJoined] = useState(false);
  const [ended, setEnded] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    socket.on("connect", () => socket.emit("create_room", { roomId }));
    if (socket.connected) socket.emit("create_room", { roomId });

    socket.on("guest_joined", () => setGuestJoined(true));
    socket.on("receive_message", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("verdict_result", (data) => setVerdict(data));
    socket.on("conversation_ended", () => setEnded(true));
    return () => socket.removeAllListeners();
  }, [roomId]);

  // Auto-scroll on every new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleAI = () => {
    const next = !aiEnabled;
    setAiEnabled(next);
    socket.emit("toggle_ai", { roomId, enabled: next });
  };

  const send = () => {
    if (!input.trim() || aiEnabled) return;
    socket.emit("send_message", { roomId, message: input, sender: "master" });
    setInput("");
  };

  const endConversation = () => {
    socket.emit("end_conversation", { roomId });
    setEnded(true);
  };

  return (
    <div style={styles.container}>
      <h2>🎛️ Host Panel — Room: <code>{roomId}</code></h2>
      <p>Share this code with your guest!</p>

      <div style={styles.controls}>
        <button onClick={toggleAI} style={{ ...styles.btn, background: aiEnabled ? "#dc2626" : "#16a34a" }}>
          {aiEnabled ? "🤖 AI ON — Click to Disable" : "🧑 AI OFF — Click to Enable"}
        </button>
        {!ended && guestJoined && (
          <button onClick={endConversation} style={{ ...styles.btn, background: "#b45309" }}>
            🛑 End Conversation
          </button>
        )}
      </div>

      {!guestJoined && <p style={{ color: "#888" }}>⏳ Waiting for guest to join...</p>}

      <div style={styles.chatBox}>
        {messages.map((m, i) => (
          <div key={i} style={{
            ...styles.bubble,
            alignSelf: m.sender === "master" ? "flex-end" : "flex-start",
            background: m.sender === "master" ? "#4f46e5" : "#e5e7eb",
            color: m.sender === "master" ? "#fff" : "#111"
          }}>
            <strong>{m.sender === "master" ? (aiEnabled ? "🤖 AI" : "You") : "Guest"}:</strong> {m.message}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {!ended && !aiEnabled && guestJoined && (
        <div style={styles.inputRow}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            style={styles.input}
            placeholder="Type a message..."
          />
          <button onClick={send} style={styles.btn}>Send</button>
        </div>
      )}
      {aiEnabled && <p style={{ color: "#888", fontStyle: "italic" }}>AI is handling replies automatically.</p>}

      {verdict && (
        <div style={{ marginTop: "20px", padding: "16px", background: verdict.correct ? "#dcfce7" : "#fee2e2", borderRadius: "8px" }}>
          <h3>{verdict.correct ? "✅ Guest guessed correctly!" : "❌ Guest guessed wrong!"}</h3>
          <p>Guest said: <strong>{verdict.verdict === "ai" ? "AI" : "Human"}</strong></p>
          <p>It was actually: <strong>{verdict.actuallyAI ? "AI 🤖" : "Human 🧑"}</strong></p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth:"600px", margin:"40px auto", fontFamily:"sans-serif", padding:"0 16px" },
  controls: { display:"flex", gap:"10px", marginBottom:"16px", flexWrap:"wrap" },
  chatBox: { border:"1px solid #e5e7eb", borderRadius:"8px", height:"350px", overflowY:"auto", padding:"12px", display:"flex", flexDirection:"column", gap:"8px", background:"#f9fafb" },
  bubble: { maxWidth:"75%", padding:"10px 14px", borderRadius:"16px", fontSize:"14px" },
  inputRow: { display:"flex", gap:"8px", marginTop:"12px" },
  input: { flex:1, padding:"10px", fontSize:"16px", borderRadius:"8px", border:"1px solid #ccc" },
  btn: { padding:"10px 18px", fontSize:"14px", cursor:"pointer", borderRadius:"8px", border:"none", color:"#fff", background:"#4f46e5" },
};
