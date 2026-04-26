import Strike from "../models/Strike.js";
import GroupSettings from "../models/GroupSettings.js";
import ProfanityLog from "../models/ProfanityLog.js";
import Group from "../models/Group.js";
import { isProfane } from "../config/profanity.js";

// Helper to check if user is group owner
const isGroupOwner = async (groupId, userId) => {
  const group = await Group.findById(groupId);
  return group && group.creator.toString() === userId.toString();
};

// Helper to get active strikes count for a user
const getActiveStrikesCount = async (userId, groupId) => {
  const now = new Date();
  const activeStrikes = await Strike.find({
    userId,
    groupId,
    isActive: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: now } }
    ]
  });
  return activeStrikes.filter(s => s.type === "warning").length;
};

// Helper to apply automatic ban based on warning count
const checkAndApplyAutoBan = async (userId, groupId, issuedBy) => {
  const settings = await GroupSettings.getOrCreate(groupId);
  const warningCount = await getActiveStrikesCount(userId, groupId);
  
  if (warningCount >= settings.moderation.warningsBeforeBan) {
    // Apply temporary ban
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + settings.moderation.tempBanDurationHours);
    
    const banStrike = await Strike.create({
      userId,
      groupId,
      type: "temporary_ban",
      reason: `Auto-ban: Reached ${warningCount}/${settings.moderation.warningsBeforeBan} warnings`,
      issuedBy,
      expiresAt,
    });
    
    return { banned: true, banStrike };
  }
  
  return { banned: false };
};


// 1. Give Warning
export const giveWarning = async (req, res) => {
  try {
    const { userId, reason } = req.body;
    const { groupId } = req.params;
    const issuerId = req.user.id;

    // Check if issuer is group owner
    const isOwner = await isGroupOwner(groupId, issuerId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "Only group owner can issue warnings",
      });
    }

    const settings = await GroupSettings.getOrCreate(groupId);
    
    // Calculate expiry (7 days by default)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + settings.moderation.strikeExpiryDays);

    // Create warning strike
    const strike = await Strike.create({
      userId,
      groupId,
      type: "warning",
      reason: reason || "Violation of group rules",
      issuedBy: issuerId,
      expiresAt,
    });

    // Check if this warning triggers auto-ban
    const warningCount = await getActiveStrikesCount(userId, groupId);
    const { banned, banStrike } = await checkAndApplyAutoBan(userId, groupId, issuerId);

    // Get updated warning count
    const currentWarningCount = await getActiveStrikesCount(userId, groupId);
    const warningsLeft = Math.max(0, settings.moderation.warningsBeforeBan - currentWarningCount);

    res.status(201).json({
      success: true,
      message: `Warning issued. User now has ${currentWarningCount}/${settings.moderation.warningsBeforeBan} warnings.`,
      data: {
        strike,
        warningsLeft,
        totalWarnings: currentWarningCount,
        autoBanned: banned,
        banStrike: banStrike || null,
      },
    });
  } catch (error) {
    console.error("Error giving warning:", error);
    res.status(500).json({
      success: false,
      message: "Failed to issue warning",
      error: error.message,
    });
  }
};


// 2. Apply Mute

export const applyMute = async (req, res) => {
  try {
    const { userId, durationMinutes, reason } = req.body;
    const { groupId } = req.params;
    const issuerId = req.user.id;

    const isOwner = await isGroupOwner(groupId, issuerId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "Only group owner can mute users",
      });
    }

    const settings = await GroupSettings.getOrCreate(groupId);
    const muteDuration = durationMinutes || settings.moderation.muteDurationMinutes;
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + muteDuration);

    const strike = await Strike.create({
      userId,
      groupId,
      type: "temporary_mute",
      reason: reason || "Temporary mute applied",
      issuedBy: issuerId,
      expiresAt,
    });

    res.status(201).json({
      success: true,
      message: `User muted for ${muteDuration} minutes`,
      data: { strike, expiresAt },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to apply mute",
      error: error.message,
    });
  }
};


// 3. Apply Temporary Ban
export const applyTempBan = async (req, res) => {
  try {
    const { userId, durationHours, reason } = req.body;
    const { groupId } = req.params;
    const issuerId = req.user.id;

    const isOwner = await isGroupOwner(groupId, issuerId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "Only group owner can ban users",
      });
    }

    const settings = await GroupSettings.getOrCreate(groupId);
    const banDuration = durationHours || settings.moderation.tempBanDurationHours;
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + banDuration);

    const strike = await Strike.create({
      userId,
      groupId,
      type: "temporary_ban",
      reason: reason || "Temporary ban applied",
      issuedBy: issuerId,
      expiresAt,
    });

    res.status(201).json({
      success: true,
      message: `User banned for ${banDuration} hours`,
      data: { strike, expiresAt },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to apply ban",
      error: error.message,
    });
  }
};


// 4. Apply Permanent Ban
export const applyPermanentBan = async (req, res) => {
  try {
    const { userId, reason } = req.body;
    const { groupId } = req.params;
    const issuerId = req.user.id;

    const isOwner = await isGroupOwner(groupId, issuerId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "Only group owner can permanently ban users",
      });
    }

    // Remove user from group members
    const group = await Group.findById(groupId);
    if (group) {
      group.members = group.members.filter(
        (m) => m.user.toString() !== userId
      );
      await group.save();
    }

    const strike = await Strike.create({
      userId,
      groupId,
      type: "permanent_ban",
      reason: reason || "Permanent ban applied",
      issuedBy: issuerId,
      expiresAt: null,
    });

    res.status(201).json({
      success: true,
      message: "User permanently banned and removed from group",
      data: { strike },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to apply permanent ban",
      error: error.message,
    });
  }
};


