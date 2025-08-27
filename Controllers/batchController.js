import Batch from "../Models/batchModel.js";
import HRIntern from "../Models/HrInternAssociation.js";
import mongoose from 'mongoose';
import User from '../Models/User.js';
import connectDB from "../src/db/index.js";

export const createBatch = async (req, res) => {
  await connectDB();
  try {
    const { name, startDate, endDate, interns = [], hr = [] } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({ error: "Batch name, start date, and end date are required." });
    }

    // Check for duplicate batch (by name + endDate)
    const existingBatch = await Batch.findOne({
      name: name.trim(),
      endDate: new Date(endDate),
    });

    if (existingBatch) {
      return res.status(409).json({
        error: "A batch with the same name and end date already exists.",
      });
    }

    // Create or get HRIntern references
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

    // Remove interns from any existing batch they're part of
    if (interns.length > 0) {
      await Batch.updateMany(
        { interns: { $in: interns } },
        { $pull: { interns: { $in: interns } } }
      );
      console.log(`Removed interns ${interns.join(", ")} from previous batches`);

      // Clear outdated batch refs from User
      await User.updateMany(
        { _id: { $in: interns } },
        { $unset: { batch: "" } }
      );
    }

    // Create new batch
    const newBatch = new Batch({
      name: name.trim(),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      interns,
      hr: hrInternIds,
    });

    const savedBatch = await newBatch.save();

    // Set user's new batch reference
    await User.updateMany(
      { _id: { $in: interns } },
      { $set: { batch: savedBatch._id } }
    );

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
  await connectDB();
  try {

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
      endDate: batch.endDate,
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
  await connectDB();
  try {
    const { id } = req.params;

    const batch = await Batch.findById(id)
      .populate("interns", "name email role _id")
      .populate({
        path: "hr",
        populate: {
          path: "hrId",
          model: "User",
          select: "name email role _id",
        },
      });

    if (!batch) {
      return res.status(404).json({ error: "Batch not found." });
    }

    // Transform the data before sending to frontend
    const responseData = {
      ...batch._doc,
      hr: batch.hr.map(hrIntern => ({
        _id: hrIntern._id,
        hrId: hrIntern.hrId, // Already populated
        internIds: hrIntern.internIds // Not populated here
      }))
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching batch by ID:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};

export const deleteBatch = async (req, res) => {
  await connectDB();
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
  await connectDB();
  try {
    const { id } = req.params;
    const { name, startDate, endDate, interns, hr } = req.body;

    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({ error: "Batch not found." });
    }

    let isModified = false;

    //Handle HR field
    let updatedHrInternIds = [];

    if (Array.isArray(hr)) {
      for (const userId of hr) {
        let hrIntern = await HRIntern.findOne({ hrId: userId });

        if (!hrIntern) {
          hrIntern = await HRIntern.create({
            hrId: userId,
            internIds: [],
          });
          console.log(`Created HRIntern for userId ${userId}`);
        }

        updatedHrInternIds.push(hrIntern._id.toString());
      }

      const existingHrIds = batch.hr.map(i => i.toString()).sort();
      const incomingHrIds = [...updatedHrInternIds].sort();

      if (JSON.stringify(existingHrIds) !== JSON.stringify(incomingHrIds)) {
        batch.hr = updatedHrInternIds;
        isModified = true;
      }
    }

    // Update name/start/end if changed
    if (name && name !== batch.name) {
      batch.name = name;
      isModified = true;
    }

    if (startDate && new Date(startDate).getTime() !== new Date(batch.startDate).getTime()) {
      batch.startDate = new Date(startDate);
      isModified = true;
    }

    if (endDate && new Date(endDate).getTime() !== new Date(batch.endDate).getTime()) {
      batch.endDate = new Date(endDate);
      isModified = true;
    }

    //Handle interns change
    if ('interns' in req.body && Array.isArray(interns)) {
      const oldInterns = batch.interns.map(i => i.toString());
      const newInterns = interns.map(i => i.toString());

      const addedInterns = newInterns.filter(i => !oldInterns.includes(i));
      const removedInterns = oldInterns.filter(i => !newInterns.includes(i));

      if (addedInterns.length > 0) {
        // Remove added interns from all other batches
        await Batch.updateMany(
          { _id: { $ne: batch._id }, interns: { $in: addedInterns } },
          { $pull: { interns: { $in: addedInterns } } }
        );
        console.log(`Removed ${addedInterns.length} interns from other batches`);

        // Clear stale batch ref
        await User.updateMany(
          { _id: { $in: addedInterns } },
          { $unset: { batch: "" } }
        );

        // Assign to current batch
        await User.updateMany(
          { _id: { $in: addedInterns } },
          { $set: { batch: batch._id } }
        );
        console.log(`Assigned ${addedInterns.length} intern(s) to batch ${batch.name}`);
      }

      if (removedInterns.length > 0) {
        await User.updateMany(
          { _id: { $in: removedInterns }, batch: batch._id },
          { $unset: { batch: "" } }
        );
        console.log(`Removed ${removedInterns.length} intern(s) from batch ${batch.name}`);
      }

      const existingInternIds = oldInterns.sort();
      const incomingInternIds = newInterns.sort();

      if (JSON.stringify(existingInternIds) !== JSON.stringify(incomingInternIds)) {
        batch.interns = interns;
        isModified = true;
      }
    }

    //Save if needed
    if (isModified) {
      const updatedBatch = await batch.save();
      return res.status(200).json({
        message: "Batch updated successfully.",
        data: updatedBatch,
      });
    } else {
      return res.status(200).json({
        message: "No changes were made.",
        data: batch,
      });
    }

  } catch (error) {
    console.error("Error updating batch:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
};

export const getBatchProgress = async (req, res) => {
  await connectDB();
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
        endDate: batch.endDate,
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

// GET /batches/available-interns

export const getAvailableInterns = async (req, res) => {
  await connectDB();
  try {
    // Step 1: Get all batches
    const existingBatches = await Batch.find({}, "_id");
    const existingBatchIds = existingBatches.map(b => b._id.toString());

    // Step 2: Get interns where batch is:
    // - null
    // - or not in existingBatchIds (after converting user.batch to string)
    const allInterns = await User.aggregate([
      { $match: { role: "intern" } },
      {
        $project: {
          id: "$_id",      // Alias _id to id
          _id: 0,          // Exclude original _id
          name: 1,
          email: 1,
          batch: 1,
          role: 1,
        },
      },
    ]);


    const availableInterns = allInterns.filter(intern =>
      intern.batch === null ||
      !existingBatchIds.includes(intern.batch?.toString())
    );

    res.status(200).json({
      message: "Available interns fetched successfully",
      data: availableInterns
    });

  } catch (error) {
    console.error("Error fetching available interns:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message
    });
  }
};


export const getBatchesWithHrAndInternIDs = async (req, res) => {
  await connectDB();
  try {
    const batches = await Batch.find()
      .populate({
        path: "interns",
        select: "_id name email", // Added name and email for more useful data
      })
      .populate({
        path: "hr",
        populate: {
          path: "hrId",
          model: "User",
          select: "name email role",
        },
      })
      .lean(); // Using lean() for better performance

    const result = batches.map((batch) => ({
      _id: batch._id,
      name: batch.name,
      startDate: batch.startDate,
      endDate: batch.endDate, // Fixed capitalization of EndDate
      interns:
        batch.interns?.map((intern) => ({
          _id: intern._id,
          name: intern.name,
          email: intern.email,
        })) || [],
      hr:
        batch.hr?.map((hr) => ({
          _id: hr.hrId?._id,
          name: hr.hrId?.name,
          email: hr.hrId?.email,
          role: hr.hrId?.role,
        })) || [],
      totalInterns: batch.interns?.length || 0,
      totalHR: batch.hr?.filter((h) => h.hrId)?.length || 0,
    }));

    return res.status(200).json({
      success: true,
      data: result,
      message: "Batches fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching batches:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch batches",
      message: error.message,
    });
  }
};

export const getByHr = async (req, res) => {
  await connectDB();
  try {
    const { hrId } = req.params;

    // Validate the HR ID
    if (!mongoose.Types.ObjectId.isValid(hrId)) {
      return res.status(400).json({ error: "Invalid HR ID." });
    }

    // Finding the HRIntern document for the given HR
    const hrIntern = await HRIntern.findOne({ hrId }).lean();

    // Finding batches where this HRIntern document is referenced in the hr array
    const batches = await Batch.find({ hr: hrIntern })
      .populate("interns", "name email role _id")
      .populate({
        path: "hr",
        populate: {
          path: "hrId",
          model: "User",
          select: "name email role _id",
        },
      });

    const response = batches.map((batch) => {
      const managedInterns = batch.interns || [];

      return {
        _id: batch._id,
        name: batch.name,
        startDate: batch.startDate,
        endDate: batch.endDate,
        hr: batch.hr.map((h) => ({
          _id: h._id,
          hrId: h.hrId,
        })),
        interns: managedInterns,
        totalManagedInterns: managedInterns.length,
        totalHR: batch.hr.length,
      };
    });

    // Send the response
    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching batches by HR:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};


// GET /batch-requests/:batchId
export const getUsersByBatchId = async (req, res) => {
  await connectDB();
  try {
    const { batchId } = req.params;

    if (!batchId) {
      return res.status(400).json({ message: "Batch ID is required" });
    }

    const users = await User.find({
      unapprovedBatch: batchId,
      batchApproved: false,
    });

    res.status(200).json({ message: "Users fetched", data: users });
  } catch (err) {
    console.error("Error fetching users by batch ID:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// GET /batch-requests
export const getAllPendingBatchApprovals = async (req, res) => {
  await connectDB();
  try {
    const users = await User.find({
      role: "intern",
      batchApproved: false,
      unapprovedBatch: { $ne: null },
    });

    res.status(200).json({ message: "Pending batch approvals", data: users });
  } catch (err) {
    console.error("Error fetching pending batch approvals:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// PATCH /approve-batch/:userId
export const approveUserBatch = async (req, res) => {
  await connectDB();
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId);

    if (!user || !user.unapprovedBatch) {
      return res.status(404).json({ message: "User or unapproved batch not found" });
    }

    user.batch = user.unapprovedBatch;
    user.unapprovedBatch = null;
    user.batchApproved = true;
    user.isVerified = true;

    await user.save();

    res.status(200).json({ message: "Batch approved and assigned" });
  } catch (err) {
    console.error("Error approving user batch:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// PATCH /reject-batch/:userId

export const rejectUserBatch = async (req, res) => {
  await connectDB();
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(userId);

    return res.status(200).json({ message: "User rejected and deleted successfully" });
  } catch (error) {
    console.error("Error rejecting user batch request:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createTeam = async (req, res) => {
  await connectDB();
  try {

    if (!req.user || req.user.role !== "hr") {
      return res.status(403).json({ error: "Only HRs can create teams." });
    }
    const { batchId } = req.params;
    const { name, members = [] } = req.body;
    if (!name) return res.status(400).json({ error: "Team name is required." });
    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ error: "Batch not found." });

    const invalidMembers = members.filter(
      m => !batch.interns.map(i => i.toString()).includes(m)
    );
    if (invalidMembers.length > 0) {
      return res.status(400).json({ error: "Some members are not part of this batch.", invalidMembers });
    }
    batch.teams.push({ name, members, createdBy: req.user.id });
    await batch.save();
    return res.status(201).json({ message: "Team created successfully.", teams: batch.teams });
  } catch (error) {
    console.error("Error creating team:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};


export const addMembersToTeam = async (req, res) => {
  await connectDB();
  try {
    const { batchId, teamId } = req.params;
    const { members } = req.body;
    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ error: "Batch not found." });
    const team = batch.teams.id(teamId);
    if (!team) return res.status(404).json({ error: "Team not found." });

    const invalidMembers = members.filter(
      m => !batch.interns.map(i => i.toString()).includes(m)
    );
    if (invalidMembers.length > 0) {
      return res.status(400).json({ error: "Some members are not part of this batch.", invalidMembers });
    }

    members.forEach(m => {
      if (!team.members.map(mem => mem.toString()).includes(m)) {
        team.members.push(m);
      }
    });
    await batch.save();
    return res.status(200).json({ message: "Members added to team.", team });
  } catch (error) {
    console.error("Error adding members to team:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};


export const removeMemberFromTeam = async (req, res) => {
  await connectDB();
  try {
    const { batchId, teamId, memberId } = req.params;
    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ error: "Batch not found." });
    const team = batch.teams.id(teamId);
    if (!team) return res.status(404).json({ error: "Team not found." });
    team.members = team.members.filter(m => m.toString() !== memberId);
    await batch.save();
    return res.status(200).json({ message: "Member removed from team.", team });
  } catch (error) {
    console.error("Error removing member from team:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};


export const moveMemberBetweenTeams = async (req, res) => {
  await connectDB();
  try {
    const { batchId, fromTeamId, toTeamId, memberId } = req.body;
    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ error: "Batch not found." });
    const fromTeam = batch.teams.id(fromTeamId);
    const toTeam = batch.teams.id(toTeamId);
    if (!fromTeam || !toTeam) return res.status(404).json({ error: "One or both teams not found." });

    fromTeam.members = fromTeam.members.filter(m => m.toString() !== memberId);

    if (!toTeam.members.map(m => m.toString()).includes(memberId)) {
      toTeam.members.push(memberId);
    }
    await batch.save();
    return res.status(200).json({ message: "Member moved between teams.", fromTeam, toTeam });
  } catch (error) {
    console.error("Error moving member between teams:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};


export const updateTeam = async (req, res) => {
  await connectDB();
  try {
    const { batchId, teamId } = req.params;
    const { name } = req.body;
    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ error: "Batch not found." });
    const team = batch.teams.id(teamId);
    if (!team) return res.status(404).json({ error: "Team not found." });
    if (name) team.name = name;
    await batch.save();
    return res.status(200).json({ message: "Team updated.", team });
  } catch (error) {
    console.error("Error updating team:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};


export const deleteTeam = async (req, res) => {
  await connectDB();
  try {
    const { batchId, teamId } = req.params;
    const batch = await Batch.findById(batchId);
    if (!batch) return res.status(404).json({ error: "Batch not found." });
    batch.teams = batch.teams.filter(t => t._id.toString() !== teamId);
    await batch.save();
    return res.status(200).json({ message: "Team deleted." });
  } catch (error) {
    console.error("Error deleting team:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};
