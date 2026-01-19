import User from "../Models/User.js";
import connectDB from "../src/db/index.js";

// Get active hours analytics by role (HR vs Intern)
export const getActiveHoursByRole = async (req, res) => {
  await connectDB();
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get all users with their total time spent, grouped by role
    const roleStats = await User.aggregate([
      {
        $match: {
          role: { $in: ["hr", "intern"] }, // Only HR and intern roles
          createdAt: { $gte: since } // Only users created within the time period
        }
      },
      {
        $group: {
          _id: "$role",
          totalUsers: { $sum: 1 },
          totalTimeSpent: { $sum: "$totalTimeSpent" }, // in seconds
          averageTimeSpent: { $avg: "$totalTimeSpent" }, // in seconds
          minTimeSpent: { $min: "$totalTimeSpent" }, // in seconds
          maxTimeSpent: { $max: "$totalTimeSpent" } // in seconds
        }
      },
      {
        $project: {
          role: "$_id",
          totalUsers: 1,
          totalTimeSpentHours: { $divide: ["$totalTimeSpent", 3600] }, // Convert seconds to hours
          averageTimeSpentHours: { $divide: ["$averageTimeSpent", 3600] }, // Convert seconds to hours
          minTimeSpentHours: { $divide: ["$minTimeSpent", 3600] }, // Convert seconds to hours
          maxTimeSpentHours: { $divide: ["$maxTimeSpent", 3600] }, // Convert seconds to hours
          _id: 0
        }
      }
    ]);

    res.json({
      roleStats,
      period: `${days} days`,
      since: since,
      totalActiveUsers: roleStats.reduce((sum, role) => sum + role.totalUsers, 0)
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching active hours by role", error: error.message });
  }
};

// Get active hours for specific users
export const getUserActiveHours = async (req, res) => {
  await connectDB();
  try {
    const { userId } = req.params;
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      totalTimeSpentHours: user.totalTimeSpent / 3600, // Convert seconds to hours
      period: `${days} days`,
      since: since
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user active hours", error: error.message });
  }
};

// Get top active users by hours
export const getTopActiveUsers = async (req, res) => {
  await connectDB();
  try {
    const days = parseInt(req.query.days) || 30;
    const limit = parseInt(req.query.limit) || 10;
    const roleFilter = req.query.role; // Optional role filter (hr, intern, etc.)

    let matchCondition = {
      role: { $in: ["hr", "intern"] } // Only HR and intern roles
    };

    if (roleFilter) {
      matchCondition.role = roleFilter;
    }

    const topUsers = await User.aggregate([
      {
        $match: matchCondition
      },
      {
        $sort: { totalTimeSpent: -1 }
      },
      {
        $limit: limit
      },
      {
        $project: {
          name: 1,
          email: 1,
          role: 1,
          department: 1,
          totalTimeSpentHours: { $divide: ["$totalTimeSpent", 3600] }, // Convert seconds to hours
          lastActiveAt: 1,
          profilePicture: 1
        }
      }
    ]);

    res.json({
      topActiveUsers: topUsers,
      limit: limit,
      period: `${days} days`
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching top active users", error: error.message });
  }
};

// Get active hours trends over time
export const getActiveHoursTrends = async (req, res) => {
  await connectDB();
  try {
    const days = parseInt(req.query.days) || 30;
    const interval = req.query.interval || "day"; // day, week, month
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    let dateFormat;
    switch (interval) {
      case "hour":
        dateFormat = { $dateToString: { format: "%Y-%m-%d %H:00", date: "$createdAt" } };
        break;
      case "day":
        dateFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        break;
      case "week":
        dateFormat = { $dateToString: { format: "%Y-W%V", date: "$createdAt" } };
        break;
      case "month":
        dateFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
        break;
      default:
        dateFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    }

    // Note: Since we don't have daily breakdown of time spent, we'll aggregate by role creation date
    // For more detailed daily trends, we would need a separate ActivityLog model
    const trends = await User.aggregate([
      {
        $match: {
          role: { $in: ["hr", "intern"] },
          createdAt: { $gte: since }
        }
      },
      {
        $group: {
          _id: {
            date: dateFormat,
            role: "$role"
          },
          userCount: { $sum: 1 },
          totalTimeSpent: { $sum: "$totalTimeSpent" }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          roles: {
            $push: {
              role: "$_id.role",
              userCount: "$userCount",
              totalTimeSpentHours: { $divide: ["$totalTimeSpent", 3600] }
            }
          },
          totalUsers: { $sum: "$userCount" },
          totalHoursSpent: { $divide: [{ $sum: "$totalTimeSpent" }, 3600] }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      trends,
      period: `${days} days`,
      interval,
      since
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching active hours trends", error: error.message });
  }
};

// Get comparative analytics between HR and Interns
export const getRoleComparison = async (req, res) => {
  await connectDB();
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const comparison = await User.aggregate([
      {
        $match: {
          role: { $in: ["hr", "intern"] }
        }
      },
      {
        $group: {
          _id: "$role",
          totalUsers: { $sum: 1 },
          totalTimeSpent: { $sum: "$totalTimeSpent" },
          averageTimeSpent: { $avg: "$totalTimeSpent" },
          totalPoints: { $sum: "$totalPoints" },
          averagePoints: { $avg: "$totalPoints" }
        }
      },
      {
        $project: {
          role: "$_id",
          totalUsers: 1,
          totalTimeSpentHours: { $divide: ["$totalTimeSpent", 3600] },
          averageTimeSpentHours: { $divide: ["$averageTimeSpent", 3600] },
          totalPoints: 1,
          averagePoints: 1,
          hoursPerUser: { 
            $cond: {
              if: { $eq: ["$totalUsers", 0] },
              then: 0,
              else: { $divide: ["$totalTimeSpentHours", "$totalUsers"] }
            }
          },
          _id: 0
        }
      }
    ]);

    res.json({
      comparison,
      period: `${days} days`,
      since
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching role comparison", error: error.message });
  }
};