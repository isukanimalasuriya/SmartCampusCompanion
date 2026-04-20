import Ticket from "../models/Ticket.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { sendEmail } from "../utils/sendEmail.js";

// ─────────────────────────────────────────────
// GET ALL TICKETS (with optional status filter)
// ─────────────────────────────────────────────
export const getAllTickets = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const query = status && status !== "all" ? { status } : {};

  const tickets = await Ticket.find(query)
    .populate("user", "name email studentId")
    .sort({ updatedAt: -1 });

  res.json({ tickets });
});


// ─────────────────────────────────────────────
// GET SINGLE TICKET (ADMIN VIEW)
// ─────────────────────────────────────────────
export const getTicketByIdAdmin = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id).populate(
    "user",
    "name email studentId"
  );

  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  res.json({ ticket });
});


// ─────────────────────────────────────────────
// ADMIN REPLY TO TICKET
// ─────────────────────────────────────────────
export const adminReplyToTicket = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ message: "Reply message is required" });
  }

  const ticket = await Ticket.findById(req.params.id).populate(
    "user",
    "name email studentId"
  );

  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  // Add admin message
  ticket.messages.push({
    role: "ai",
    content: `[Admin — ${req.user.name || "Support Team"}]: ${message.trim()}`,
  });

  ticket.updatedAt = new Date();
  await ticket.save();

  res.json({ ticket });
});


// ─────────────────────────────────────────────
// UPDATE TICKET STATUS + SEND EMAIL
// ─────────────────────────────────────────────
export const updateTicketStatusAdmin = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!["active", "resolved", "escalated"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  // IMPORTANT: populate user for email
  const ticket = await Ticket.findById(req.params.id).populate("user");

  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  const previousStatus = ticket.status;

  ticket.status = status;
  ticket.updatedAt = new Date();
  await ticket.save();

  // ───── EMAIL NOTIFICATION ─────
  if (status === "resolved" && previousStatus !== "resolved") {
    try {
      await sendEmail(
        ticket.user.email,
        "Your Support Ticket is Resolved ✅",
        `Hello ${ticket.user.name},

Your support ticket regarding "${ticket.category}" has been resolved successfully.

If you have any further issues, feel free to contact us.

— CampusCompanion Support Team`
      );
    } catch (error) {
      console.error("❌ Email sending failed:", error);
    }
  }

  res.json({ ticket });
});


// ─────────────────────────────────────────────
// DELETE TICKET
// ─────────────────────────────────────────────
export const deleteTicketAdmin = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  await ticket.deleteOne();

  res.json({ message: "Ticket deleted" });
});