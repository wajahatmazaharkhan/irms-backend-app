import mongoose from "mongoose";

const WeeklyStatusSchema = new mongoose.Schema({
  employee_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  employeeName: {
    type:String,
    required:true,
  },
  department: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  tasksCompleted: {
    type: String,
    required: true,
  },
  tasksToBeginNextWeek: {
    type: String,
    required: true,
  },
  selfAssessmentComments: {
    type: String,
    required: true,
  },
});

export default mongoose.model("WeeklyStatus", WeeklyStatusSchema);
