import Task from '../Models/Task.js';
import User from "../Models/User.js";
import Batch from "../Models/batchModel.js";

// Adding new task
export const addTask = async (req, res) => {

    const { assignedTo, title, description, startDate, endDate, status } = req.body;

    if (!assignedTo || !title || !description || !startDate || !endDate || !status) {
        return res.status(400).json({ error: "Please fill all the fields" });
    }

    try {
        // 1. Check if user exists
        const user = await User.findById(assignedTo);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // 2. Create and save task
        const newTask = new Task({
            assignedTo,
            title,
            description,
            startDate,
            endDate,
            status
        });
        const savedTask = await newTask.save();

        // 3. Update user's batch
        if (user.batch) {
            await Batch.findByIdAndUpdate(user.batch, {
                $inc: {
                    allTasks: 1,
                    ...(status === 'completed' ? { completedTasks: 1 } : {})
                },
                $push: {
                    tasks: {
                        taskId: savedTask._id,
                        status: savedTask.status,
                        assignedTo: savedTask.assignedTo
                    }
                }
            }, { new: true });
        } else {
            console.warn(`User ${user.name} is not assigned to any batch`);
        }

        // Optional: Confirm update in logs
        const updatedBatch = await Batch.findById(user.batch).populate('tasks.taskId');
        console.log("Updated batch tasks:", updatedBatch?.tasks);

        res.status(201).json({ storeData: savedTask });

    } catch (error) {
        console.error("Error adding task:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }

};


// Get all tasks
export const getTasks = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let tasksData;
        if (user.isAdmin || user.role === 'admin') {
            tasksData = await Task.find();
        } else {
            tasksData = await Task.find({ assignedTo: userId });
        }

        res.status(200).json({ tasksData });
    } catch (error) {
        res.status(400).json({ message: "Error fetching tasks", error });
    }
};


// Update task
export const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedTask = await Task.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!updatedTask) {
            return res.status(400).json({ error: "Task not found" });
        }

        console.log(updatedTask);
        res.status(200).json({ updatedTask });
    } catch (error) {
        res.status(400).json(error);
    }
};


// Get task details
export const getTaskDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const taskDetails = await Task.findById(id);
        res.status(200).json({ taskDetails });
    } catch (error) {
        console.error("Error getting task details:", error);
        res.status(500).json({ message: "Failed to get task details!" });
    }
};


// Delete task
export const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedTask = await Task.findByIdAndDelete({ _id: id });

        res.status(200).json(deletedTask);
    } catch (error) {
        res.status(400).json(error);
    }
};
