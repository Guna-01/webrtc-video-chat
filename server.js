// Import required modules
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for simplicity (update for production)
    methods: ['GET', 'POST']
  }
});

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Store rooms and their users
const rooms = {};

// Handle Socket.IO connections
io.on('connection', (socket) => {
  // When a user joins a room
  socket.on('join-room', ({ roomId, userName }) => {
    // Generate a new room ID if none provided
    if (!roomId) roomId = uuidv4();
    socket.join(roomId);
    
    // Initialize room if it doesn't exist and add user
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push({ id: socket.id, name: userName });
    
    // Notify all users in the room of the new join
    io.to(roomId).emit('user-joined', { name: userName });
    socket.to(roomId).emit('user-connected', { id: socket.id, name: userName });
    socket.emit('room-joined', { roomId, users: rooms[roomId] });
    
    // Handle WebRTC offer from a user
    socket.on('offer', (data) => {
      socket.to(data.target).emit('offer', {
        sdp: data.sdp,
        sender: socket.id,
        senderName: userName
      });
    });
    
    // Handle WebRTC answer from a user
    socket.on('answer', (data) => {
      socket.to(data.target).emit('answer', {
        sdp: data.sdp,
        sender: socket.id
      });
    });
    
    // Handle ICE candidates for WebRTC connection
    socket.on('ice-candidate', (data) => {
      socket.to(data.target).emit('ice-candidate', {
        candidate: data.candidate,
        sender: socket.id
      });
    });
    
    // Broadcast video state changes (on/off)
    socket.on('video-state', (data) => {
      socket.to(roomId).emit('video-state', data);
    });
    
    // Broadcast audio state changes (on/off)
    socket.on('audio-state', (data) => {
      socket.to(roomId).emit('audio-state', data);
    });
    
    // Handle chat messages and broadcast to all users in the room
    socket.on('chat-message', (message) => {
      io.to(roomId).emit('chat-message', { senderId: socket.id, name: userName, message });
    });
    
    // Handle user disconnection
    socket.on('disconnect', () => {
      // Find the user in the room
      const user = rooms[roomId]?.find(user => user.id === socket.id);
      // Remove user from the room
      rooms[roomId] = rooms[roomId]?.filter(user => user.id !== socket.id);
      // Notify remaining users of disconnection
      socket.to(roomId).emit('user-disconnected', { id: socket.id, name: user?.name || 'Unknown' });
      
      // Clean up empty rooms
      if (rooms[roomId]?.length === 0) {
        delete rooms[roomId];
      }
    });
  });
});

// Start the server on the specified port and bind to all network interfaces
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Server running at \x1b[36m\x1b[4m${url}\x1b[0m`);
  console.log(`Accessible on local network at http://<your-local-ip>:${PORT}`);
});