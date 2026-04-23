import { useEffect, useState, useRef } from "react";
import socket from "../socket";

function Timestamp({ ts }) {
  const d = new Date(ts);
  return (
    <span style={{ fontSize: "10px", opacity: 0.45, marginTop: "3px", display: "block" }}>
      {d.getHours().toString().padStart(2,"0")}:{d.getMinutes().toString().padStart(2,"0")}
    </span>
  );
}

export default function GuestRoom({ roomId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [ended, setEnded]       = useState(false);
  const [verdict, setVerdict]   = useState(null);
  const [result, setResult]     = useState(null);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    socket.emit("join_room", { roomId });
    socket.on("receive_message",    (msg)  => setMessages((prev) => [...prev, msg]));
    socket.on("conversation_ended", ()     => setEnded(true));
    socket.on("verdict_result",     (data) => setResult(data));
    socket.on("error", ({ message }) => alert(message));
    return () => socket.removeAllListeners();
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim() || ended) return;
    socket.emit("send_message", { roomId, message: input, sender: "guest" });
    setInput("");
    inputRef.current?.focus();
  };

  const submitVerdict = (choice) => {
    setVerdict(choice);
    socket.emit("submit_verdict", { roomId, verdict: choice });
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logoRow}>
          <svg width="24" height="24" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="10" fill="url(#glg)" />
            <circle cx="18" cy="14" r="5" fill="white" opacity="0.9" />
            <path d="M10 26c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />
            <defs>
              <linearGradient id="glg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                <stop stopColor="#8B5CF6" /><stop offset="1" stopColor="#6366F1" />
              </linearGradient>
            </defs>
          </svg>
          <span style={styles.logoText}>Turing Chat</span>
        </div>
        <div style={styles.roomBadge}>
          <span style={styles.roomBadgeLabel}>ROOM</span>
          <span style={styles.roomBadgeCode}>{roomId}</span>
        </div>
        <div style={styles.guestTag}>Guest</div>
      </header>

      {/* Chat area */}
      <div style={styles.chatBox}>
        {messages.length === 0 && !ended && (
          <div style={styles.emptyState}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#2a2a42" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p style={{ marginTop: "14px", color: "#3a3a52", fontSize: "14px", textAlign: "center", maxWidth: "260px" }}>
              You're connected! The host will start the conversation.
            </p>
            <p style={{ marginTop: "6px", color: "#2e2e48", fontSize: "12px" }}>
              Your goal: figure out if you're talking to a human or AI.
            </p>
          </div>
        )}

        {messages.map((m, i) => {
          const isMe = m.sender === "guest";
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", marginBottom: "4px" }}>
              <div style={{ fontSize: "10px", color: "#4a4a62", marginBottom: "3px", paddingLeft: "4px", paddingRight: "4px" }}>
                {isMe ? "You" : "Host"}
              </div>
              <div style={{
                ...styles.bubble,
                background: isMe ? "linear-gradient(135deg, #7c3aed, #5b21b6)" : "#1e1e2e",
                color: isMe ? "#fff" : "#d0d0e8",
                borderBottomRightRadius: isMe ? "4px" : "16px",
                borderBottomLeftRadius: isMe ? "16px" : "4px",
                border: isMe ? "none" : "1px solid #2a2a3a",
              }}>
                {m.message}
              </div>
              <Timestamp ts={m.timestamp} />
            </div>
          );
        })}

        {/* Verdict prompt */}
        {ended && !verdict && (
          <div style={styles.verdictPrompt}>
            <div style={styles.verdictIcon}>🔍</div>
            <h3 style={styles.verdictTitle}>Conversation over</h3>
            <p style={styles.verdictQuestion}>Was the host a human or an AI?</p>
            <div style={styles.verdictBtns}>
              <button onClick={() => submitVerdict("human")} style={styles.verdictHuman}>
                🧑 Human
              </button>
              <button onClick={() => submitVerdict("ai")} style={styles.verdictAI}>
                🤖 AI
              </button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={styles.inputArea}>
        {!ended ? (
          <div style={styles.inputRow}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              style={styles.input}
              placeholder="Type a message…"
            />
            <button onClick={send} style={styles.sendBtn} disabled={!input.trim()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        ) : verdict ? (
          <div style={styles.waitingBar}>Waiting for result…</div>
        ) : (
          <div style={styles.waitingBar}>Make your verdict above ↑</div>
        )}
      </div>

      {/* Result overlay */}
      {result && (
        <div style={styles.overlay}>
          <div style={styles.resultCard}>
            <div style={{ fontSize: "52px", marginBottom: "12px" }}>
              {result.correct ? "🎉" : "😅"}
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#f0f0fa", marginBottom: "8px" }}>
              {result.correct ? "You got it right!" : "You were fooled!"}
            </h2>
            <p style={{ color: "#7a7a9a", fontSize: "14px", marginBottom: "20px", lineHeight: "1.6" }}>
              You guessed <strong style={{ color: "#c0c0e0" }}>{result.verdict === "ai" ? "AI 🤖" : "Human 🧑"}</strong>
              <br />
              It was actually <strong style={{ color: "#c0c0e0" }}>{result.actuallyAI ? "AI 🤖" : "Human 🧑"}</strong>
            </p>
            <div style={{
              padding: "10px 24px", borderRadius: "8px", display: "inline-block",
              fontSize: "14px", fontWeight: "600",
              background: result.correct ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
              border: `1px solid ${result.correct ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
              color: result.correct ? "#4ade80" : "#f87171",
            }}>
              {result.correct ? "✓ Correct" : "✗ Wrong"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", background: "#0f0f13" },

  header: {
    display: "flex", alignItems: "center", gap: "12px",
    padding: "14px 24px", borderBottom: "1px solid #1e1e2a",
    background: "#13131a", flexShrink: 0,
  },
  logoRow: { display: "flex", alignItems: "center", gap: "8px" },
  logoText: { fontSize: "15px", fontWeight: "700", color: "#e0e0f0" },
  roomBadge: {
    marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px",
    background: "#0f0f18", border: "1px solid #2a2a38",
    borderRadius: "8px", padding: "5px 12px",
  },
  roomBadgeLabel: { fontSize: "10px", fontWeight: "700", color: "#3a3a52", letterSpacing: "1px" },
  roomBadgeCode: { fontSize: "14px", fontWeight: "700", color: "#8b5cf6", fontFamily: "monospace", letterSpacing: "2px" },
  guestTag: {
    fontSize: "11px", fontWeight: "700", color: "#6366f1",
    background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
    borderRadius: "6px", padding: "4px 10px",
  },

  chatBox: {
    flex: 1, overflowY: "auto",
    padding: "24px 24px 12px", display: "flex",
    flexDirection: "column", gap: "2px",
  },
  emptyState: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", marginTop: "80px",
  },
  bubble: {
    maxWidth: "68%", padding: "10px 14px",
    borderRadius: "16px", fontSize: "14px", lineHeight: "1.5",
    wordBreak: "break-word",
  },

  verdictPrompt: {
    margin: "24px auto", padding: "28px 32px",
    background: "#16161f", border: "1px solid #2a2a3a",
    borderRadius: "16px", textAlign: "center", maxWidth: "340px", width: "100%",
  },
  verdictIcon: { fontSize: "32px", marginBottom: "10px" },
  verdictTitle: { fontSize: "16px", fontWeight: "700", color: "#e0e0f0", marginBottom: "6px" },
  verdictQuestion: { fontSize: "13px", color: "#7a7a9a", marginBottom: "18px" },
  verdictBtns: { display: "flex", gap: "10px", justifyContent: "center" },
  verdictHuman: {
    padding: "11px 24px", fontSize: "14px", fontWeight: "600",
    background: "rgba(34,197,94,0.1)", color: "#4ade80",
    border: "1px solid rgba(34,197,94,0.3)", borderRadius: "10px", cursor: "pointer",
  },
  verdictAI: {
    padding: "11px 24px", fontSize: "14px", fontWeight: "600",
    background: "rgba(239,68,68,0.1)", color: "#f87171",
    border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", cursor: "pointer",
  },

  inputArea: {
    padding: "16px 24px", borderTop: "1px solid #1e1e2a",
    background: "#13131a", flexShrink: 0,
  },
  inputRow: { display: "flex", gap: "10px" },
  input: {
    flex: 1, padding: "12px 16px", fontSize: "14px",
    background: "#0f0f18", color: "#e0e0f0",
    border: "1px solid #2a2a38", borderRadius: "10px", outline: "none",
  },
  sendBtn: {
    padding: "12px 16px", background: "linear-gradient(135deg, #8B5CF6, #6366F1)",
    color: "#fff", border: "none", borderRadius: "10px",
    cursor: "pointer", display: "flex", alignItems: "center",
  },
  waitingBar: {
    padding: "12px 16px", background: "#0f0f18",
    border: "1px solid #2a2a38", borderRadius: "10px",
    fontSize: "13px", color: "#5a5a7a", textAlign: "center",
  },

  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
    display: "flex", alignItems: "center", justifyContent: "center",
    backdropFilter: "blur(6px)", zIndex: 100,
  },
  resultCard: {
    background: "#16161f", border: "1px solid #2a2a38",
    borderRadius: "20px", padding: "40px 48px", textAlign: "center",
    boxShadow: "0 32px 80px rgba(0,0,0,0.6)", maxWidth: "400px", width: "90%",
  },
};
