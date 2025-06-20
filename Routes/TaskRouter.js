import express from "express";
import { addTask, getTasks, updateTask, deleteTask, getTaskDetails,getAllTasks } from "../Controllers/TaskController.js";
import {reviewTaskSubmission} from "../Controllers/Tasksubmitioncontroller.js";

const taskRouter = express.Router();


taskRouter.get("/getalltasks", getAllTasks);
taskRouter.post("/add-task", addTask);
taskRouter.get("/get-tasks/:userId", getTasks);
taskRouter.put("/update-task/:id", updateTask);
taskRouter.delete("/delete-task/:id", deleteTask);
taskRouter.get("/get-task/:id", getTaskDetails);
taskRouter.post("/reviewtask", reviewTaskSubmission);


export default taskRouter;