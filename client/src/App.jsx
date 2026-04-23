import { useState } from "react";
import MasterRoom from "./pages/MasterRoom";
import GuestRoom from "./pages/GuestRoom";

export default function App() {
  const [role, setRole] = useState(null);
  const [roomId, setRoomId] = useState("");
  const [inputRoom, setInputRoom] = useState("");
  const [joinError, setJoinError] = useState(false);

  const startAsHost = () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(id);
    setRole("master");
  };

  const joinAsGuest = () => {
    if (!inputRoom.trim()) {
      setJoinError(true);
      setTimeout(() => setJoinError(false), 600);
      return;
    }
    setRoomId(inputRoom.trim().toUpperCase());
    setRole("guest");
  };

  if (!role) {
    return (
      <div style={styles.page}>
        {/* Background glow */}
        <div style={styles.glowTop} />
        <div style={styles.glowBottom} />

        <div style={styles.card}>
          {/* Logo */}
          <div style={styles.logoWrap}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="10" fill="url(#lg)" />
              <circle cx="18" cy="14" r="5" fill="white" opacity="0.9" />
              <path d="M10 26c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />
              <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#8B5CF6" />
                  <stop offset="1" stopColor="#6366F1" />
                </linearGradient>
              </defs>
            </svg>
            <span style={styles.logoText}>Turing Chat</span>
          </div>

          <h1 style={styles.heading}>Can you tell who's real?</h1>
          <p style={styles.subheading}>
            A live Turing test — one person chats while the other guesses if they're talking to a human or AI.
          </p>

          {/* Divider */}
          <div style={styles.divider} />

          {/* Host section */}
          <div style={styles.section}>
            <div style={styles.sectionLabel}>HOST</div>
            <p style={styles.sectionDesc}>Create a room and control the conversation.</p>
            <button style={styles.primaryBtn} onClick={startAsHost}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
              </svg>
              Start as Host
            </button>
          </div>

          <div style={styles.orRow}>
            <div style={styles.orLine} />
            <span style={styles.orText}>or</span>
            <div style={styles.orLine} />
          </div>

          {/* Guest section */}
          <div style={styles.section}>
            <div style={styles.sectionLabel}>GUEST</div>
            <p style={styles.sectionDesc}>Enter a room code to join and start chatting.</p>
            <div style={styles.inputRow}>
              <input
                placeholder="Room code (e.g. AB12CD)"
                value={inputRoom}
                onChange={(e) => setInputRoom(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && joinAsGuest()}
                style={{ ...styles.input, ...(joinError ? styles.inputError : {}) }}
                maxLength={8}
                spellCheck={false}
              />
              <button style={styles.secondaryBtn} onClick={joinAsGuest}>
                Join
              </button>
            </div>
            {joinError && <p style={styles.errorText}>Please enter a room code.</p>}
          </div>

          <p style={styles.footer}>
            Inspired by Alan Turing's imitation game
          </p>
        </div>
      </div>
    );
  }

  return role === "master"
    ? <MasterRoom roomId={roomId} />
    : <GuestRoom roomId={roomId} />;
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    position: "relative",
    overflow: "hidden",
  },
  glowTop: {
    position: "fixed", top: "-120px", left: "50%", transform: "translateX(-50%)",
    width: "600px", height: "400px",
    background: "radial-gradient(ellipse, rgba(139,92,246,0.15) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  glowBottom: {
    position: "fixed", bottom: "-120px", right: "10%",
    width: "400px", height: "400px",
    background: "radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    width: "100%",
    maxWidth: "440px",
    background: "#16161f",
    border: "1px solid #2a2a38",
    borderRadius: "20px",
    padding: "36px 32px",
    boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
  },
  logoWrap: {
    display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px",
  },
  logoText: {
    fontSize: "18px", fontWeight: "700", color: "#e8e8f0", letterSpacing: "-0.3px",
  },
  heading: {
    fontSize: "26px", fontWeight: "700", color: "#f0f0fa",
    letterSpacing: "-0.5px", lineHeight: "1.25", marginBottom: "10px",
  },
  subheading: {
    fontSize: "14px", color: "#7a7a9a", lineHeight: "1.6",
  },
  divider: {
    height: "1px", background: "#2a2a38", margin: "24px 0",
  },
  section: {
    display: "flex", flexDirection: "column", gap: "10px",
  },
  sectionLabel: {
    fontSize: "10px", fontWeight: "700", letterSpacing: "1.5px",
    color: "#5a5a7a", textTransform: "uppercase",
  },
  sectionDesc: {
    fontSize: "13px", color: "#6a6a8a",
  },
  primaryBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
    padding: "12px 20px", fontSize: "14px", fontWeight: "600",
    background: "linear-gradient(135deg, #8B5CF6, #6366F1)",
    color: "#fff", border: "none", borderRadius: "10px",
    cursor: "pointer", width: "100%",
    boxShadow: "0 4px 16px rgba(139,92,246,0.35)",
  },
  secondaryBtn: {
    padding: "12px 20px", fontSize: "14px", fontWeight: "600",
    background: "#23233a", color: "#c0c0e0",
    border: "1px solid #33334a", borderRadius: "10px",
    cursor: "pointer", whiteSpace: "nowrap",
  },
  orRow: {
    display: "flex", alignItems: "center", gap: "12px", margin: "20px 0",
  },
  orLine: { flex: 1, height: "1px", background: "#2a2a38" },
  orText: { fontSize: "12px", color: "#4a4a6a", fontWeight: "500" },
  inputRow: { display: "flex", gap: "8px" },
  input: {
    flex: 1, padding: "12px 14px", fontSize: "14px", fontWeight: "500",
    background: "#0f0f18", color: "#e0e0f0",
    border: "1px solid #2a2a3a", borderRadius: "10px",
    outline: "none", letterSpacing: "1px",
  },
  inputError: { border: "1px solid #ef4444", boxShadow: "0 0 0 3px rgba(239,68,68,0.15)" },
  errorText: { fontSize: "12px", color: "#ef4444", marginTop: "-4px" },
  footer: {
    marginTop: "28px", textAlign: "center",
    fontSize: "12px", color: "#3a3a52",
  },
};
