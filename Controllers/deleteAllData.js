import User from "../Models/User.js";
import Batch from "../Models/batchModel.js";
import Ticket from "../Models/ticketModel.js";
import Task from "../Models/Task.js";
import WeeklyStatus from "../Models/Report.js";
import Project from "../Models/Projects.js";
import SignupVerification from "../Models/SignupVerification.js";
import Notification from "../Models/Notification.js";
import HRIntern from "../Models/HrInternAssociation.js";
import Message from '../Models/MessageModel.js';
import Leave from "../Models/leave.js";
import Attendance from '../Models/AttendanceModel.js';
import Report from "../Models/Report.js";
import TaskCompletion from "../Models/Tasksubmition.js";


export const deleteAll = async (req, res) => {
    try {
        await Promise.all([
            Batch.deleteMany({}),
            Ticket.deleteMany({}),
            Task.deleteMany({}),
            WeeklyStatus.deleteMany({}),
            Project.deleteMany({}),
            SignupVerification.deleteMany({}),
            Notification.deleteMany({}),
            HRIntern.deleteMany({}),
            Message.deleteMany({}),
            Leave.deleteMany({}),
            Attendance.deleteMany({}),
            Report.deleteMany({}),
            TaskCompletion.deleteMany({}),
            User.deleteMany({})
        ]);
        res.status(200).json({ message: "All data deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting data", error: error.message });
    }
}


