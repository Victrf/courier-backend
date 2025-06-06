const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    phone: { type: String, required: true },
    password: { type: String, required: true, select: false }, // ❌ Prevents password from being returned in queries
    role: {
        type: String,
        enum: ['customer', 'courier', 'health_organization', 'admin'],
        required: true
    },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
    },
    resetPasswordToken: { type: String, select: false }, // ❌ Hide reset token in responses
    resetPasswordExpires: { type: Date, select: false }  // ❌ Hide expiration in responses
});

// ✅ Create a geospatial index for fast location-based queries
UserSchema.index({ location: '2dsphere' });

// Ensure sensitive fields are excluded when converting to JSON
UserSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        return ret;
    }
});

module.exports = mongoose.model('User', UserSchema);
