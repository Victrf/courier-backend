const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth'); // Import authentication middleware
const router = express.Router();

// Middleware to check user roles
const authorizeRoles = (allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ msg: 'Access denied' });
        }
        next();
    };
};

// Get Nearby Couriers (Protected Route)
router.get('/nearby', authMiddleware, authorizeRoles(['customer', 'health_organization']), async (req, res) => {
    try {
        const { longitude, latitude, radius } = req.query;

        if (!longitude || !latitude || !radius) {
            return res.status(400).json({ msg: 'Missing required parameters' });
        }

        const nearbyCouriers = await User.find({
            role: 'courier',
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
                    $maxDistance: parseFloat(radius) // Distance in meters
                }
            }
        });

        res.json(nearbyCouriers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
