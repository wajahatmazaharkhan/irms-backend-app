// ticketRoutes.js
import express from "express";

import {
  createTicket,
  getAllTickets,
  getTicketsByUser,
  sendMessageInTicket,
  getMessagesInTicket,
  markMessagesAsSeenInTicket,
  updateTicketStatus,
  assignTicket,
  getCommRanking
} from "../Controllers/ticketController.js";

const ticketRouter = express.Router();

ticketRouter.post("/create", createTicket); // Create ticket
ticketRouter.get("/getall", getAllTickets); // For Comm Team
ticketRouter.get("/getcommrank", getCommRanking); // For Comm Team
ticketRouter.get("/getbyid/:userId", getTicketsByUser); // For Intern
ticketRouter.post("/:ticketId/message", sendMessageInTicket);
ticketRouter.get("/:ticketId/messages", getMessagesInTicket);
ticketRouter.patch("/:ticketId/messages/seen", markMessagesAsSeenInTicket);
ticketRouter.patch("/updatestatus/:ticketId", updateTicketStatus);
ticketRouter.patch("/assign/:ticketId", assignTicket);


// Route Example
/*ticketRouter.delete("/ticket/delete-all", async (req, res) => {
  try {
    await Ticket.deleteMany({});
    res.status(200).json({ message: "All tickets deleted successfully." });
  } catch (error) {
    console.error("Error deleting tickets:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});*/


export default ticketRouter;
