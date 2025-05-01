WebRTC Video Chat Application
Overview
This project is a real-time video chat application built using WebRTC, Socket.IO, and Node.js. It allows multiple users to join a video call using a shared room ID, with features like video/audio toggling, chat messaging, and join/leave notifications. The application is deployed on Render and can be accessed publicly.
Live Demo

URL: https://webrtc-video-chat-m4wx.onrender.com/
To join a call:
Open the URL in a browser.
Enter your name and a room ID (e.g., room123), then click "Join Call".
Share the invite link (e.g., https://webrtc-video-chat-m4wx.onrender.com//?room=room123) with others to join the same call.



Note: The Render free tier may spin down after inactivity, causing a delay on the first request. Please allow a few seconds for the app to start.
Features

Video and audio streaming using WebRTC.
Real-time signaling with Socket.IO for joining rooms and exchanging WebRTC offers/answers.
In-call text chat.
Video and audio toggling (on/off).
Join/leave notifications.
Support for multiple users in the same room.

Technologies Used

WebRTC: For peer-to-peer video and audio communication.
Socket.IO: For real-time signaling between clients.
Node.js & Express: For the server-side application.
HTML/CSS/JavaScript: For the client-side interface.
Render: For deployment and hosting.
STUN/TURN Servers: For NAT traversal (using stun:stun.l.google.com:19302 and a free TURN server).

Project Structure
webrtc-video-chat/
├── public/               # Client-side assets
│   ├── index.html        # Main HTML file
│   ├── client.js         # Client-side JavaScript (WebRTC and Socket.IO logic)
│   └── styles.css        # CSS styles
├── package.json          # Project metadata and dependencies
├── package-lock.json     # Dependency lock file
├── server.js             # Server-side JavaScript (Express and Socket.IO)
└── README.md             # Project documentation

Setup and Installation (Local Testing)
If you’d like to run the project locally:

Clone the Repository:
git clone <https://github.com/Guna-01/webrtc-video-chat>
cd webrtc-video-chat

Install Dependencies:
npm install

Run the Application:
npm start

If you kept nodemon, you can also use npm run dev for auto-restart during development.

Access the App:

Open http://localhost:3000 in a browser.
To test on multiple devices on the same Wi-Fi network:
Find your local IP address (e.g., 192.168.1.x on Windows with ipconfig, or on macOS/Linux with ifconfig).
Replace localhost with your IP (e.g., http://192.168.1.x:3000).
Join the same room ID on both devices.

Deployment on Render
The app is deployed on Render for public access. To deploy your own instance:

Push Your Code to GitHub: Ensure your code is in a GitHub repository.

Create a Web Service on Render:

Sign up at render.com.
Create a new Web Service, connect your GitHub repository, and deploy with these settings:
Runtime: Node
Build Command: npm install
Start Command: npm start
Instance Type: Free (or upgrade for better performance)

Add a TURN Server:

WebRTC requires a TURN server for NAT traversal in public deployments. Update client.js with a reliable TURN server:
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:relay.metered.ca:80', username: 'your-username', credential: 'your-credential' }
  ]
});

Sign up at Metered.ca for free TURN server credentials, or set up your own using coturn.

Challenges and Solutions

NAT Traversal: WebRTC connections often fail on public networks due to NAT. Added a TURN server to relay traffic when direct connections fail.
Render Free Tier: The free tier spins down after inactivity, causing delays. Mitigated by informing users to wait a few seconds for the app to start.
Joining Calls: Ensured all users connect to the same server (Render) to join the same room, as local and Render servers don’t share room state.
Security: Fixed high-severity vulnerabilities in dependencies by updating nodemon and ensuring production dependencies are secure.

Future Improvements

Add user authentication to secure rooms.
Implement reconnection logic for dropped Socket.IO or WebRTC connections.
Set up a custom TURN server for better reliability.
Upgrade to a paid Render plan to avoid spin-down delays.

Credits

Built by Gunarthika A.