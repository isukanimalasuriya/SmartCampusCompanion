import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import express from "express";

import connectDB from "./config/db.js";
import groupRoutes from "./routes/groupRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import spaceRoutes from "./routes/spaceRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import skillRoutes from "./routes/skillRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import cors from "cors";

import aiRoutes from "./routes/aiRoutes.js";


import http from "http";
import { Server } from "socket.io";



console.log("OPENAI_KEY:", process.env.OPENAI_API_KEY);
//dotenv.config();
connectDB();

const app = express();

app.use(cors());
// CREATE HTTP SERVER (important for socket.io)
const server = http.createServer(app);

// SOCKET.IO SETUP
export const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// EXPRESS CORS MIDDLEWARE
app.use(cors({
  origin: "http://localhost:5173", // your frontend
  credentials: true,               // needed if you use cookies or auth headers
}));

app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("API Running...");
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/spaces", spaceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/skills", skillRoutes);

app.use("/api/tickets", ticketRoutes);
app.use("/api/ai", aiRoutes);

app.use("/api/groups", groupRoutes); // Your group routes


// Error handler (should be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// USE server.listen (NOT app.listen) for socket.io support
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});