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

io.on("connection", (socket) => {
  console.log("🔌 Client connected");

  socket.on("joinRoom", ({ senderId, receiverId }) => {
    const room = [senderId, receiverId].sort().join("-");
    socket.join(room);
    console.log(`📥 User joined room: ${room}`);
  });

  socket.on("sendMessage", (message) => {
    const room = [message.sender, message.receiver].sort().join("-");
    io.to(room).emit("newMessage", message);
  });

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


app.use("/uploads", express.static("projectimageuploads"));

const corsOptions = {

  origin: ["https://www.scaleindia.org.in"],

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

const newCors = { origin: "http://localhost:5173" };

app.use(express.json());
app.use(cors(corsOptions));

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
app.use("/dashboard", dashboardRoutes);



const responses = {
  hello: "Hi! How can I assist you?",
  goodbye: "Goodbye! Have a nice day.",
  default: "Sorry, I didn't understand that.",
};

app.post("/chat", (req, res) => {
  const userMessage = req.body.message ? req.body.message.toLowerCase() : "";
  let botResponse = responses[userMessage] || responses.default;
  res.json({ message: botResponse });
});

startCronJobs();

app.get("/ping", (req, res) => {
  res.send("PONG");
});

app.get("/", (req, res) => {
  res.send("IISPPR Server is up and running!");
});

const PORT = process.env.PORT || 4000;

connectDB()
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
