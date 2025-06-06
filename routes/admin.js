const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');

const router = express.Router();

// Admin Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("🔍 Login Attempt:", email, password); // Debugging

        const admin = await User.findOne({ email, role: 'admin' });

        if (!admin) {
            console.log("❌ Admin Not Found in DB");
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        console.log("✅ Admin Found:", admin.email, admin.password);

        const isMatch = await bcrypt.compare(password, admin.password);
        console.log("🔑 Password Match:", isMatch);

        if (!isMatch) {
            console.log("❌ Incorrect Password");
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: admin.id, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.json({ token, admin: { id: admin.id, email: admin.email, role: admin.role } });
    } catch (err) {
        console.error("❌ Server Error:", err);
        res.status(500).json({ msg: 'Server error' });
    }
});


// Get All Users (Admin Only)
router.get('/users', authMiddleware(['admin']), async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Update User Role (Admin Only)
router.put('/users/:id/role', authMiddleware(['admin']), async (req, res) => {
    try {
        const { role } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.role = role;
        await user.save();

        res.json({ msg: 'User role updated successfully', user });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// Delete User (Admin Only)
router.delete('/users/:id', authMiddleware(['admin']), async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
