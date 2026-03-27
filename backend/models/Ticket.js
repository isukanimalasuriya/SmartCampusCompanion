import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, default: 'Pending' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Ticket', ticketSchema);