import mongoose from "mongoose";

const groupSettingsSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      unique: true,
    },
    moderation: {
      warningsBeforeBan: {
        type: Number,
        default: 3,
        min: 1,
        max: 10,
      },
      muteDurationMinutes: {
        type: Number,
        default: 60,
        min: 5,
        max: 1440, // 24 hours
      },
      tempBanDurationHours: {
        type: Number,
        default: 24,
        min: 1,
        max: 168, // 7 days
      },
      strikeExpiryDays: {
        type: Number,
        default: 7,
        min: 1,
        max: 30,
      },
      autoModerationEnabled: {
        type: Boolean,
        default: true,
      },
      profanityFilterEnabled: {
        type: Boolean,
        default: true,
      },
      profanityWordList: {
        type: [String],
        default: [],
      },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Static method to get or create settings for a group
groupSettingsSchema.statics.getOrCreate = async function (groupId) {
  let settings = await this.findOne({ groupId });
  if (!settings) {
    settings = await this.create({ groupId });
  }
  return settings;
};

const GroupSettings = mongoose.model("GroupSettings", groupSettingsSchema);
export default GroupSettings;