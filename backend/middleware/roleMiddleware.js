const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {

        // authMiddleware must run before roleMiddleware
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        // Check user's role
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You do not have permission to perform this action."
            });
        }

        next();
    };
};

module.exports = roleMiddleware;