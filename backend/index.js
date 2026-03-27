import "./config/env.js";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import groupRoutes from "./routes/groupRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import spaceRoutes from "./routes/spaceRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import skillRoutes from "./routes/skillRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connectDB();

const app = express();
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("API Running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/spaces", spaceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/ai", aiRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});