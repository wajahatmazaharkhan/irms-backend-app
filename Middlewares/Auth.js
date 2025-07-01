import jwt from 'jsonwebtoken';
import User from '../Models/User.js';

export const ensureAuthenticated = async (req, res, next) => {
    const auth = req.headers['authorization'];
       console.log("Authorization Header:", auth);
    if (!auth) {
        console.log("Authorization header is missing");
        return res.status(403)
            .json({ message: 'Unauthorized, JWT token is required' });
    }

    try {
        const token = auth.split(' ')[1];  // Extract the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { ...decoded, _id: decoded.id };  // Attach user info to the request
        console.log("Decoded User Info:", req.user);
        if (!req.user || !req.user.id) {
            console.log("User ID is missing in the decoded token");
            return res.status(403)
                .json({ message: 'Unauthorized, JWT token is invalid or expired' });
        }
        console.log("User ID:", req.user.id);
        // Update lastActiveAt for the user
        await User.findByIdAndUpdate(req.user.id, { lastActiveAt: Date.now() });
        next();
    } catch (err) {
        console.log("Error decoding token:", err.message);
        return res.status(403)
            .json({ message: 'Unauthorized, JWT token is invalid or expired' });
    }
};