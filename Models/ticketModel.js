import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // The student who raised it
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Comm team member
      default: null,
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Pending Confirmation", "Closed"],
      default: "Open",
    },

    // 🔥 Chat messages attached to the ticket
    messages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        seen: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // 🔥 Ticket history log
    history: [
      {
        action: String, // e.g., "Marked as In Progress"
        by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        at: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // 🔥 For 24hr auto-close tracking
    pendingConfirmationSince: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Ticket", ticketSchema);
