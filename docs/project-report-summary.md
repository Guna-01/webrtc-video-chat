Project Report Summary
Introduction
This project, titled "WebRTC Video Chat Application," was developed to explore real-time communication using WebRTC. The goal was to create a user-friendly video conferencing tool that supports peer-to-peer video/audio calls, real-time chat, and additional features like join/leave notifications.
Features

Peer-to-peer video and audio communication.
Real-time chat with sender labeling.
Video/audio toggle with mic icon indicators.
Join/leave notifications in the chat window.
Auto-filled room IDs via invite links.

Technical Implementation

Technologies: WebRTC, Socket.IO, Node.js/Express, HTML/CSS/JavaScript, Tailwind CSS, Font Awesome.
Challenges:
Preventing duplicate video feeds: Fixed by checking for existing containers.
Synchronizing video/audio states: Used Socket.IO to broadcast state changes.
Ensuring proper video removal on disconnect: Updated client-side logic.


Conclusion
The project successfully demonstrates the capabilities of WebRTC for real-time communication. Future improvements could include screen sharing, enhanced UI/UX, and additional chat features.
