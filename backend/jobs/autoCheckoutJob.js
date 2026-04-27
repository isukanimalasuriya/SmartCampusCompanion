import cron from "node-cron";
import mongoose from "mongoose";
import { Booking } from "../models/booking.js";
import { Table } from "../models/table.js";
import { StudySpace } from "../models/studySpace.js";
import { io } from "../index.js";

/**
 * Automatically checks out bookings that have been ACTIVE for more than 3 hours.
 * Runs every 5 minutes.
 */
export const startAutoCheckoutJob = () => {
  cron.schedule("*/5 * * * *", async () => {
    console.log("Running auto-checkout job...");

    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    //const threeHoursAgo = new Date(Date.now() - 2 * 60 * 1000);

    try {
      const expiredBookings = await Booking.find({
        status: "ACTIVE",
        startedAt: { $lt: threeHoursAgo },
      });

      if (expiredBookings.length === 0) {
        console.log("No expired bookings found.");
        return;
      }

      console.log(
        `Found ${expiredBookings.length} expired bookings. Processing...`,
      );

      for (const booking of expiredBookings) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          const table = await Table.findById(booking.table).session(session);
          const space = await StudySpace.findById(booking.space).session(
            session,
          );

          booking.status = "ENDED";
          booking.endedAt = new Date();
          await booking.save({ session });

          if (table) {
            table.availableSeats += booking.seats;
            await table.save({ session });
          }

          if (space) {
            space.availableSeats += booking.seats;
            space.recomputeStatus();
            await space.save({ session });
          }

          await session.commitTransaction();
          session.endSession();

          // Real-time update for the table/space
          if (table && space) {
            io.emit("seatUpdated", {
              tableId: table._id.toString(),
              spaceId: space._id.toString(),
              availableSeats: table.availableSeats,
            });
          }

          // Optionally notify the specific user
          io.to(`user:${booking.user.toString()}`).emit("auto_checkout", {
            message:
              "Your study spot booking was automatically checked out after 3 hours.",
            bookingId: booking._id,
          });

          console.log(
            `Auto-checked out booking ${booking._id} for user ${booking.user}`,
          );
        } catch (err) {
          await session.abortTransaction();
          session.endSession();
          console.error(`Failed to auto-checkout booking ${booking._id}:`, err);
        }
      }
    } catch (err) {
      console.error("Error in auto-checkout job:", err);
    }
  });
};
