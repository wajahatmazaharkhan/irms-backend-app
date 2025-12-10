import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/db/index.js";
import cors from "cors";
import messageRoutes from "./Routes/messageRoutes.js";
import router from "./Routes/AuthRouter.js";
import attendanceRoutes from "./Routes/AttendanceRoutes.js";
import { startCronJobs } from "./Controllers/AutoAccountDel.js";
import adminRouter from "./Routes/AdminRoutes.js";
import passwordUpdateRouter from "./Routes/Updatepassword.js";
import taskRouter from "./Routes/TaskRouter.js";
import reportRoutes from "./Routes/ReportRoutes.js";
import submitReportRoutes from "./Routes/SubmitreportRoutes.js";
import projectRoutes from "./Routes/ProjectRoutes.js";
import taskSubmitRoutes from "./Routes/Tasksubmitionroutes.js";
import notificationRouter from "./Routes/notificationRouter.js";
import leaveRoutes from "./Routes/Leave.js";
import HrInternAssociation from "./Routes/HrInternRoutes.js";
import batchRouter from "./Routes/batchRouter.js";
import RankRouter from "./Routes/RankRoutes.js";
import ticketRouter from "./Routes/ticketRoutes.js";
import http from "http";
import { Server } from "socket.io";
import dashboardRoutes from "./Routes/DashboardRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PATCH", "HEAD", "PUT", "OPTIONS"]
  }
});

// Socket.IO Implementation
io.on("connection", (socket) => {
  console.log("🔌 Client connected");

  // 1. User-to-User Chat Rooms
  socket.on("joinRoom", ({ senderId, receiverId }) => {
    const room = [senderId, receiverId].sort().join("-");
    socket.join(room);
    console.log(`📥 User joined private room: ${room}`);
  });

  // 2. Ticket-Based Rooms (NEW)
  socket.on("joinTicketRoom", ({ ticketId, userId }) => {
    const room = `ticket_${ticketId}`;
    socket.join(room);
    console.log(`🎫 User ${userId} joined ticket room: ${room}`);
  });

  // Message Handlers
  socket.on("sendMessage", (message) => {
    const room = [message.sender, message.receiver].sort().join("-");
    io.to(room).emit("newMessage", message);
  });

  socket.on("sendTicketMessage", (message) => {
    const room = `ticket_${message.ticketId}`;
    io.to(room).emit("newTicketMessage", message);
    console.log(`✉️ Ticket message broadcast to ${room}`);
  });

  // Typing Indicators
  socket.on("typing", ({ senderId, receiverId }) => {
    const room = [senderId, receiverId].sort().join("-");
    socket.to(room).emit("typing", { senderId });
  });

  socket.on("stopTyping", ({ senderId, receiverId }) => {
    const room = [senderId, receiverId].sort().join("-");
    socket.to(room).emit("stopTyping", { senderId });
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected");
  });
});

// Middleware and Routes
app.use("/uploads", express.static("projectimageuploads"));

const corsOptions = {
  origin: ["https://www.scaleindia.org.in", "https://ims-frontend-app-sigma.vercel.app"],
  credentials: true,
  methods: "GET, POST, DELETE, PATCH, HEAD, PUT, OPTIONS",
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Access-Control-Allow-Credentials",
    "cache-control",
  ],
  exposedHeaders: ["Authorization"],
};

const devCorsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
  methods: "GET, POST, DELETE, PATCH, HEAD, PUT, OPTIONS",
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Access-Control-Allow-Credentials",
    "cache-control",
  ],
  exposedHeaders: ["Authorization"],
};


app.use(express.json());
app.use(cors(corsOptions));

// Routes
app.use("/", RankRouter);
app.use("/api/auth", router);
app.use("/user", passwordUpdateRouter);
app.use("/", attendanceRoutes);
app.use("/task", taskRouter);
app.use("/chat", messageRoutes);
app.use("/", adminRouter);
app.use("/reports", reportRoutes);
app.use("/project", projectRoutes);
app.use("/weeklystatus", submitReportRoutes);
app.use("/", taskSubmitRoutes);
app.use("/send", notificationRouter);
app.use("/", leaveRoutes);
app.use("/", HrInternAssociation);
app.use("/api/batch", batchRouter);
app.use("/ticket", ticketRouter);
app.use("/dashboard", dashboardRoutes);

// Test Endpoints
app.post("/chat", (req, res) => {
  const responses = {
    hello: "Hi! How can I assist you?",
    goodbye: "Goodbye! Have a nice day.",
    default: "Sorry, I didn't understand that.",
  };
  const userMessage = req.body.message ? req.body.message.toLowerCase() : "";
  let botResponse = responses[userMessage] || responses.default;
  res.json({ message: botResponse });
});

app.get("/ping", (req, res) => {
  res.send("PONG");
});

app.get("/", (req, res) => {
  res.send("IISPPR Server is up and running!");
});

// Server Startup
startCronJobs();

const PORT = process.env.PORT || 4000;

await connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });

    app.on("error", (error) => {
      console.error(`Error: ${error}`);
      throw error;
    });
  })
  .catch((err) => {
    console.error(`MongoDB connection failed: ${err}`);
  });

export default app;
