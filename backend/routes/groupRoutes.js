import { Router } from "express";
import { auth } from "../middleware/authMiddleware.js";
import {
  createGroup,
  getPublicGroups,
  getGroupById,
  updateGroup,
  joinGroupByCode,
  getMyGroups,
  deleteGroup,
  leaveGroup,
  getGroupMembers,
} from "../controllers/groupController.js";

const router = Router();

// Protected routes (require authentication)
router.post("/", auth, createGroup);                    // Create a new study group
router.post("/join", auth, joinGroupByCode);            // Join group by invite code
router.get("/my-groups", auth, getMyGroups);            // Get current user's groups
router.put("/:id", auth, updateGroup);                  // Update group (admin only)
router.delete("/:id", auth, deleteGroup);               // Delete group (creator only)
router.post("/:id/leave", auth, leaveGroup);            // Leave group
router.get("/:id/members", auth, getGroupMembers);      // Get group members

// Public routes
router.get("/public", getPublicGroups);                 // Get all public groups
router.get("/:id", getGroupById);                       // Get specific group by ID

export default router;