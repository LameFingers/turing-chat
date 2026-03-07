import { useEffect, useState, useRef } from "react";
import socket from "../socket";

export default function GuestRoom({ roomId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [ended, setEnded] = useState(false);
  const [verdict, setVerdict] = useState(null);
  const [result, setResult] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    socket.emit("join_room", { roomId });
    socket.on("receive_message", (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("conversation_ended", () => setEnded(true));
    socket.on("verdict_result", (data) => setResult(data));
    socket.on("error", ({ message }) => alert(message));
    return () => socket.removeAllListeners();
  }, [roomId]);

  // Auto-scroll on every new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim() || ended) return;
    socket.emit("send_message", { roomId, message: input, sender: "guest" });
    setInput("");
  };

  const submitVerdict = (choice) => {
    setVerdict(choice);
    socket.emit("submit_verdict", { roomId, verdict: choice });
  };

  return (
    <div style={styles.container}>
      <h2>🚪 Guest — Room: <code>{roomId}</code></h2>

      <div style={styles.chatBox}>
        {messages.map((m, i) => (
          <div key={i} style={{
            ...styles.bubble,
            alignSelf: m.sender === "guest" ? "flex-end" : "flex-start",
            background: m.sender === "guest" ? "#4f46e5" : "#e5e7eb",
            color: m.sender === "guest" ? "#fff" : "#111"
          }}>
            <strong>{m.sender === "guest" ? "You" : "Host"}:</strong> {m.message}
          </div>
        ))}

        {ended && !verdict && (
          <div style={{ textAlign:"center", marginTop:"12px", padding:"16px", background:"#fef9c3", borderRadius:"8px" }}>
            <p style={{ fontWeight:"bold" }}>🔍 Conversation ended. Was the host a human or AI?</p>
            <div style={{ display:"flex", gap:"12px", justifyContent:"center", marginTop:"10px" }}>
              <button onClick={() => submitVerdict("human")} style={{ ...styles.btn, background:"#16a34a" }}>🧑 Human</button>
              <button onClick={() => submitVerdict("ai")} style={{ ...styles.btn, background:"#dc2626" }}>🤖 AI</button>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {!ended && (
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

      {result && (
        <div style={{ marginTop:"16px", padding:"16px", background: result.correct ? "#dcfce7" : "#fee2e2", borderRadius:"8px" }}>
          <h3>{result.correct ? "✅ You guessed correctly!" : "❌ Wrong guess!"}</h3>
          <p>You said: <strong>{result.verdict === "ai" ? "AI" : "Human"}</strong></p>
          <p>It was: <strong>{result.actuallyAI ? "AI 🤖" : "Human 🧑"}</strong></p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth:"600px", margin:"40px auto", fontFamily:"sans-serif", padding:"0 16px" },
  chatBox: { border:"1px solid #e5e7eb", borderRadius:"8px", height:"380px", overflowY:"auto", padding:"12px", display:"flex", flexDirection:"column", gap:"8px", background:"#f9fafb" },
  bubble: { maxWidth:"75%", padding:"10px 14px", borderRadius:"16px", fontSize:"14px" },
  inputRow: { display:"flex", gap:"8px", marginTop:"12px" },
  input: { flex:1, padding:"10px", fontSize:"16px", borderRadius:"8px", border:"1px solid #ccc" },
  btn: { padding:"10px 18px", fontSize:"14px", cursor:"pointer", borderRadius:"8px", border:"none", color:"#fff", background:"#4f46e5" },
};
