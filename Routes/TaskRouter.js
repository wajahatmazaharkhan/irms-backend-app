import express from "express";
import { addTask, getTasks, updateTask, deleteTask, getTaskDetails } from "../Controllers/TaskController.js";
import {reviewTaskSubmission} from "../Controllers/TasksubmitionController.js";

const taskRouter = express.Router();

taskRouter.post("/add-task", addTask);
taskRouter.get("/get-tasks/:userId", getTasks);
taskRouter.put("/update-task/:id", updateTask);
taskRouter.delete("/delete-task/:id", deleteTask);
taskRouter.get("/get-task/:id", getTaskDetails);
taskRouter.post("/reviewtask", reviewTaskSubmission);

export default taskRouter;