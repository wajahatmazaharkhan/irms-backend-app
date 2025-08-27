// ticketController.js
import Ticket from "../Models/ticketModel.js";
import User from "../Models/User.js";
import connectDB from "../src/db/index.js";

export const createTicket = async (req, res) => {
  await connectDB();
  try {
    const { title, description, userId } = req.body;

    if (!title || !description || !userId) {
      return res.status(400).json({ message: "Title, Description, and userId are required." });
    }

    const newTicket = await Ticket.create({
      title,
      description,
      createdBy: userId,
      status: "Open",
      history: [
        {
          action: "Ticket created",
          by: userId,
        },
      ],
    });

    res.status(201).json({
      message: "Ticket created successfully",
      ticket: newTicket,
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({ message: "Server error while creating ticket" });
  }
};


export const getAllTickets = async (req, res) => {
  await connectDB();
  try {
    const tickets = await Ticket.find()
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 }); // Latest first

    res.status(200).json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ message: "Server error while fetching tickets" });
  }
};

export const getTicketsByUser = async (req, res) => {
  await connectDB();
  try {
    const { userId } = req.params;

    const tickets = await Ticket.find({ createdBy: userId })
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    console.error("Error fetching user's tickets:", error);
    res.status(500).json({ message: "Server error while fetching tickets" });
  }
};

// ✅ Send a message in a ticket
export const sendMessageInTicket = async (req, res) => {
  await connectDB();
  const { ticketId } = req.params;
  const { senderId, text } = req.body;

  if (!senderId || !text) {
    return res.status(400).json({ error: "Sender and text are required." });
  }

  try {
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found." });
    }

    // Check if sender is either createdBy or assignedTo
    if (
      senderId !== ticket.createdBy.toString() &&
      senderId !== (ticket.assignedTo?.toString() || "")
    ) {
      return res.status(403).json({ error: "Unauthorized to send message in this ticket." });
    }

    const newMessage = {
      sender: senderId,
      text,
      timestamp: new Date(),
      seen: false,
    };

    ticket.messages.push(newMessage);
    await ticket.save();

    res.status(201).json({ message: "Message sent successfully.", data: newMessage });
  } catch (error) {
    console.error("Error sending message in ticket:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};


// ✅ Get all messages in a ticket
export const getMessagesInTicket = async (req, res) => {
  await connectDB();
  const { ticketId } = req.params;

  try {
    const ticket = await Ticket.findById(ticketId)
      .populate("messages.sender", "name email") // optional: populate sender info
      .select("messages");

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found." });
    }

    res.status(200).json({ data: ticket.messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};


// ✅ Optional — Mark all unseen messages as seen for a user
export const markMessagesAsSeenInTicket = async (req, res) => {
  await connectDB();
  const { ticketId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "UserId is required." });
  }

  try {
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found." });
    }

    let updated = false;

    ticket.messages.forEach((msg) => {
      if (msg.sender.toString() !== userId && !msg.seen) {
        msg.seen = true;
        updated = true;
      }
    });

    if (updated) {
      await ticket.save();
    }

    res.status(200).json({ message: "Messages marked as seen." });
  } catch (error) {
    console.error("Error marking messages as seen:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};


export const updateTicketStatus = async (req, res) => {
  await connectDB();
    const { ticketId } = req.params;
    const { newStatus, userId } = req.body;

    const validStatuses = ["Open", "In Progress", "Pending Confirmation", "Closed"];
    if (!validStatuses.includes(newStatus)) {
        return res.status(400).json({ error: "Invalid status value." });
    }

    try {
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found." });
        }

        // Update status
        ticket.status = newStatus;

        // If moved to Pending Confirmation, set timestamp
        if (newStatus === "Pending Confirmation") {
            ticket.pendingConfirmationSince = new Date();
        } else {
            ticket.pendingConfirmationSince = null;
        }

        // Add to history
        ticket.history.push({
            action: `Status changed to ${newStatus}`,
            by: userId,
            at: new Date(),
        });

        await ticket.save();

        res.status(200).json({ message: "Status updated successfully", ticket });

    } catch (error) {
        console.error("Error updating ticket status:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const assignTicket = async (req, res) => {
  await connectDB();
  const { ticketId } = req.params;
  const { userId } = req.body; // Comm team member assigning to self

  if (!userId) {
    return res.status(400).json({ error: "User ID is required for assignment." });
  }

  try {
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found." });
    }

    if (ticket.assignedTo) {
      return res.status(400).json({ error: "Ticket is already assigned." });
    }

    ticket.assignedTo = userId;
    ticket.history.push({
      action: "Assigned to Communication Team Member",
      by: userId,
    });

    await ticket.save();

    res.status(200).json({ message: "Ticket assigned successfully.", ticket });
  } catch (error) {
    console.error("Error assigning ticket:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};



export const getCommRanking = async (req, res) => {
  await connectDB();
  try {
    const ranking = await Ticket.aggregate([
      {
        $match: {
          status: "Closed",
          assignedTo: { $ne: null }, // Ignore unassigned
        },
      },
      {
        $group: {
          _id: "$assignedTo",
          closedCount: { $sum: 1 },
        },
      },
      {
        $sort: { closedCount: -1 }, // Descending order
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: "$userInfo",
      },
      {
        $project: {
          _id: 0,
          userId: "$userInfo._id",
          name: "$userInfo.name",
          email: "$userInfo.email",
          closedCount: 1,
        },
      },
    ]);

    res.status(200).json({ success: true, data: ranking });
  } catch (err) {
    console.error("Error in getCommRanking:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
