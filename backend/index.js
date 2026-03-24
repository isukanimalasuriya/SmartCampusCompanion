import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import groupRoutes from "./routes/groups.js"; // Add this

dotenv.config();
connectDB(); // call database connection

const app = express();

app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("API Running...");
});

// Group routes
app.use("/api/groups", groupRoutes); // Add this

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});