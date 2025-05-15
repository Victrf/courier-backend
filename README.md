A Node.js + Express.js backend for a courier tracking and delivery management platform. Designed with multi-role support for Users, Couriers, Health Organizations, and Admins, with secure authentication, real-time tracking, and admin-level control.
- **Node.js**
- **Express.js**
- **MongoDB Atlas (Mongoose)**
- **JWT Authentication**
- **Socket.IO (for real-time tracking)**
- **bcryptjs**
- **dotenv**
- **cors**
- **nodemailer (for future password reset)**
| Role             | Description                                                                 
|------------------|------------------
| `user`           | Registers and requests delivery or tracking services                        
| `courier`        | Updates location, receives delivery tasks                                   
| `organization`   | Can request pickups or make deliveries (e.g., hospitals, labs)             
| `admin`          | Full access to all system operations; created manually in the database      

 Core Features

- *JWT Authentication & Authorization**
- *Single MongoDB Collection with Role-based Logic**
- *Manual & Real-Time Courier Location Updates**
- *Role-Based Route Protection**
- *Admin: Account Management & Analytics-ready APIs**
- *Real-Time Socket.IO Setup for Courier Location (Planned)**


