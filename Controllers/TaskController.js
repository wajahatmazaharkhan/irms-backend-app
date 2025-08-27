import Task from '../Models/Task.js';
import User from "../Models/User.js";
import Batch from "../Models/batchModel.js";
import connectDB from '../src/db/index.js';



export const addTask = async (req, res) => {
    await connectDB();
    const { assignedTo, title, description, startDate, endDate,type} = req.body;
	const status = "pending";
    // 1. Validate input
    if (!assignedTo || !title || !description || !startDate || !endDate || !status ||!type) {
        console.warn("Validation failed: Missing required fields.");
        return res.status(400).json({ error: "Please fill all the fields" });
    }

    try {
        // 2. Find user
        const user = await User.findById(assignedTo);
        if (!user) {

            console.warn(`User with ID ${assignedTo} not found.`);
            return res.status(404).json({ message: "User not found" });
        }

        // 3. Create and save task

        const newTask = new Task({
            assignedTo,
            title,
            description,
            startDate,
            endDate,
            status,
			taskType:type,
        });

        const savedTask = await newTask.save();
        console.log(`Task "${title}" assigned to ${user.name} (ID: ${user._id}) saved with ID ${savedTask._id}`);

        // 4. Update user's batch
        if (user.batch) {
            const batchUpdate = await Batch.findByIdAndUpdate(
                user.batch,
                {
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
                },
                { new: true }
            ).populate("tasks.taskId");

            if (batchUpdate) {
                console.log(`Batch "${batchUpdate.name}" updated. Total Tasks: ${batchUpdate.allTasks}, Completed: ${batchUpdate.completedTasks}`);
            } else {
                console.warn(`Batch with ID ${user.batch} not found during task update.`);
            }

        } else {
            console.warn(`User "${user.name}" (ID: ${user._id}) is not assigned to any batch.`);
        }

        // 5. Return response
        res.status(201).json({ storeData: savedTask });

    } catch (error) {
        console.error("Error adding task:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};



// Get all tasks
export const getTasks = async (req, res) => {
    await connectDB();
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
    await connectDB();
    try {
        const { id } = req.params;
        const updatedTask = await Task.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!updatedTask) {
            return res.status(400).json({ error: "Task not found" });
        }

        res.status(200).json({ updatedTask });
    } catch (error) {
        res.status(400).json(error);
    }
};


// Get task details
export const getTaskDetails = async (req, res) => {
    await connectDB();
    const { id } = req.params;
    try {
        const taskDetails = await Task.findById(id);
        res.status(200).json({ taskDetails });
    } catch (error) {
        console.error("Error getting task details:", error);
        res.status(500).json({ message: "Failed to get task details!" });
    }
};


// Get all task details
export const getAllTasks = async (req, res) => {
    await connectDB();
    try {
        const taskDetails = await Task.find({});
        res.status(200).json({ taskDetails });
    } catch (error) {
        console.error("Error getting task details:", error);
        res.status(500).json({ message: "Failed to get task details!" });
    }
};


// Delete task
export const deleteTask = async (req, res) => {
    await connectDB();
    try {
        const { id } = req.params;
        const deletedTask = await Task.findByIdAndDelete({ _id: id });

        res.status(200).json(deletedTask);
    } catch (error) {
        res.status(400).json(error);
    }
};
