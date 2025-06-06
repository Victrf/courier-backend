require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const User = require('./models/User'); // Import User model


const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.log('❌ MongoDB Connection Error:', err));

// Default route
app.get('/', (req, res) => res.send('API is running...'));

// Import and use routes
const authRoutes = require('./middleware/auth');
app.use('/api/auth', authRoutes);

const courierRoutes = require('./routes/courier');
app.use('/api/couriers', courierRoutes);

const adminRoutes = require('./routes/admin'); // ✅ Import admin routes
app.use('/api/admin', adminRoutes); // ✅ Register admin routes






// Track connected couriers
const connectedCouriers = {};

// WebSocket Connection
io.on('connection', (socket) => {
    console.log(`⚡ Client connected: ${socket.id}`);

    socket.on('registerCourier', ({ id }) => {
        if (id) {
            connectedCouriers[id] = socket.id; // Store courier's socket ID
            console.log(`✅ Courier ${id} is online with socket ${socket.id}`);
        }
    });

    socket.on('updateLocation', async ({ id, latitude, longitude }) => {
        try {
            let user = await User.findById(id);
            if (!user || user.role !== 'courier') return;

            user.location = {
                type: 'Point',
                coordinates: [longitude, latitude] // GeoJSON format
            };
            await user.save();

            // ✅ Send updates only to customers & health organizations
            socket.broadcast.emit('locationUpdated', { id, latitude, longitude });
        } catch (error) {
            console.error('❌ Error updating location:', error);
        }
    });

    socket.on('disconnect', () => {
        const courierId = Object.keys(connectedCouriers).find(id => connectedCouriers[id] === socket.id);
        if (courierId) {
            delete connectedCouriers[courierId];
            console.log(`❌ Courier ${courierId} disconnected`);
        } else {
            console.log(`❌ Client disconnected: ${socket.id}`);
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
