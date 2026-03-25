import Message from "../models/message.js";
import Resource from "../models/resource.js";
import Announcement from "../models/announcement.js";
import Group from "../models/group.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isMember = (group, userId) =>
  group.members.some((m) => m.user.toString() === userId);

const isAdminOrCreator = (group, userId) =>
  group.creator.toString() === userId ||
  group.members.some(
    (m) => m.user.toString() === userId && m.role === "admin"
  );

// ─── Messages ─────────────────────────────────────────────────────────────────

export const getMessages = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group)
      return res.status(404).json({ success: false, message: "Group not found" });
    if (!isMember(group, req.user.id))
      return res.status(403).json({ success: false, message: "Members only" });

    const messages = await Message.find({ group: req.params.id })
      .populate("sender", "name email")
      .sort({ createdAt: 1 })
      .limit(100);

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch messages", error: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim())
      return res.status(400).json({ success: false, message: "Message content is required" });

    const group = await Group.findById(req.params.id);
    if (!group)
      return res.status(404).json({ success: false, message: "Group not found" });
    if (!isMember(group, req.user.id))
      return res.status(403).json({ success: false, message: "Members only" });

    const message = await Message.create({
      group: req.params.id,
      sender: req.user.id,
      content: content.trim(),
    });

    const populated = await message.populate("sender", "name email");
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to send message", error: error.message });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message)
      return res.status(404).json({ success: false, message: "Message not found" });

    const group = await Group.findById(req.params.id);
    const canDelete =
      message.sender.toString() === req.user.id ||
      isAdminOrCreator(group, req.user.id);

    if (!canDelete)
      return res.status(403).json({ success: false, message: "Not authorized" });

    await message.deleteOne();
    res.status(200).json({ success: true, message: "Message deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete message", error: error.message });
  }
};

// ─── Resources ────────────────────────────────────────────────────────────────

export const getResources = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group)
      return res.status(404).json({ success: false, message: "Group not found" });
    if (!isMember(group, req.user.id))
      return res.status(403).json({ success: false, message: "Members only" });

    const resources = await Resource.find({ group: req.params.id })
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: resources });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch resources", error: error.message });
  }
};

export const addResource = async (req, res) => {
  try {
    const { title, description, type, url, content } = req.body;
    if (!title?.trim())
      return res.status(400).json({ success: false, message: "Title is required" });

    const group = await Group.findById(req.params.id);
    if (!group)
      return res.status(404).json({ success: false, message: "Group not found" });
    if (!isMember(group, req.user.id))
      return res.status(403).json({ success: false, message: "Members only" });

    const resource = await Resource.create({
      group: req.params.id,
      uploadedBy: req.user.id,
      title: title.trim(),
      description,
      type: type || "link",
      url,
      content,
    });

    const populated = await resource.populate("uploadedBy", "name email");
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to add resource", error: error.message });
  }
};

export const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.resourceId);
    if (!resource)
      return res.status(404).json({ success: false, message: "Resource not found" });

    const group = await Group.findById(req.params.id);
    const canDelete =
      resource.uploadedBy.toString() === req.user.id ||
      isAdminOrCreator(group, req.user.id);

    if (!canDelete)
      return res.status(403).json({ success: false, message: "Not authorized" });

    await resource.deleteOne();
    res.status(200).json({ success: true, message: "Resource deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete resource", error: error.message });
  }
};

// ─── Announcements ────────────────────────────────────────────────────────────

// Anyone (member or not) can read announcements — non-members see them to
// entice joining; unread count only tracked for members
export const getAnnouncements = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group)
      return res.status(404).json({ success: false, message: "Group not found" });

    const announcements = await Announcement.find({ group: req.params.id })
      .populate("author", "name email")
      .sort({ pinned: -1, createdAt: -1 });

    // Count unread for this user (only meaningful for members)
    const unreadCount = announcements.filter(
      (a) => !a.readBy.includes(req.user.id)
    ).length;

    res.status(200).json({ success: true, data: announcements, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch announcements", error: error.message });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    const { title, content, pinned } = req.body;
    if (!title?.trim() || !content?.trim())
      return res.status(400).json({ success: false, message: "Title and content are required" });

    const group = await Group.findById(req.params.id);
    if (!group)
      return res.status(404).json({ success: false, message: "Group not found" });
    if (!isAdminOrCreator(group, req.user.id))
      return res.status(403).json({ success: false, message: "Only admins can post announcements" });

    const announcement = await Announcement.create({
      group: req.params.id,
      author: req.user.id,
      title: title.trim(),
      content: content.trim(),
      pinned: pinned || false,
      // Author has already "read" it
      readBy: [req.user.id],
    });

    const populated = await announcement.populate("author", "name email");
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create announcement", error: error.message });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.announcementId);
    if (!announcement)
      return res.status(404).json({ success: false, message: "Announcement not found" });

    const group = await Group.findById(req.params.id);
    if (!isAdminOrCreator(group, req.user.id))
      return res.status(403).json({ success: false, message: "Only admins can delete announcements" });

    await announcement.deleteOne();
    res.status(200).json({ success: true, message: "Announcement deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete announcement", error: error.message });
  }
};

// Mark all announcements in a group as read for the current user
export const markAnnouncementsRead = async (req, res) => {
  try {
    await Announcement.updateMany(
      { group: req.params.id, readBy: { $ne: req.user.id } },
      { $addToSet: { readBy: req.user.id } }
    );
    res.status(200).json({ success: true, message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to mark as read", error: error.message });
  }
};