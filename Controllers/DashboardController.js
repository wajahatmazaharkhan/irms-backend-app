import User from '../Models/User.js';
import mongoose from 'mongoose';
import connectDB from '../src/db/index.js';

// Get count of active users in the last X minutes (default 10)
export const getActiveUsers = async (req, res) => {
    await connectDB();
    try {
        const minutes = parseInt(req.query.minutes) || 5;
        const since = new Date(Date.now() - minutes * 60 * 1000);
        const activeCount = await User.countDocuments({ lastActiveAt: { $gte: since } });
        res.json({ activeUsers: activeCount, since });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching active users' });
    }
};

// Get total time spent by each user
export const getTimeSpentByUsers = async (req, res) => {
    await connectDB();
    try {
        const users = await User.find({}, 'name email totalTimeSpent').sort({ totalTimeSpent: -1 });
        res.json({ users });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching time spent data' });
    }
};

// Feature Usage Analytics Functions
import FeatureUsage from '../Models/FeatureUsage.js';

// Get most used features
export const getMostUsedFeatures = async (req, res) => {
    await connectDB();
    try {
        const days = parseInt(req.query.days) || 30;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        
        const featureStats = await FeatureUsage.aggregate([
            { $match: { timestamp: { $gte: since } } },
            {
                $group: {
                    _id: "$featureName",
                    usageCount: { $sum: 1 },
                    uniqueUsers: { $addToSet: "$userId" },
                    avgResponseTime: { $avg: "$responseTime" },
                    endpoints: { $addToSet: "$endpoint" }
                }
            },
            {
                $project: {
                    featureName: "$_id",
                    usageCount: 1,
                    uniqueUsers: { $size: "$uniqueUsers" },
                    avgResponseTime: { $round: ["$avgResponseTime", 2] },
                    endpoints: 1,
                    _id: 0
                }
            },
            { $sort: { usageCount: -1 } }
        ]);
        
        res.json({
            features: featureStats,
            period: `${days} days`,
            since: since,
            totalFeatures: featureStats.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching feature usage data', error: error.message });
    }
};

// Get user-specific feature usage
export const getUserFeatureUsage = async (req, res) => {
    await connectDB();
    try {
        const { userId } = req.params;
        const days = parseInt(req.query.days) || 30;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        
        const userFeatures = await FeatureUsage.aggregate([
            { 
                $match: { 
                    userId: mongoose.Types.ObjectId(userId),
                    timestamp: { $gte: since } 
                } 
            },
            {
                $group: {
                    _id: "$featureName",
                    usageCount: { $sum: 1 },
                    avgResponseTime: { $avg: "$responseTime" },
                    firstUsed: { $min: "$timestamp" },
                    lastUsed: { $max: "$timestamp" }
                }
            },
            {
                $project: {
                    featureName: "$_id",
                    usageCount: 1,
                    avgResponseTime: { $round: ["$avgResponseTime", 2] },
                    firstUsed: 1,
                    lastUsed: 1,
                    _id: 0
                }
            },
            { $sort: { usageCount: -1 } }
        ]);
        
        res.json({
            userId,
            features: userFeatures,
            period: `${days} days`,
            since: since
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user feature usage', error: error.message });
    }
};

// Get feature usage trends over time
export const getFeatureUsageTrends = async (req, res) => {
    await connectDB();
    try {
        const days = parseInt(req.query.days) || 30;
        const interval = req.query.interval || 'day'; // day, week, month
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        
        let dateFormat;
        switch(interval) {
            case 'hour':
                dateFormat = { $dateToString: { format: "%Y-%m-%d %H:00", date: "$timestamp" } };
                break;
            case 'day':
                dateFormat = { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } };
                break;
            case 'week':
                dateFormat = { $dateToString: { format: "%Y-W%V", date: "$timestamp" } };
                break;
            case 'month':
                dateFormat = { $dateToString: { format: "%Y-%m", date: "$timestamp" } };
                break;
            default:
                dateFormat = { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } };
        }
        
        const trends = await FeatureUsage.aggregate([
            { $match: { timestamp: { $gte: since } } },
            {
                $group: {
                    _id: {
                        date: dateFormat,
                        feature: "$featureName"
                    },
                    count: { $sum: 1 },
                    avgResponseTime: { $avg: "$responseTime" }
                }
            },
            {
                $group: {
                    _id: "$_id.date",
                    features: {
                        $push: {
                            featureName: "$_id.feature",
                            count: "$count",
                            avgResponseTime: { $round: ["$avgResponseTime", 2] }
                        }
                    },
                    totalUsage: { $sum: "$count" }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        
        res.json({
            trends: trends,
            period: `${days} days`,
            interval: interval,
            since: since
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching feature usage trends', error: error.message });
    }
};

