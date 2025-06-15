import HRIntern from '../Models/HrInternAssociation.js'
import User from '../Models/User.js'


import TaskCompletion from "../Models/Tasksubmition.js";

import WeeklyStatus from "../Models/Report.js"

// Assign an intern to an HR
export const assignInternToHR = async (req, res) => {
  const { hrId, internId } = req.body;
  console.log("req got in assignInternToHR")

  try {
    // Check if the intern is already assigned
    console.log("inside try")
    const isAssigned = await HRIntern.findOne({ internIds: internId });
    if (isAssigned) {
      return res.status(400).json({ error: 'Intern is already assigned to an HR.' });
    }

    // Find the HR record
    const hrRecord = await HRIntern.findOne({ hrId });

    if (!hrRecord) {
      // Check if the HR exists in the User collection
      const hrUser = await User.findOne({ _id: hrId, department: 'hr' });

      if (!hrUser) {
        return res.status(404).json({ error: 'HR not found in the User collection or not part of HR department.' });
      }

      // Create a new HRIntern document
      console.log("Creating a new HRIntern document");
      const newHRRecord = new HRIntern({ hrId, internIds: [] });
      await newHRRecord.save();

      // Update the newly created HRIntern document to include the intern
      console.log("Adding the intern to the new HRIntern document");
      newHRRecord.internIds.push(internId);
      await newHRRecord.save();

      return res.status(201).json({ message: 'HR created and intern assigned successfully.' });
    }

    // If HR record exists, proceed to check the number of interns
    if (hrRecord.internIds.length >= 20) {
      return res.status(400).json({ error: 'This HR already has 20 interns assigned.' });
    }

    // Add the intern to the HR record
    console.log("Adding the intern to the existing HRIntern document");
    hrRecord.internIds.push(internId);
    await hrRecord.save();

    return res.status(200).json({ message: 'Intern assigned successfully.' });

    console.log("done")
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get interns by HR ID
export const getInternsByHR = async (req, res) => {
  const { hrId } = req.params;

  try {
    const hrRecord = await HRIntern.findOne({ hrId }).populate('internIds', '_id name email department mnumber ');

    if (!hrRecord) {
      return res.status(404).json({ error: 'HR not found.' });
    }

    res.status(200).json({ interns: hrRecord.internIds });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Check if an intern is assigned
export const checkInternAssignment = async (req, res) => {
  const { internId } = req.params;

  try {
    const isAssigned = await HRIntern.findOne({ internIds: internId });

    res.status(200).json({ assigned: !!isAssigned });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Batch check interns for assignment
export const batchCheckInternAssignments = async (req, res) => {
  const { internIds } = req.body; // Expecting an array of internIds

  try {
    // Find all HrInternAssociationAssociation records containing any of the provided internIds
    const records = await HRIntern.find({ internIds: { $in: internIds } });

    // Map internIds to their assigned status
    const assignedStatus = internIds.reduce((acc, id) => {
      acc[id] = records.some(record => record.internIds.includes(id));
      return acc;
    }, {});

    res.status(200).json({ assignedStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};







export const getInternsTaskCompletions = async (req, res) => {
  try {
    const hrId = req.user.id;
    // Find HR document to get intern IDs
    const hrIntern = await HRIntern.findOne({ hrId });

    if (!hrIntern) {
      res.status(400).json({ error: "no interns found" });
    }

    const internIds = hrIntern.internIds;

    if (internIds.length === 0) {
      res.status(200).json({ taskCompletions: [] });
    }

    // Fetch task completions submitted by these interns
    const taskCompletions = await TaskCompletion.find({ user: { $in: internIds } })
      .populate("user", "name email")  // Populate intern details
      .populate("task", "title description");  // Populate task details

    res.status(200).json({ taskCompletions });
  } catch (error) {
    console.error(error);
    return { error: "Internal Server Error" };
  }
};

export const getProgressReport = async (req, res) => {

  try {
    const hrId = req.user.id;
    console.log(hrId);

    // Find the HR's interns
    const hrIntern = await HRIntern.findOne({ hrId }).populate("internIds");

    if (!hrIntern) {
      return res.status(404).json({ error: "HR not found or has no interns." });
    }

    // Extract intern IDs
    const internIds = hrIntern.internIds.map(intern => intern._id);

    // Fetch weekly status reports of these interns
    const weeklyReports = await WeeklyStatus.find({ employee_id: { $in: internIds } });

    res.status(200).json({ reports: weeklyReports });
  } catch (error) {
    console.error("Error fetching intern reports:", error);
    res.status(500).json({ error: "An error occurred while fetching reports." });
  }



}