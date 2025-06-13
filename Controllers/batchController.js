import Batch from "../Models/batchModel.js";
import HRIntern from "../Models/HrInternAssociation.js";
import mongoose from 'mongoose';
import User from '../Models/User.js';

export const createBatch = async (req, res) => {
    try {
        const { name, startDate, EndDate, interns = [], hr = [] } = req.body;

        if (!name || !startDate || !EndDate) {
            return res.status(400).json({ error: "Batch name, start date, and end date are required." });
        }

        // Check for duplicate batch (by name + endDate)
        const existingBatch = await Batch.findOne({
            name: name.trim(),
            EndDate: new Date(EndDate),
        });

        if (existingBatch) {
            return res.status(409).json({
                error: "A batch with the same name and end date already exists.",
            });
        }

        // Ensure HRIntern documents exist
        const hrInternIds = [];
        for (const userId of hr) {
            let hrIntern = await HRIntern.findOne({ hrId: userId });
            if (!hrIntern) {
                hrIntern = await HRIntern.create({
                    hrId: userId,
                    internIds: [],
                });
                console.log(`Created HRIntern for userId ${userId}`);
            }
            hrInternIds.push(hrIntern._id);
        }

        // Create new batch with HRIntern refs
        const newBatch = new Batch({
            name: name.trim(),
            startDate: new Date(startDate),
            EndDate: new Date(EndDate),
            interns,
            hr: hrInternIds,
        });

        const savedBatch = await newBatch.save();

        // Update each intern's batch field
        if (interns.length > 0) {
            await User.updateMany(
                { _id: { $in: interns } },
                { $set: { batch: savedBatch._id } }
            );
        }

        return res.status(201).json({
            message: "Batch created successfully",
            data: savedBatch,
        });

    } catch (error) {
        console.error("Error creating batch:", error);
        return res.status(500).json({
            error: "Internal Server Error",
            details: error.message,
        });
    }
};


export const getBatchesWithCounts = async (req, res) => {
    try {


        // const rawBatches = await Batch.find().lean();
        // console.log(rawBatches.map(b => ({
        //     name: b.name,
        //     hrRaw: b.hr,  // Should be array of ObjectIds
        // })));


        // const hrDocs = await HRIntern.find().lean();
        // console.log("HRInterns:", hrDocs.map(h => h._id.toString()));


        const batches = await Batch.find()
            .populate("interns", "_id")
            .populate({
                path: "hr",
                populate: {
                    path: "hrId",
                    model: "User",
                    select: "name email role",
                },
            });

        const result = batches.map((batch) => ({
            _id: batch._id,
            name: batch.name,
            startDate: batch.startDate,
            EndDate: batch.EndDate,
            totalInterns: Array.isArray(batch.interns) ? batch.interns.length : 0,
            totalHR: Array.isArray(batch.hr)
                ? batch.hr.filter(h => h.hrId).length
                : 0,
        }));

        return res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching batches:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


// Get batch by ID
export const getBatchById = async (req, res) => {
    try {
        const { id } = req.params;

        const batch = await Batch.findById(id)
            .populate("interns", "name email role _id")
            .populate({
                path: "hr",
                populate: {
                    path: "hrId", // inside HRIntern schema
                    model: "User",
                    select: "name email role _id",
                },
            });


        if (!batch) {
            return res.status(404).json({ error: "Batch not found." });
        }

        return res.status(200).json(batch);
    } catch (error) {
        console.error("Error fetching batch by ID:", error);
        return res.status(500).json({
            error: "Internal Server Error",
            details: error.message,
        });
    }
};

export const deleteBatch = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedBatch = await Batch.findByIdAndDelete(id);

        if (!deletedBatch) {
            return res.status(404).json({ error: "Batch not found." });
        }

        return res.status(200).json({
            message: "Batch deleted successfully.",
            data: deletedBatch,
        });
    } catch (error) {
        console.error("Error deleting batch:", error);
        return res.status(500).json({
            error: "Internal Server Error",
            details: error.message,
        });
    }
};

export const updateBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, startDate, EndDate, interns, hr } = req.body;

        // 1. Find existing batch
        const batch = await Batch.findById(id);
        if (!batch) {
            return res.status(404).json({ error: "Batch not found." });
        }

        // 2. Resolve HR user IDs → HRIntern IDs if hr is provided
        let hrInternIds = batch.hr;
        if (Array.isArray(hr)) {
            hrInternIds = [];
            for (const userId of hr) {
                let hrIntern = await HRIntern.findOne({ hrId: userId });

                if (!hrIntern) {
                    hrIntern = await HRIntern.create({
                        hrId: userId,
                        internIds: [],
                    });
                    console.log(`Created HRIntern for userId ${userId}`);
                }

                hrInternIds.push(hrIntern._id);
            }
        }

        // 3. Update fields conditionally
        if (name) batch.name = name;
        if (startDate) batch.startDate = new Date(startDate);
        if (EndDate) batch.EndDate = new Date(EndDate);
        if ('interns' in req.body) batch.interns = interns; // preserves data if not passed
        if ('hr' in req.body) batch.hr = hrInternIds;

        // 4. Save
        const updatedBatch = await batch.save();

        return res.status(200).json({
            message: "Batch updated successfully.",
            data: updatedBatch,
        });
    } catch (error) {
        console.error("Error updating batch:", error);
        return res.status(500).json({
            error: "Internal Server Error",
            details: error.message,
        });
    }
};



export const getBatchProgress = async (req, res) => {
    try {
        const batches = await Batch.find()
            .populate('tasks.taskId', 'title description status')
            .populate('tasks.assignedTo', 'name email');

        const progressData = batches.map((batch) => {
            const progress = batch.allTasks > 0 ? (batch.completedTasks / batch.allTasks) * 100 : 0;

            const taskStats = batch.tasks.reduce((acc, task) => {
                const actualStatus = task.taskId?.status || 'pending'; // rely only on real status from task
                acc[actualStatus] = (acc[actualStatus] || 0) + 1;
                return acc;
            }, { pending: 0, completed: 0 });

            return {
                _id: batch._id,
                name: batch.name,
                startDate: batch.startDate,
                EndDate: batch.EndDate,
                allTasks: batch.allTasks,
                completedTasks: batch.completedTasks,
                progress: parseFloat(progress.toFixed(2)),
                taskStats,
                tasks: batch.tasks.map(task => ({
                    taskId: task.taskId?._id || task.taskId,
                    title: task.taskId?.title,
                    description: task.taskId?.description,
                    status: task.taskId?.status || 'pending',  // always show latest
                    assignedTo: {
                        _id: task.assignedTo?._id,
                        name: task.assignedTo?.name,
                        email: task.assignedTo?.email
                    }
                }))
            };
        });
        res.status(200).json(progressData);
    } catch (error) {
        console.error("Error fetching batch progress:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

