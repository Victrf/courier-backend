const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const router = express.Router();

const NodeGeocoder = require('node-geocoder');

const geocoder = NodeGeocoder({
    provider: 'openstreetmap', // Use 'google' if you have a Google API key
});

// Email Transporter (Using Gmail Example, Change as Needed)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Set in .env
        pass: process.env.EMAIL_PASS  // Set in .env
    }
});



// Register User
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone, role, address } = req.body;

        if (!address) {
            return res.status(400).json({ msg: 'Address is required' });
        }

        // Convert address to latitude and longitude
        const geoData = await geocoder.geocode(address);
        if (!geoData.length) {
            return res.status(400).json({ msg: 'Invalid address' });
        }

        const { latitude, longitude } = geoData[0];

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);

        user = new User({
            name,
            email,
            phone,
            password: hashedPassword,
            role,
            location: {
                type: 'Point',
                coordinates: [longitude, latitude]  // GeoJSON format
            }
        });

        await user.save();

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, user });
    } catch (err) {
        console.error('❌ Registration Error:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});


// Login User or Admin
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // ✅ Generate JWT Token including the role
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role  // ✅ Ensure role is sent in response
            }
        });

    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// Update Courier Location
router.put('/update-location', async (req, res) => {
    const { id, address } = req.body;

    try {
        let user = await User.findById(id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (user.role !== 'courier') return res.status(403).json({ msg: 'Access denied' });

        if (!address) {
            return res.status(400).json({ msg: 'Address is required' });
        }

        // Convert address to latitude and longitude
        const geoData = await geocoder.geocode(address);
        if (!geoData.length) {
            return res.status(400).json({ msg: 'Invalid address' });
        }

        const { latitude, longitude } = geoData[0];

        // Update the location
        user.location = {
            type: 'Point',
            coordinates: [longitude, latitude] // GeoJSON format
        };
        await user.save();

        res.json({ msg: 'Location updated', user, location: { latitude, longitude } });
    } catch (error) {
        console.error('❌ Update Location Error:', error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
});

// Request Password Reset
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Generate a unique reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // Token valid for 1 hour
        await user.save();

        // Send email with reset link
        const resetLink = `http://localhost:3000/reset-password/${resetToken}`; // Change to frontend URL
        await transporter.sendMail({
            to: user.email,
            subject: 'Password Reset Request',
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`
        });

        res.json({ msg: 'Password reset email sent' });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

//  Verify Reset Token
router.get('/reset-password/:token', async (req, res) => {
    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() } // Ensure token is not expired
        });

        if (!user) return res.status(400).json({ msg: 'Invalid or expired token' });

        res.json({ msg: 'Token is valid' });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});

// 3️⃣ Reset Password
router.post('/reset-password/:token', async (req, res) => {
    const { password } = req.body;

    try {
        const user = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ msg: 'Invalid or expired token' });

        // Hash new password and update user
        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.json({ msg: 'Password has been reset successfully' });
    } catch (error) {
        res.status(500).json({ msg: 'Server error' });
    }
});
module.exports = router;
