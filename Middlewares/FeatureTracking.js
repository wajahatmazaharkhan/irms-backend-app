import FeatureUsage from "../Models/FeatureUsage.js";

// Map endpoints to feature names for better analytics
const endpointToFeatureMap = {
  // Auth endpoints
  "/api/auth/login": "Authentication",
  "/api/auth/signup": "Authentication",
  
  // User management
  "/user": "User Management",
  
  // Attendance
  "/attendance": "Attendance Tracking",
  
  // Tasks
  "/task": "Task Management",
  
  // Chat/Messaging
  "/chat": "Messaging System",
  
  // Projects
  "/project": "Project Management",
  
  // Reports
  "/reports": "Reporting System",
  "/weeklystatus": "Weekly Status Updates",
  
  // Dashboard
  "/dashboard/active-users": "Dashboard Analytics",
  "/dashboard/time-spent": "Dashboard Analytics",
  
  // Admin
  "/admin": "Admin Panel",
  
  // Notifications
  "/send": "Notifications",
  
  // Leaves
  "/leave": "Leave Management",
  
  // Tickets
  "/ticket": "Ticket System",
  
  // Issues
  "/api/issues": "Issue Tracking",
  
  // Batches
  "/api/batch": "Batch Management",
  
  // Default for unmapped endpoints
  "default": "Other Features"
};

export const trackFeatureUsage = async (req, res, next) => {
  const startTime = Date.now();
  
  // Get user from request (set by auth middleware)
  const userId = req.user?.id;
  
  // Skip tracking if no user (unauthenticated requests)
  if (!userId) {
    return next();
  }
  
  // Capture response to track completion
  const originalSend = res.send;
  res.send = function(data) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Determine feature name from endpoint
    const endpoint = req.originalUrl.split('?')[0]; // Remove query params
    const featureName = endpointToFeatureMap[endpoint] || 
                       endpointToFeatureMap["default"] || 
                       "Unknown Feature";
    
    // Save feature usage data
    const featureUsage = new FeatureUsage({
      userId,
      endpoint,
      method: req.method,
      featureName,
      userAgent: req.get("User-Agent"),
      ipAddress: req.ip || req.connection.remoteAddress,
      responseTime,
      statusCode: res.statusCode
    });
    
    // Save asynchronously (don't block the response)
    featureUsage.save().catch(err => {
      console.error("Failed to save feature usage:", err);
    });
    
    // Call original send method
    return originalSend.call(this, data);
  };
  
  next();
};