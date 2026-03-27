import Ticket from "../models/Ticket.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const createTicket = asyncHandler(async (req, res) => {
  const { studentName, phoneNumber, category, description } = req.body;

  if (!studentName || !phoneNumber || !category || !description) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const ticket = await Ticket.create({
    studentName,
    phoneNumber,
    category,
    description,
    user: req.user.id,
  });

  return res.status(201).json({ ticket });
});

// Get all tickets for logged-in student
export const getMyTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json({ tickets });
});

// Get a specific ticket (only if owned by logged-in student)
export const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  if (ticket.user.toString() !== req.user.id) {
    return res.status(403).json({ message: "Access denied" });
  }

  res.json({ ticket });
});
