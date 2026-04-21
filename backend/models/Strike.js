import mongoose from "mongoose";

const strikeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    type: {
      type: String,
      enum: ["warning", "temporary_mute", "temporary_ban", "permanent_ban"],
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // For tracking if this strike triggered a ban
    triggeredBan: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for faster queries
strikeSchema.index({ userId: 1, groupId: 1, isActive: 1 });
strikeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-expire

// Method to check if strike is expired
strikeSchema.methods.isExpired = function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Method to deactivate expired strikes
strikeSchema.statics.deactivateExpired = async function () {
  const now = new Date();
  const result = await this.updateMany(
    { expiresAt: { $lt: now }, isActive: true },
    { $set: { isActive: false } }
  );
  return result.modifiedCount;
};

const Strike = mongoose.model("Strike", strikeSchema);
export default Strike;