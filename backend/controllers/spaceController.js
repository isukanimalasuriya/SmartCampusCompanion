import { StudySpace } from "../models/studySpace.js";
import { Table } from "../models/table.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

//Create Study Space
export const createSpace = asyncHandler(async (req, res) => {
  const { name, location, totalSeats } = req.body;

  if (!name || !location || !totalSeats) {
    return res.status(400).json({
      message: "name, location, and totalSeats are required",
    });
  }

  const space = await StudySpace.create({
    name,
    location,
    totalSeats,
    availableSeats: totalSeats,
  });

  res.status(201).json(space);
});

//create table in a study space
export const createTable = asyncHandler(async (req, res) => {
  const { spaceId } = req.params;
  const { code, type, capacity } = req.body;

  if (!code || !type || !capacity) {
    return res.status(400).json({
      message: "code, type, capacity are required",
    });
  }

  const space = await StudySpace.findById(spaceId);
  if (!space) {
    return res.status(404).json({ message: "Study space not found" });
  }

  // Create table
  const table = await Table.create({
    space: spaceId,
    code,
    type,
    capacity,
    availableSeats: capacity,
  });

  // Update space seat counts
  space.totalSeats += capacity;
  space.availableSeats += capacity;
  space.recomputeStatus();
  await space.save();

  res.status(201).json(table);
});

export const listSpaces = asyncHandler(async (req, res) => {
  const spaces = await StudySpace.find().sort({ name: 1 });
  return res.json({ spaces });
});

export const getSpaceTables = asyncHandler(async (req, res) => {
  const { spaceId } = req.params;

  const space = await StudySpace.findById(spaceId);
  if (!space) return res.status(404).json({ message: "Study space not found" });

  const tables = await Table.find({ space: spaceId }).sort({ code: 1 });
  return res.json({ space, tables });
});
