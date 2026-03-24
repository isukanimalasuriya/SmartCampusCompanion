import Skill from "../models/Skill.js";
import SkillRequest from "../models/SkillRequest.js";

// Offer a new skill
export const offerSkill = async (req, res) => {
  try {
    const { skillName, subject, moduleCode, description, skillLevel, mode, availability, providerName } = req.body;
    const newSkill = new Skill({
      skillName,
      subject,
      moduleCode,
      description,
      skillLevel,
      mode,
      availability,
      providerName
    });
    await newSkill.save();
    res.status(201).json(newSkill);
  } catch (error) {
    console.error("Error in offerSkill:", error);
    res.status(500).json({ message: "Error offering skill", error: error.message });
  }
};

// Get all available skills
export const getSkills = async (req, res) => {
  try {
    const skills = await Skill.find().sort({ createdAt: -1 });
    res.status(200).json(skills);
  } catch (error) {
    console.error("Error in getSkills:", error);
    res.status(500).json({ message: "Error fetching skills", error: error.message });
  }
};

// Request help for a skill
export const requestHelp = async (req, res) => {
  try {
    const { skillId, problemDescription, preferredTime, requesterName } = req.body;
    const newRequest = new SkillRequest({
      skillId,
      problemDescription,
      preferredTime,
      requesterName
    });
    await newRequest.save();
    
    // Population to get skill details for the response
    const populatedRequest = await SkillRequest.findById(newRequest._id).populate('skillId');
    const matchingPeer = await Skill.findById(skillId);
    
    res.status(201).json({
      request: populatedRequest,
      matchingPeers: [matchingPeer] 
    });
  } catch (error) {
    console.error("Error in requestHelp:", error);
    res.status(500).json({ message: "Error requesting help", error: error.message });
  }
};

// Get all requests
export const getRequests = async (req, res) => {
  try {
    const requests = await SkillRequest.find()
      .populate("skillId")
      .sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error in getRequests:", error);
    res.status(500).json({ message: "Error fetching requests", error: error.message });
  }
};

// Update request status
export const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedRequest = await SkillRequest.findByIdAndUpdate(id, { status }, { new: true });
    res.status(200).json(updatedRequest);
  } catch (error) {
    res.status(500).json({ message: "Error updating status", error: error.message });
  }
};

// Submit feedback
export const submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;
    const updatedRequest = await SkillRequest.findByIdAndUpdate(
      id, 
      { rating, feedback, status: "Completed" }, 
      { new: true }
    );
    res.status(200).json(updatedRequest);
  } catch (error) {
    res.status(500).json({ message: "Error submitting feedback", error: error.message });
  }
};
