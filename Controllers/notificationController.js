import Notification from "../Models/Notification.js";
import User from "../Models/User.js";
import Task from "../Models/Task.js";
import HrInternAssociation from "../Models/HrInternAssociation.js";

// Function to send a notification
const sendNotification = async (req, res) => {
    const { userId, status, message, taskId } = req.body;
    const hr=req.user._id;

    try {
        const user= await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }
        if(hr.role=='HR')
        {
            const internData=await HrInternAssociation.findOne({ hrId: hr });
            if(!internData || !internData.internIds.includes(userId)) {
                return res.status(403).json({ message: "Unauthorized: You can only notify your assigned interns." });
            }

        }
        // Create notification object with required fields
        const notificationData = {
            userId,
            message,
            type: status
        };

        // Only add task field if taskId is provided
        if (taskId) {
            notificationData.task = taskId;
        }

        const notification = new Notification(notificationData);

        await notification.save();
        await User.findByIdAndUpdate(userId, {
            $push: { notifications: notification._id }
        });

        res.status(200).json({ message: "Notification sent successfully!" });
        console.log("Notification sent successfully!");
    } catch (error) {
        res.status(500).json({ message: "Failed to send notification!" });
        console.error("Error sending notification:", error);
    }
};

const sendNotificationToSingleUser = async (req, res) => {
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
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications." });
  }
};
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
    const { status, message } = req.body;
    const sender = req.user;

    try {
        let targetUsers = [];

        if (sender.role === 'Admin') {
            // Admin can notify everyone
            targetUsers = await User.find();
        } else if (sender.role === 'HR') {
            // HR can notify only assigned interns
            const hrInternData = await HrInternAssociation.findOne({ hrId: sender._id });

            if (!hrInternData || !hrInternData.internIds.length) {
                return res.status(403).json({ message: "No interns assigned to this HR." });
            }

            targetUsers = await User.find({ _id: { $in: hrInternData.internIds } });
        } else {
            // Other roles not allowed
            return res.status(403).json({ message: "Unauthorized: Only Admins and HRs can send notifications." });
        }

        // Send notifications to each user
        for (const user of targetUsers) {
            const notification = new Notification({
                userId: user._id,
                message,
                type: status
            });

            await notification.save();
            user.notifications.push(notification._id);
            await user.save();
        }

        res.status(200).json({ message: "Notifications sent to all users successfully!" });
    } catch (error) {
        console.error("Error sending notifications to all users:", error);
        res.status(500).json({ message: "Failed to send notifications to all users!" });
    }
};




export { sendNotification, sendNotificationToSingleUser, getNotifications, deleteNotification, notifyAll };