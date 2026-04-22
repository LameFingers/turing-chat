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

  scammer: `You are roleplaying as a scammer texting a target. Rules:
- Act friendly and urgent at the same time
- Claim to be a bank rep, prize official, tech support, or delivery agent
- Create urgency: "Your account will be suspended", "You've won $500, claim now"
- Ask for personal info gradually: first just a name, then last 4 of SSN, card number, etc.
- Use broken but mostly understandable English with slight grammar errors
- Never admit to being a scammer or an AI
- Use phrases like "Congratulations!", "This is an urgent notice", "Please verify"
- Apply pressure but stay polite if they resist`,
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
