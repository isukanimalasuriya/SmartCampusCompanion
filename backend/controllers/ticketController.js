import Ticket from "../models/Ticket.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const createTicket = asyncHandler(async (req, res) => {
  const { studentName, phoneNumber, category, description } = req.body;

  if (!studentName || !phoneNumber || !category || !description) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const ticket = await Ticket.create({ studentName, phoneNumber, category, description });

  return res.status(201).json({ ticket });
});
