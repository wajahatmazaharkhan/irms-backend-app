import Batch from "../Models/batchModel.js";

// create a new batch
export const createBatch = async (req, res) => {
    try {
        const { name, startDate, EndDate, interns, hr } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Batch name is required." });
        }

        // Check for duplicate batch with same name, start and end date
        const existingBatch = await Batch.findOne({
            name: name.trim(),
            //startDate: new Date(startDate),
            EndDate: new Date(EndDate),
        });

        if (existingBatch) {
            return res.status(409).json({
                error:
                    "A batch with the same name, start date, and end date already exists.",
            });
        }

        const newBatch = new Batch({
            name,
            startDate,
            EndDate,
            interns,
            hr,
        });

        const savedBatch = await newBatch.save();

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
        const batches = await Batch.find()
            .populate("interns", "_id")
            .populate("hr"); // no select here, we want full docs

        const result = batches.map((batch, index) => {
            console.log(`\n== Batch ${index + 1}: ${batch.name} ==`);
            console.log("Populated HR array:", batch.hr);

            return {
                _id: batch._id,
                name: batch.name,
                startDate: batch.startDate,
                EndDate: batch.EndDate,
                totalInterns: Array.isArray(batch.interns) ? batch.interns.length : 0,
                totalHR: Array.isArray(batch.hr) ? batch.hr.length : 0,
            };
        });

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
            .populate("hr", "name email role _id");

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

        // Check if batch exists
        const batch = await Batch.findById(id);
        if (!batch) {
            return res.status(404).json({ error: "Batch not found." });
        }

        // Update fields
        batch.name = name || batch.name;
        batch.startDate = startDate || batch.startDate;
        batch.EndDate = EndDate || batch.EndDate;
        batch.interns = interns || batch.interns;
        batch.hr = hr || batch.hr;

        const updated = await batch.save();

        return res.status(200).json({
            message: "Batch updated successfully.",
            data: updated,
        });
    } catch (error) {
        console.error("Error updating batch:", error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};



