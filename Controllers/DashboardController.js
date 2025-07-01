import User from '../Models/User.js';

// Get count of active users in the last X minutes (default 10)
export const getActiveUsers = async (req, res) => {
    try {
        const minutes = parseInt(req.query.minutes) || 10;
        const since = new Date(Date.now() - minutes * 60 * 1000);
        const activeCount = await User.countDocuments({ lastActiveAt: { $gte: since } });
        res.json({ activeUsers: activeCount, since });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching active users' });
    }
};

// Get total time spent by each user
export const getTimeSpentByUsers = async (req, res) => {
    try {
        const users = await User.find({}, 'name email totalTimeSpent').sort({ totalTimeSpent: -1 });
        res.json({ users });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching time spent data' });
    }
};

    