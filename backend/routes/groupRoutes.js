import { Router } from "express";
import { auth } from "../middleware/authMiddleware.js";
import {
  createGroup, getPublicGroups, getGroupById, updateGroup,
  joinGroupByCode, getMyGroups, deleteGroup, leaveGroup, getGroupMembers,
} from "../controllers/groupController.js";
import {
  getMessages, sendMessage, deleteMessage,
  getResources, addResource, deleteResource,
  getAnnouncements, createAnnouncement, deleteAnnouncement,
  markAnnouncementsRead,
} from "../controllers/groupDetailController.js";

const router = Router();

// ── Group CRUD ───────────────────────────────────────────────────────────────
router.post("/", auth, createGroup);
router.post("/join", auth, joinGroupByCode);
router.get("/my-groups", auth, getMyGroups);
router.get("/public", getPublicGroups);
router.get("/:id", getGroupById);
router.put("/:id", auth, updateGroup);
router.delete("/:id", auth, deleteGroup);
router.post("/:id/leave", auth, leaveGroup);
router.get("/:id/members", auth, getGroupMembers);

// ── Messages ─────────────────────────────────────────────────────────────────
router.get("/:id/messages", auth, getMessages);
router.post("/:id/messages", auth, sendMessage);
router.delete("/:id/messages/:messageId", auth, deleteMessage);

// ── Resources ────────────────────────────────────────────────────────────────
router.get("/:id/resources", auth, getResources);
router.post("/:id/resources", auth, addResource);
router.delete("/:id/resources/:resourceId", auth, deleteResource);

// ── Announcements ────────────────────────────────────────────────────────────
router.get("/:id/announcements", auth, getAnnouncements);
router.post("/:id/announcements", auth, createAnnouncement);
router.delete("/:id/announcements/:announcementId", auth, deleteAnnouncement);
router.post("/:id/announcements/read", auth, markAnnouncementsRead);

export default router;