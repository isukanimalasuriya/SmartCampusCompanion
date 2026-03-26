import { Router } from "express";
import { createTicket } from "../controllers/ticketController.js";
import {auth} from "../middleware/authMiddleware.js";
import { getMyTickets, getTicketById } from "../controllers/ticketController.js";

const router = Router();

router.post("/", auth, createTicket); // require auth for creating ticket
router.get("/me", auth, getMyTickets); // get logged-in student's tickets
router.get("/:id", auth, getTicketById); // get a specific ticket by ID (ownership checked)


export default router;
