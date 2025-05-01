WebRTC Video Chat Application
A real-time video conferencing application built with WebRTC, Socket.IO, and Node.js. This project demonstrates peer-to-peer video and audio communication, real-time chat, and various user-friendly features for a seamless video call experience.
Table of Contents

Overview
Features
Project Structure
Prerequisites
Installation
Usage
Deployment
Additional Documentation
Project Report

Overview
This application allows users to join video calls by entering their name and a room ID. It supports real-time video and audio communication using WebRTC, with additional features like chat, video/audio toggling, and join/leave notifications. The project showcases modern web technologies and provides a practical solution for remote collaboration.
Features

Peer-to-peer video and audio communication using WebRTC.
Real-time text chat with proper sender labeling ("You" for local user, name for others).
Notifications for users joining and leaving the call (e.g., " has joined the call").
Video and audio mute/unmute with mic icon indicators on control button and video screens.
Display user name when video is off.
Room ID for joining calls, auto-filled from invite link.
Add participants via invite link.
Leave call and auto-end when all users leave, with proper video removal.
Prevents duplicate video feeds for the same user.
Prominent heading: "REAL-TIME VIDEO CONFERENCING APPLICATION WITH WEBRTC".

Project Structure
webrtc-video-chat/
│
├── README.md              # Project overview and instructions
├── package.json           # Project dependencies and scripts
├── server.js              # Backend server with Socket.IO for signaling
├── public/                # Client-side source code and assets
│   ├── client.js          # Client-side JavaScript for WebRTC and UI logic
│   ├── index.html         # Main HTML file for the application
│   └── styles.css         # Custom CSS styles
└── docs/                  # Additional documentation
    └── project-report-summary.md  # Summary of the project report

Prerequisites

Node.js (v16 or higher)
npm (Node package manager)

Installation

Clone the repository:git clone <repository-url>
cd webrtc-video-chat


Install dependencies:npm install


Start the server:npm start



Usage

Open http://localhost:3000 in a browser (a clickable link will be logged in the terminal).
Enter your name and a room ID (or leave blank for a new room; room ID auto-fills if joining via invite link).
Click "Join Call" to start the video chat.
Use the buttons to toggle video/audio, add participants, or leave the call.
Share the invite link to add more participants to the same room.

Deployment

Deploy the application to platforms like Vercel, Heroku, or Render.
Ensure the backend and frontend are hosted together or configure CORS appropriately.
Example deployment steps for Vercel:
Install Vercel CLI: npm install -g vercel
Run vercel deploy in the project directory.
Follow the prompts to deploy.



Additional Documentation

See the docs/ folder for additional documentation, including a project report summary.

Project Report
A detailed project report and 8-minute demonstration video are required for the assignment. The video demonstration link and further details can be found in the submission documentation.
