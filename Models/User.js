import mongoose from "mongoose";
import moment from "moment";

const { Schema } = mongoose;

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  mnumber: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address."],
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ["admin", "intern", "hr", "hrHead"],
    default: "intern",
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  profilePicture: {
    type: String,
    default: "",
  },
  linkedInURL: {
    type: String,
    default: "",
  },
  department: {
    type: String,
    enum: ["research", "development", "hr", "communication", "courseCommunication", "course"],
    default: "Not Assigned",
  },
  notifications: {
    type: [{ type: Schema.Types.ObjectId, ref: "Notification" }],
    default: [],
  },
  startDate: {
    type: Date,
    default: Date.now,
    set: (value) => moment(value).format("YYYY-MM-DD"),
  },
  EndDate: {
    type: Date,
    set: (value) => moment(value).format("YYYY-MM-DD"),
  },
  batch: {
    type: Schema.Types.ObjectId,
    ref: "Batch",
    default: null,
  },
  unapprovedBatch: {
    type: Schema.Types.ObjectId,
    ref: "Batch",
    default: null,
  },
  batchApproved: {
    type: Boolean,
    default: false,
  },

  resetPasswordOtp: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  permissions: {
    type: [
      {
        type: String,
        enum: [
          // Admin
          "user_management",
          "system_settings",
          "reports",
          "notifications",
          "data_export",
          // HR
          "employee_management",
          "leave_approval",
          "attendance",
          "recruitment"
        ]
      }
    ],
    default: []
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  lastActiveAt: {
    type: Date,
    default: null
  },
  totalTimeSpent: {
    type: Number,
    default: 0 // in seconds
  }

});

export default mongoose.model("User", UserSchema);