import WeeklyStatus from "../Models/Report.js";
import connectDB from "../src/db/index.js";

// POST: Submit a Weekly Status Report
export const submitWeeklyStatus = async (req, res) => {
  await connectDB();

  try {
    const { employeeName, department, date, tasksCompleted, tasksToBeginNextWeek, selfAssessmentComments } = req.body;
    const  employee_id = req.user.id;
    
    // Validate required fields
    if (!employee_id || !employeeName || !department || !date || !tasksCompleted || !tasksToBeginNextWeek || !selfAssessmentComments) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Create a new status report
    const newStatus = new WeeklyStatus({
      employee_id,
      employeeName,
      department,
      date,
      tasksCompleted,
      tasksToBeginNextWeek,
      selfAssessmentComments,
    });

    await newStatus.save();
    res.status(201).json({ message: "Weekly Status Report submitted successfully.", data: newStatus });
  } catch (error) {
    console.error("Error submitting status report:", error);
    res.status(500).json({ error: "An error occurred while submitting the status report." });
  }
};

// GET: Retrieve all Weekly Status Reports
export const getAllWeeklyStatusReports = async (req, res) => {
  await connectDB();
  try {
    const reports = await WeeklyStatus.find().sort({ date: -1 });
    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching status reports:", error);
    res.status(500).json({ error: "An error occurred while fetching the status reports." });
  }
};


// GET: Retrieve a Weekly Status Report for perticular hr 
export const getWeeklyStatusReportByEmployee = async (req, res) => {
  await connectDB();
  try {
    const { employee_id } = req.params;

    if (!employee_id) {
      return res.status(400).json({ error: "Employee ID is required." });
    }

    const report = await WeeklyStatus.findOne({ employee_id });

    if (!report) {
      return res.status(404).json({ error: "No Weekly Status Report found for the given employee ID." });
    }

    res.status(200).json(report);
  } catch (error) {
    console.error("Error fetching status report:", error);
    res.status(500).json({ error: "An error occurred while fetching the status report." });
  }
};