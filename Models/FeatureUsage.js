import mongoose from "mongoose";

const { Schema } = mongoose;

const FeatureUsageSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  endpoint: {
    type: String,
    required: true,
    index: true,
  },
  method: {
    type: String,
    required: true,
    enum: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  },
  featureName: {
    type: String,
    required: true,
    index: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  userAgent: {
    type: String,
  },
  ipAddress: {
    type: String,
  },
  responseTime: {
    type: Number, // in milliseconds
  },
  statusCode: {
    type: Number,
  }
}, {
  timestamps: true
});

// Indexes for better query performance
FeatureUsageSchema.index({ userId: 1, timestamp: -1 });
FeatureUsageSchema.index({ featureName: 1, timestamp: -1 });
FeatureUsageSchema.index({ endpoint: 1, timestamp: -1 });

export default mongoose.model("FeatureUsage", FeatureUsageSchema);