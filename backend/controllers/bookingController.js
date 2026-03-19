import mongoose from "mongoose";
import { Booking } from "../models/booking.js";
import { StudySpace } from "../models/studySpace.js";
import { Table } from "../models/table.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const getMyActiveBooking = asyncHandler(async (req, res) => {
  const active = await Booking.findOne({ user: req.user.id, status: "ACTIVE" })
    .populate("space", "name location")
    .populate("table", "code type capacity availableSeats");

  return res.json({ active });
});

export const createBooking = asyncHandler(async (req, res) => {
  const { tableId, seats } = req.body;
  const seatsInt = Number(seats);

  if (!tableId || !Number.isInteger(seatsInt) || seatsInt <= 0) {
    return res
      .status(400)
      .json({ message: "tableId and positive integer seats are required" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const table = await Table.findById(tableId).session(session);
    if (!table) return res.status(404).json({ message: "Table not found" });

    const space = await StudySpace.findById(table.space).session(session);
    if (!space)
      return res.status(404).json({ message: "Study space not found" });

    if (table.availableSeats < seatsInt) {
      return res
        .status(409)
        .json({ message: "Not enough seats on this table" });
    }
    if (space.availableSeats < seatsInt) {
      return res
        .status(409)
        .json({ message: "Not enough seats in this space" });
    }

    // Create booking (index prevents two ACTIVE bookings for same user)
    const [booking] = await Booking.create(
      [
        {
          user: req.user.id,
          space: space._id,
          table: table._id,
          seats: seatsInt,
          status: "ACTIVE",
        },
      ],
      { session },
    );

    table.availableSeats -= seatsInt;
    await table.save({ session });

    space.availableSeats -= seatsInt;
    space.recomputeStatus();
    await space.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({ booking });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});

export const checkout = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const booking = await Booking.findOne({
      user: req.user.id,
      status: "ACTIVE",
    }).session(session);
    if (!booking) return res.status(404).json({ message: "No active booking" });

    const table = await Table.findById(booking.table).session(session);
    const space = await StudySpace.findById(booking.space).session(session);

    if (!table || !space)
      return res
        .status(500)
        .json({ message: "Booking references invalid data" });

    booking.status = "ENDED";
    booking.endedAt = new Date();
    await booking.save({ session });

    table.availableSeats = Math.min(
      table.capacity,
      table.availableSeats + booking.seats,
    );
    await table.save({ session });

    space.availableSeats = Math.min(
      space.totalSeats,
      space.availableSeats + booking.seats,
    );
    space.recomputeStatus();
    await space.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.json({ message: "Checked out", booking });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
});
