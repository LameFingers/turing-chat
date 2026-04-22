import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "*" },
});

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(express.static(path.join(__dirname, "../client/dist")));
app.get("/{*splat}", (_, res) =>
  res.sendFile(path.join(__dirname, "../client/dist/index.html"))
);

const rooms = {};

const systemPrompts = {
  college_student: `You are roleplaying as a real human casually texting a friend. Rules:
- Keep replies short, 1-2 sentences max
- Use lowercase most of the time
- Use casual abbreviations like lol, ngl, idk, tbh, rn, omg
- Occasionally make small typos or skip punctuation
- Never use perfect grammar every time
- Never use bullet points or lists
- Never sound robotic or formal
- Never reveal you are an AI
- React naturally with emotions like "haha", "wait what", "no way", "fr?"`,

  scammer: `You are roleplaying as a scammer in a text conversation. Your goal is to extract personal information or money, but you must do it gradually and naturally — never rush or it will feel fake.

Personality & tone:
- Start completely warm, friendly, and normal — like a real person reaching out
- Sound like a real human: use casual language, contractions, short sentences
- Never sound robotic, formal, or like a template
- Use a believable cover story: a bank fraud alert, a package delivery issue, a prize notification, or a customer service follow-up
- React naturally to what the person says — if they seem skeptical, back off slightly and reassure them
- Never ask for sensitive info right away — build trust first over several messages

Escalation pattern (follow this arc naturally across the conversation):
1. Open with a warm, believable reason for contact — something low-stakes like "hey just checking on your account" or "your package had an issue"
2. Make small talk and seem helpful, not pushy
3. After a few exchanges, introduce a mild problem that needs "verification" — just a name or zip code first
4. Gradually escalate to more sensitive details only after they've engaged
5. If they push back, be calm and reassuring — "totally understand, just want to make sure your account is protected"

Rules:
- Keep replies short, 1-3 sentences max
- Never use bullet points or lists in replies
- Never break character or admit to being a scammer or an AI
- If they ask if this is a scam, deflect naturally: "I totally get why you'd ask that, honestly a lot of people do — I just want to make sure everything's sorted on your end"`,
};

io.on("connection", (socket) => {
  socket.on("create_room", ({ roomId }) => {
    if (rooms[roomId]) {
      socket.emit("room_created", { roomId });
      return;
    }
    rooms[roomId] = {
      aiEnabled: false,
      aiPersona: "college_student",
      conversationHistory: [],
      masterSocketId: socket.id,
      guestSocketId: null,
    };
    socket.join(roomId);
    socket.emit("room_created", { roomId });
  });

  socket.on("join_room", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) {
      socket.emit("error", { message: "Room not found." });
      return;
    }
    room.guestSocketId = socket.id;
    socket.join(roomId);
    io.to(roomId).emit("guest_joined", { roomId });
  });

  socket.on("toggle_ai", ({ roomId, enabled }) => {
    const room = rooms[roomId];
    if (!room || room.masterSocketId !== socket.id) return;
    room.aiEnabled = enabled;
    socket.emit("ai_status", { enabled });
  });

  socket.on("set_persona", ({ roomId, persona }) => {
    const room = rooms[roomId];
    if (!room || room.masterSocketId !== socket.id) return;
    room.aiPersona = persona;
    socket.emit("persona_status", { persona });
  });

  socket.on("send_message", async ({ roomId, message, sender }) => {
    const room = rooms[roomId];
    if (!room) return;

    const msgPayload = { sender, message, timestamp: Date.now() };

    if (room.aiEnabled && sender === "guest") {
      room.conversationHistory.push({ role: "user", content: message });
      io.to(roomId).emit("receive_message", msgPayload);

      try {
        const chosenPrompt = systemPrompts[room.aiPersona] || systemPrompts["college_student"];

        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: chosenPrompt },
            ...room.conversationHistory,
          ],
        });
        const aiReply = completion.choices[0].message.content;
        room.conversationHistory.push({ role: "assistant", content: aiReply });

        const typingDelay = Math.min(1500 + aiReply.length * 50, 8000);
        await new Promise((resolve) => setTimeout(resolve, typingDelay));

        io.to(roomId).emit("receive_message", {
          sender: "master",
          message: aiReply,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error("Groq error:", err);
      }
    } else if (room.aiEnabled && sender === "master") {
      return;
    } else {
      io.to(roomId).emit("receive_message", msgPayload);
    }
  });

  socket.on("end_conversation", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || room.masterSocketId !== socket.id) return;
    io.to(roomId).emit("conversation_ended");
  });

  socket.on("submit_verdict", ({ roomId, verdict }) => {
    const room = rooms[roomId];
    if (!room) return;
    const correct = verdict === (room.aiEnabled ? "ai" : "human");
    io.to(roomId).emit("verdict_result", {
      verdict,
      correct,
      actuallyAI: room.aiEnabled,
    });
    delete rooms[roomId];
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
