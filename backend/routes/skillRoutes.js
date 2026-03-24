import { Router } from "express";
import * as skillController from "../controllers/skillController.js";

const router = Router();

// Skills
router.post("/offer", skillController.offerSkill);
router.get("/", skillController.getSkills);

// Requests
router.post("/request", skillController.requestHelp);
router.get("/requests", skillController.getRequests);
router.patch("/request/:id/status", skillController.updateRequestStatus);
router.patch("/request/:id/feedback", skillController.submitFeedback);

export default router;