// 5. Remove Strike (Unban/Unmute)
export const removeStrike = async (req, res) => {
  try {
    const { strikeId } = req.params;
    const { groupId } = req.query;
    const userId = req.user.id;

    const isOwner = await isGroupOwner(groupId, userId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "Only group owner can remove strikes",
      });
    }

    const strike = await Strike.findById(strikeId);
    if (!strike) {
      return res.status(404).json({
        success: false,
        message: "Strike not found",
      });
    }

    strike.isActive = false;
    await strike.save();

    res.status(200).json({
      success: true,
      message: "Strike removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to remove strike",
      error: error.message,
    });
  }
};


// 6. Get User Strikes
export const getUserStrikes = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const currentUserId = req.user.id;

    const isOwner = await isGroupOwner(groupId, currentUserId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "Only group owner can view strikes",
      });
    }

    const strikes = await Strike.find({
      userId,
      groupId,
      isActive: true,
    })
      .populate("issuedBy", "name email")
      .sort({ createdAt: -1 });

    const settings = await GroupSettings.getOrCreate(groupId);
    const warningCount = strikes.filter(s => s.type === "warning").length;
    const warningsLeft = Math.max(0, settings.moderation.warningsBeforeBan - warningCount);

    res.status(200).json({
      success: true,
      data: {
        strikes,
        warningCount,
        warningsLeft,
        warningsBeforeBan: settings.moderation.warningsBeforeBan,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch strikes",
      error: error.message,
    });
  }
};


// 7. Get All Group Violations (Admin Dashboard)
export const getGroupViolations = async (req, res) => {
  try {
    const { groupId } = req.params;
    const currentUserId = req.user.id;

    const isOwner = await isGroupOwner(groupId, currentUserId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "Only group owner can view violations",
      });
    }

    // Get all active strikes for the group
    const strikes = await Strike.find({
      groupId,
      isActive: true,
    })
      .populate("userId", "name email")
      .populate("issuedBy", "name email")
      .sort({ createdAt: -1 });

    // Get profanity counts per user
    const profanityLogs = await ProfanityLog.find({ groupId })
      .populate("userId", "name email")
      .sort({ count: -1 });

    // Group strikes by user
    const violationsByUser = {};
    strikes.forEach(strike => {
      const userId = strike.userId._id.toString();
      if (!violationsByUser[userId]) {
        violationsByUser[userId] = {
          user: strike.userId,
          strikes: [],
          warningCount: 0,
          muteCount: 0,
          banCount: 0,
        };
      }
      violationsByUser[userId].strikes.push(strike);
      if (strike.type === "warning") violationsByUser[userId].warningCount++;
      if (strike.type === "temporary_mute") violationsByUser[userId].muteCount++;
      if (strike.type === "temporary_ban" || strike.type === "permanent_ban") violationsByUser[userId].banCount++;
    });

    // Add profanity counts
    profanityLogs.forEach(log => {
      const userId = log.userId._id.toString();
      if (violationsByUser[userId]) {
        violationsByUser[userId].profanityCount = log.count;
      } else {
        violationsByUser[userId] = {
          user: log.userId,
          strikes: [],
          warningCount: 0,
          muteCount: 0,
          banCount: 0,
          profanityCount: log.count,
        };
      }
    });

    const settings = await GroupSettings.getOrCreate(groupId);

    res.status(200).json({
      success: true,
      data: {
        violations: Object.values(violationsByUser),
        totalViolations: strikes.length,
        settings,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch violations",
      error: error.message,
    });
  }
};

// 8. Update Group Moderation Settings
export const updateModerationSettings = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const isOwner = await isGroupOwner(groupId, userId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "Only group owner can update moderation settings",
      });
    }

    const settings = await GroupSettings.getOrCreate(groupId);
    
    // Update only provided fields
    const { moderation } = req.body;
    if (moderation) {
      Object.assign(settings.moderation, moderation);
    }
    settings.updatedBy = userId;
    await settings.save();

    res.status(200).json({
      success: true,
      message: "Moderation settings updated",
      data: settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update settings",
      error: error.message,
    });
  }
};


// 9. Get Moderation Settings
export const getModerationSettings = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const isOwner = await isGroupOwner(groupId, userId);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "Only group owner can view moderation settings",
      });
    }

    const settings = await GroupSettings.getOrCreate(groupId);

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch settings",
      error: error.message,
    });
  }
};

// 10. Check if User is Banned/Muted (Middleware helper)
export const isUserRestricted = async (groupId, userId) => {
  const now = new Date();
  
  // Check for active bans or mutes
  const activeRestriction = await Strike.findOne({
    userId,
    groupId,
    isActive: true,
    type: { $in: ["temporary_ban", "permanent_ban", "temporary_mute"] },
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: now } }
    ]
  });
  
  if (activeRestriction) {
    return {
      restricted: true,
      type: activeRestriction.type,
      expiresAt: activeRestriction.expiresAt,
      reason: activeRestriction.reason,
    };
  }
  
  return { restricted: false };
};