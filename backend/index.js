import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import spaceRoutes from "./routes/spaceRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import cors from 'cors';



dotenv.config();
connectDB(); // call database connection

const app = express();

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174']
}))

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/spaces", spaceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
