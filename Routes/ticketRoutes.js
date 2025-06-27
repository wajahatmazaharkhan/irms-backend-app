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
  assignTicket
} from "../Controllers/ticketController.js";

const ticketRouter = express.Router();

ticketRouter.post("/create", createTicket); // Create ticket
ticketRouter.get("/getall", getAllTickets); // For Comm Team
ticketRouter.get("/getbyid/:userId", getTicketsByUser); // For Intern
ticketRouter.post("/:ticketId/message", sendMessageInTicket);
ticketRouter.get("/:ticketId/messages", getMessagesInTicket);
ticketRouter.patch("/:ticketId/messages/seen", markMessagesAsSeenInTicket);
ticketRouter.patch("/updatestatus/:ticketId", updateTicketStatus);
ticketRouter.patch("/assign/:ticketId", assignTicket);



export default ticketRouter;
