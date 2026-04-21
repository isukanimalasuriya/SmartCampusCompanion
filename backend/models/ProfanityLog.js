import mongoose from "mongoose";

const profanityLogSchema = new mongoose.Schema(
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
    count: {
      type: Number,
      default: 0,
    },
    lastAttemptAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound unique index
profanityLogSchema.index({ userId: 1, groupId: 1 }, { unique: true });

// Method to increment count
profanityLogSchema.statics.incrementCount = async function (userId, groupId) {
  const log = await this.findOneAndUpdate(
    { userId, groupId },
    { 
      $inc: { count: 1 },
      $set: { lastAttemptAt: new Date() }
    },
    { upsert: true, new: true }
  );
  return log;
};

// Method to get count for user in group
profanityLogSchema.statics.getCount = async function (userId, groupId) {
  const log = await this.findOne({ userId, groupId });
  return log?.count || 0;
};

const ProfanityLog = mongoose.model("ProfanityLog", profanityLogSchema);
export default ProfanityLog;