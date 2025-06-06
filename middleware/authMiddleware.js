const jwt = require('jsonwebtoken');

module.exports = (roles = []) => (req, res, next) => {
    try {
        const token = req.header('Authorization');
        if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        // ✅ If roles are specified, check if the user's role matches
        if (roles.length > 0 && !roles.includes(req.user.role)) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        next();
    } catch (err) {
        res.status(401).json({ msg: 'Invalid token' });
    }
};
