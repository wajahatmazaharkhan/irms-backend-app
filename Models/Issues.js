import mongoose from "mongoose";

const issueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    issueType: {
      type: String,
      enum: ["Bug", "UI Issue", "Performance", "Other"],
      default: "Bug",
    },
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Issue", issueSchema);
