import { useEffect, useState, useRef } from "react";
import socket from "../socket";

const PERSONA_META = {
  college_student: { label: "College Student", emoji: "🎓", color: "#22c55e", desc: "Casual, friendly student" },
  scammer:         { label: "Scammer",         emoji: "🕵️", color: "#ef4444", desc: "Gradual social engineer" },
  combination:     { label: "Combination",     emoji: "🎭", color: "#f59e0b", desc: "Student → scammer arc" },
};

function Timestamp({ ts }) {
  const d = new Date(ts);
  return (
    <span style={{ fontSize: "10px", opacity: 0.45, marginTop: "3px", display: "block" }}>
      {d.getHours().toString().padStart(2,"0")}:{d.getMinutes().toString().padStart(2,"0")}
    </span>
  );
}

export default function MasterRoom({ roomId }) {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState("");
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiPersona, setAiPersona] = useState("college_student");
  const [guestJoined, setGuestJoined] = useState(false);
  const [ended, setEnded]         = useState(false);
  const [verdict, setVerdict]     = useState(null);
  const [copied, setCopied]       = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    socket.on("connect", () => socket.emit("create_room", { roomId }));
    if (socket.connected) socket.emit("create_room", { roomId });
    socket.on("guest_joined",     () => setGuestJoined(true));
    socket.on("receive_message",  (msg) => setMessages((prev) => [...prev, msg]));
    socket.on("verdict_result",   (data) => setVerdict(data));
    socket.on("conversation_ended", () => setEnded(true));
    socket.on("persona_status",   ({ persona }) => setAiPersona(persona));
    return () => socket.removeAllListeners();
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleAI = () => {
    const next = !aiEnabled;
    setAiEnabled(next);
    socket.emit("toggle_ai", { roomId, enabled: next });
  };

  const changePersona = (persona) => {
    setAiPersona(persona);
    socket.emit("set_persona", { roomId, persona });
  };

  const send = () => {
    if (!input.trim() || aiEnabled || ended) return;
    socket.emit("send_message", { roomId, message: input, sender: "master" });
    setInput("");
    inputRef.current?.focus();
  };

  const endConversation = () => {
    socket.emit("end_conversation", { roomId });
    setEnded(true);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const meta = PERSONA_META[aiPersona];

  return (
    <div style={styles.page}>
      <div style={styles.layout}>

        {/* ── LEFT SIDEBAR ── */}
        <aside style={styles.sidebar}>
          {/* Room header */}
          <div style={styles.sideSection}>
            <div style={styles.logoRow}>
              <svg width="24" height="24" viewBox="0 0 36 36" fill="none">
                <rect width="36" height="36" rx="10" fill="url(#lg2)" />
                <circle cx="18" cy="14" r="5" fill="white" opacity="0.9" />
                <path d="M10 26c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />
                <defs>
                  <linearGradient id="lg2" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#8B5CF6" /><stop offset="1" stopColor="#6366F1" />
                  </linearGradient>
                </defs>
              </svg>
              <span style={styles.logoText}>Turing Chat</span>
            </div>

            <div style={styles.roomCodeBox}>
              <span style={styles.roomCodeLabel}>ROOM CODE</span>
              <div style={styles.roomCodeRow}>
                <span style={styles.roomCode}>{roomId}</span>
                <button style={styles.copyBtn} onClick={copyCode}>
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div style={{ ...styles.statusPill, background: guestJoined ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.05)", borderColor: guestJoined ? "rgba(34,197,94,0.3)" : "#2a2a38" }}>
              <span style={{ ...styles.statusDot, background: guestJoined ? "#22c55e" : "#6b7280" }} />
              <span style={{ color: guestJoined ? "#22c55e" : "#6b7280", fontSize: "13px", fontWeight: "500" }}>
                {guestJoined ? "Guest connected" : "Waiting for guest…"}
              </span>
            </div>
          </div>

          <div style={styles.sideDivider} />

          {/* AI Toggle */}
          <div style={styles.sideSection}>
            <span style={styles.sideLabel}>AI CONTROL</span>
            <button
              onClick={toggleAI}
              style={{ ...styles.toggleBtn, background: aiEnabled ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)", borderColor: aiEnabled ? "rgba(239,68,68,0.4)" : "rgba(34,197,94,0.4)", color: aiEnabled ? "#f87171" : "#4ade80" }}
            >
              <span style={{ ...styles.statusDot, background: aiEnabled ? "#ef4444" : "#22c55e", flexShrink: 0 }} />
              {aiEnabled ? "AI Active — Click to Disable" : "AI Disabled — Click to Enable"}
            </button>
          </div>

          <div style={styles.sideDivider} />

          {/* Persona selector */}
          <div style={styles.sideSection}>
            <span style={styles.sideLabel}>AI PERSONA</span>
            <div style={styles.personaList}>
              {Object.entries(PERSONA_META).map(([key, m]) => (
                <button
                  key={key}
                  onClick={() => changePersona(key)}
                  style={{
                    ...styles.personaBtn,
                    ...(aiPersona === key ? { ...styles.personaBtnActive, borderColor: m.color, boxShadow: `0 0 0 1px ${m.color}22` } : {}),
                  }}
                >
                  <span style={{ fontSize: "18px" }}>{m.emoji}</span>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: aiPersona === key ? m.color : "#c0c0e0" }}>{m.label}</div>
                    <div style={{ fontSize: "11px", color: "#5a5a7a", marginTop: "1px" }}>{m.desc}</div>
                  </div>
                  {aiPersona === key && (
                    <svg style={{ marginLeft: "auto", flexShrink: 0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={m.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.sideDivider} />

          {/* End conversation */}
          <div style={styles.sideSection}>
            {!ended && guestJoined && (
              <button onClick={endConversation} style={styles.endBtn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/>
                </svg>
                End Conversation
              </button>
            )}
            {ended && !verdict && (
              <div style={styles.endedNote}>
                Conversation ended. Waiting for guest verdict…
              </div>
            )}
          </div>
        </aside>

        {/* ── MAIN CHAT PANEL ── */}
        <main style={styles.main}>
          {/* Chat header */}
          <div style={styles.chatHeader}>
            <div>
              <div style={styles.chatTitle}>Host View</div>
              <div style={styles.chatSubtitle}>
                {aiEnabled
                  ? `${meta.emoji} ${meta.label} AI is responding`
                  : "You are responding manually"}
              </div>
            </div>
            {aiEnabled && (
              <div style={{ ...styles.activeBadge, borderColor: meta.color + "44", color: meta.color, background: meta.color + "11" }}>
                {meta.emoji} {meta.label}
              </div>
            )}
          </div>

          {/* Messages */}
          <div style={styles.chatBox}>
            {messages.length === 0 && (
              <div style={styles.emptyState}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3a3a52" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <p style={{ marginTop: "12px", color: "#3a3a52", fontSize: "14px" }}>
                  {guestJoined ? "No messages yet. Start chatting!" : "Share the room code to get started."}
                </p>
              </div>
            )}

            {messages.map((m, i) => {
              const isMe = m.sender === "master";
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start", marginBottom: "4px" }}>
                  <div style={{ fontSize: "10px", color: "#4a4a62", marginBottom: "3px", paddingLeft: "4px", paddingRight: "4px" }}>
                    {isMe ? (aiEnabled ? `🤖 ${meta.label} AI` : "You (Host)") : "Guest"}
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
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div style={styles.inputArea}>
            {aiEnabled ? (
              <div style={styles.aiActiveBar}>
                <span style={{ ...styles.statusDot, background: meta.color }} />
                <span style={{ fontSize: "13px", color: "#7a7a9a" }}>
                  {meta.emoji} {meta.label} AI is handling all replies automatically
                </span>
              </div>
            ) : ended ? (
              <div style={styles.aiActiveBar}>
                <span style={{ fontSize: "13px", color: "#7a7a9a" }}>Conversation has ended.</span>
              </div>
            ) : !guestJoined ? (
              <div style={styles.aiActiveBar}>
                <span style={{ fontSize: "13px", color: "#7a7a9a" }}>Waiting for guest to join…</span>
              </div>
            ) : (
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
            )}
          </div>
        </main>
      </div>

      {/* Verdict overlay */}
      {verdict && (
        <div style={styles.overlay}>
          <div style={styles.verdictCard}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>{verdict.correct ? "🏆" : "💀"}</div>
            <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#f0f0fa", marginBottom: "8px" }}>
              {verdict.correct ? "Guest guessed correctly!" : "Guest was fooled!"}
            </h2>
            <p style={{ color: "#7a7a9a", fontSize: "14px", marginBottom: "20px" }}>
              They said <strong style={{ color: "#c0c0e0" }}>{verdict.verdict === "ai" ? "AI 🤖" : "Human 🧑"}</strong> — it was actually <strong style={{ color: "#c0c0e0" }}>{verdict.actuallyAI ? `AI (${meta.emoji} ${meta.label})` : "Human 🧑"}</strong>
            </p>
            <div style={{ ...styles.verdictBanner, background: verdict.correct ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", borderColor: verdict.correct ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)", color: verdict.correct ? "#4ade80" : "#f87171" }}>
              {verdict.correct ? "✓ Correct guess" : "✗ Wrong guess"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { height: "100vh", display: "flex", overflow: "hidden", background: "#0f0f13" },
  layout: { display: "flex", width: "100%", height: "100%" },

  sidebar: {
    width: "280px", flexShrink: 0,
    background: "#13131a", borderRight: "1px solid #1e1e2a",
    display: "flex", flexDirection: "column",
    overflowY: "auto", padding: "0",
  },
  sideSection: { padding: "20px 20px" },
  sideDivider: { height: "1px", background: "#1e1e2a", flexShrink: 0 },
  sideLabel: { fontSize: "10px", fontWeight: "700", letterSpacing: "1.2px", color: "#3a3a52", textTransform: "uppercase", display: "block", marginBottom: "12px" },

  logoRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" },
  logoText: { fontSize: "16px", fontWeight: "700", color: "#e0e0f0" },

  roomCodeBox: { background: "#0f0f18", border: "1px solid #2a2a38", borderRadius: "10px", padding: "12px 14px", marginBottom: "12px" },
  roomCodeLabel: { fontSize: "10px", fontWeight: "700", color: "#3a3a52", letterSpacing: "1.2px", display: "block", marginBottom: "6px" },
  roomCodeRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  roomCode: { fontSize: "20px", fontWeight: "700", letterSpacing: "3px", color: "#8b5cf6", fontFamily: "monospace" },
  copyBtn: { fontSize: "11px", fontWeight: "600", color: "#6a6a9a", background: "#1e1e2e", border: "1px solid #2a2a3a", borderRadius: "6px", padding: "4px 10px", cursor: "pointer" },

  statusPill: { display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "8px", border: "1px solid" },
  statusDot: { width: "7px", height: "7px", borderRadius: "50%", display: "inline-block", flexShrink: 0 },

  toggleBtn: {
    display: "flex", alignItems: "center", gap: "10px",
    width: "100%", padding: "11px 14px", fontSize: "13px", fontWeight: "500",
    border: "1px solid", borderRadius: "10px", cursor: "pointer", textAlign: "left",
  },

  personaList: { display: "flex", flexDirection: "column", gap: "8px" },
  personaBtn: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "10px 12px", background: "#0f0f18",
    border: "1px solid #2a2a38", borderRadius: "10px",
    cursor: "pointer", textAlign: "left", width: "100%",
  },
  personaBtnActive: { background: "#16162a" },

  endBtn: {
    display: "flex", alignItems: "center", gap: "8px", justifyContent: "center",
    width: "100%", padding: "10px 16px", fontSize: "13px", fontWeight: "600",
    background: "rgba(239,68,68,0.08)", color: "#f87171",
    border: "1px solid rgba(239,68,68,0.25)", borderRadius: "10px", cursor: "pointer",
  },
  endedNote: { fontSize: "12px", color: "#5a5a7a", textAlign: "center", lineHeight: "1.5" },

  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },

  chatHeader: {
    padding: "16px 24px", borderBottom: "1px solid #1e1e2a",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "#13131a", flexShrink: 0,
  },
  chatTitle: { fontSize: "15px", fontWeight: "600", color: "#e0e0f0" },
  chatSubtitle: { fontSize: "12px", color: "#5a5a7a", marginTop: "2px" },
  activeBadge: { fontSize: "12px", fontWeight: "600", padding: "4px 12px", borderRadius: "99px", border: "1px solid" },

  chatBox: {
    flex: 1, overflowY: "auto",
    padding: "24px", display: "flex",
    flexDirection: "column", gap: "2px",
  },
  emptyState: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    marginTop: "80px",
  },
  bubble: {
    maxWidth: "68%", padding: "10px 14px",
    borderRadius: "16px", fontSize: "14px", lineHeight: "1.5",
    wordBreak: "break-word",
  },

  inputArea: {
    padding: "16px 24px", borderTop: "1px solid #1e1e2a",
    background: "#13131a", flexShrink: 0,
  },
  aiActiveBar: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "12px 16px", background: "#0f0f18",
    border: "1px solid #2a2a38", borderRadius: "10px",
  },
  inputRow: { display: "flex", gap: "10px" },
  input: {
    flex: 1, padding: "12px 16px", fontSize: "14px",
    background: "#0f0f18", color: "#e0e0f0",
    border: "1px solid #2a2a38", borderRadius: "10px",
    outline: "none",
  },
  sendBtn: {
    padding: "12px 16px", background: "linear-gradient(135deg, #8B5CF6, #6366F1)",
    color: "#fff", border: "none", borderRadius: "10px",
    cursor: "pointer", display: "flex", alignItems: "center",
  },

  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
    display: "flex", alignItems: "center", justifyContent: "center",
    backdropFilter: "blur(6px)", zIndex: 100,
  },
  verdictCard: {
    background: "#16161f", border: "1px solid #2a2a38",
    borderRadius: "20px", padding: "40px 48px", textAlign: "center",
    boxShadow: "0 32px 80px rgba(0,0,0,0.6)", maxWidth: "420px", width: "90%",
  },
  verdictBanner: {
    padding: "10px 20px", borderRadius: "8px",
    border: "1px solid", fontSize: "14px", fontWeight: "600",
    display: "inline-block",
  },
};
