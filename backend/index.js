import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import spaceRoutes from "./routes/spaceRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

import http from "http";
import { Server } from "socket.io";
import cors from "cors";

dotenv.config();
connectDB();

const app = express();

// 🔥 CREATE HTTP SERVER (important for socket.io)
const server = http.createServer(app);

// 🔥 SOCKET.IO SETUP
export const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// ✅ EXPRESS CORS MIDDLEWARE
app.use(cors({
  origin: "http://localhost:5173", // your frontend
  credentials: true,               // needed if you use cookies or auth headers
}));

app.use(express.json());

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/spaces", spaceRoutes);
app.use("/api/bookings", bookingRoutes);

// ERROR HANDLER
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// 🔥 USE server.listen (NOT app.listen)
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
