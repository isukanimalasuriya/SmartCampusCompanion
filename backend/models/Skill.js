import mongoose from "mongoose";

const skillSchema = new mongoose.Schema({
  skillName: { type: String, required: true },
  subject: { type: String, required: true },
  moduleCode: { type: String, required: true },
  description: { type: String },
  skillLevel: { 
    type: String, 
    enum: ["Beginner", "Intermediate", "Advanced"], 
    required: true 
  },
  mode: { 
    type: String, 
    enum: ["Online", "Offline"], 
    required: true 
  },
  availability: { type: Date, required: true }, 
  providerName: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  createdAt: { type: Date, default: Date.now }
});

const Skill = mongoose.model("Skill", skillSchema);
export default Skill;
