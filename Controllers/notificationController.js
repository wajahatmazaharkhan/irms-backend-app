import mongoose from "mongoose";
import Notification from "../Models/Notification.js";
import User from "../Models/User.js";
import Task from "../Models/Task.js";
import HrInternAssociation from "../Models/HrInternAssociation.js";
import Batch from "../Models/batchModel.js";
import HRIntern from "../Models/HrInternAssociation.js";
import connectDB from "../src/db/index.js";

// Function to send a notification
const sendNotification = async (req, res) => {
  await connectDB();
  const { status, message, taskId } = req.body;
  const hr = req.user;
  console.log("HR User:", hr);

  try {
    if (hr.role !== "hr") {
      return res.status(403).json({ message: "Only HRs can send batch notifications." });
    }

    // Step 1: Find the HRIntern document using HR's _id
    const hrInternDoc = await HRIntern.findOne({ hrId: hr._id });
    if (!hrInternDoc) {
      return res.status(404).json({ message: "HRIntern mapping not found for this HR." });
    }

    // Step 2: Find batches that include this HRIntern._id
    const hrBatches = await Batch.find({
      hr: hrInternDoc._id
    }).populate("interns", "_id");

    if (!hrBatches || hrBatches.length === 0) {
      return res.status(404).json({ message: "No batches found for this HR." });
    }

    // Step 3: Collect all unique intern IDs
    const internIds = [
      ...new Set(hrBatches.flatMap(batch => batch.interns.map(i => i._id.toString())))
    ];

    if (internIds.length === 0) {
      return res.status(404).json({ message: "No interns found under your batches." });
    }

    // Step 4: Create and send notifications to each intern
    const notifications = await Promise.all(
      internIds.map(async internId => {
        const notificationData = {
          userId: internId,
          message,
          type: status,
          ...(taskId && { task: taskId })
        };

        const notification = await Notification.create(notificationData);
        await User.findByIdAndUpdate(internId, {
          $push: { notifications: notification._id }
        });

        return notification;
      })
    );

    return res.status(200).json({
      message: `Notifications sent to ${notifications.length} interns successfully.`,
      notificationCount: notifications.length
    });
  } catch (error) {
    console.error("Error sending notifications to interns:", error);
    return res.status(500).json({
      message: "Failed to send notifications!",
      error: error.message
    });
  }
};

const sendNotificationToSingleUser = async (req, res) => {
  await connectDB();
    const { userId, status, message } = req.body;
    try {
        const notification = new Notification({
            userId,
            message,
            type: status
        });
        await notification.save();
        await User.findByIdAndUpdate(userId, {
            $push: { notifications: notification._id }
        });
        res.status(200).json({ message: "Notification sent successfully!" });
        console.log("Notification sent successfully!");
    } catch (error) {
        res.status(500).json({ message: "Failed to send notification`!" });
        console.error("Error sending notification:", error);
    }
}

const getNotifications = async (req, res) => {
    // Get userId from query parameters
    const { userId } = req.body;

    try {
        // Fetch notifications for the given userId
        const notifications = await User.findById(userId).populate("notifications");
        res.status(200).json({ notifications });
    } catch (error) {
        // Handle errors
        res.status(500).json({ message: "Failed to get notifications!" });
        console.error("Error getting notifications:", error);
    }
}

const deleteNotification = async (req, res) => {
    const { notificationId } = req.query;
    const { userId } = req.query;
    try {
        if (!notificationId || !userId) {
            return res.status(400).json({ message: "Invalid request: Missing notificationId or userId." });
        }
        await Notification.findByIdAndDelete(notificationId);
        await User
            .findByIdAndUpdate(userId, {
                $pull: { notifications: notificationId }
            });
        res.status(200).json({ message: "Notification deleted successfully!" });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to delete notification!" });
        console.error("Error deleting notification:", error);
    }
}

const notifyAll = async (req, res) => {
  await connectDB();
    const { status, message } = req.body;

    try {
        const users = await User.find();

        for (const user of users) {
            const notification = new Notification({
                userId: user._id,
                message,
                type: status
            });
            await notification.save();

            await User.findByIdAndUpdate(user._id, {
                $push: { notifications: notification._id }
            });
        }

        res.status(200).json({ message: "Notifications sent successfully!" });
        console.log("Notifications sent successfully!");
    } catch (error) {
        res.status(500).json({ message: "Failed to send notifications!" });
        console.error("Error sending notifications:", error);
    }
};




export { sendNotification, sendNotificationToSingleUser, getNotifications, deleteNotification, notifyAll };