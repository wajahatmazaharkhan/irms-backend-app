import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/db/index.js";
import cors from "cors";

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
dotenv.config();

const app = express();

app.use("/uploads", express.static("projectimageuploads"));

const corsOptions = {
<<<<<<< Updated upstream
  origin: ["https://www.scaleindia.org.in", "http://localhost:5173"],
  credentials: true,
  methods: "GET, POST, DELETE, PATCH, HEAD, PUT, OPTIONS",
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Access-Control-Allow-Credentials",
    "cache-control",
  ],
  exposedHeaders: ["Authorization"],
=======
	origin: "https://www.scaleindia.org.in",
	credentials: true,
	methods: "GET, POST, DELETE, PATCH, HEAD, PUT, OPTIONS",
	allowedHeaders: [
		"Content-Type",
		"Authorization",
		"Access-Control-Allow-Credentials",
		"cache-control",
	],
	exposedHeaders: ["Authorization"],
>>>>>>> Stashed changes
};

const newCors = { origin: "http://localhost:5173" };

app.use(express.json());
app.use(cors(corsOptions));

app.use("/api/auth", router);
app.use("/user", passwordUpdateRouter);
app.use("/", attendanceRoutes);
app.use("/task", taskRouter);
app.use("/", adminRouter);
app.use("/reports", reportRoutes);
app.use("/project", projectRoutes);
app.use("/weeklystatus", submitReportRoutes);
app.use("/", taskSubmitRoutes);
app.use("/send", notificationRouter);
app.use("/", leaveRoutes);
app.use("/", HrInternAssociation);
app.use("/api/batch", batchRouter);

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
    app.listen(PORT, () => {
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
