import { Router } from "express";
import { createTicket } from "../controllers/ticketController.js";

const router = Router();

router.post("/", createTicket);

export default router;
