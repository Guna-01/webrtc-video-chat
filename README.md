# WebRTC Video Chat Application

A real-time video chat application built with WebRTC, Socket.IO, and Node.js, deployed on Render. Users can join calls using a shared room ID, toggle video/audio, and chat in real-time.

## 🚀 Live Demo

Try the app here: [https://webrtc-video-chat-m4wx.onrender.com/]

**How to Use:**
1. Open the link in a browser.
2. Enter your name and a room ID (e.g., `room123`), then click **Join Call**.
3. Share the invite link (e.g., `https://webrtc-video-chat-m4wx.onrender.com//?room=room123`) with others to join the same call.

> **Note:** The app is hosted on Render's free tier, which may spin down after inactivity. Allow a few seconds for the app to start on the first request.

## ✨ Features

- **Video & Audio Streaming**: Peer-to-peer communication using WebRTC.
- **Real-Time Chat**: Send messages during the call.
- **Room-Based Calls**: Join calls using a shared room ID.
- **Toggle Controls**: Enable/disable video and audio.
- **Join/Leave Notifications**: Get updates when users join or leave.

## 🛠️ Technologies Used

- **WebRTC**: For peer-to-peer video and audio streaming.
- **Socket.IO**: For real-time signaling and room management.
- **Node.js & Express**: Server-side framework.
- **HTML/CSS/JavaScript**: Client-side interface.
- **Render**: Hosting platform.
- **STUN/TURN Servers**: For NAT traversal.

## 📂 Project Structure

```
webrtc-video-chat/
├── public/               # Client-side assets
│   ├── index.html        # Main HTML file
│   ├── client.js         # Client-side JavaScript
│   └── styles.css        # CSS styles
├── package.json          # Project metadata and dependencies
├── package-lock.json     # Dependency lock file
├── server.js             # Server-side JavaScript
└── README.md             # Project documentation
```

## 🖥️ Local Setup

To run the app locally:

1. **Clone the Repository**:
   ```bash
   git clone <https://github.com/Guna-01/webrtc-video-chat>
   cd webrtc-video-chat
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Server**:
   ```bash
   npm start
   ```
   > If you have `nodemon` installed, use `npm run dev` for auto-restart during development.

4. **Access the App**:
   - Open `http://localhost:3000` in a browser.
   - To test on multiple devices on the same Wi-Fi:
     - Find your local IP (e.g., `ipconfig` on Windows, `ifconfig` on macOS/Linux).
     - Use `http://<your-local-ip>:3000` (e.g., `http://192.168.1.x:3000`).

## ☁️ Deployment on Render

The app is deployed on Render. To deploy your own instance:

1. **Push Code to GitHub**:
   Ensure your code is in a GitHub repository.

2. **Set Up a Render Web Service**:
   - Sign up at [render.com](https://render.com).
   - Create a new Web Service and connect your GitHub repository.
   - Use these settings:
     - **Runtime**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Instance Type**: Free (or upgrade for better performance)

3. **Configure a TURN Server**:
   - WebRTC requires a TURN server for public deployments. Update `client.js` with a reliable TURN server:
     ```javascript
     const pc = new RTCPeerConnection({
       iceServers: [
         { urls: 'stun:stun.l.google.com:19302' },
         { urls: 'turn:relay.metered.ca:80', username: 'your-username', credential: 'your-credential' }
       ]
     });
     ```
   - Sign up at [Metered.ca](https://www.metered.ca) for free TURN server credentials, or set up your own using `coturn`.

## 🐞 Challenges Faced

- **NAT Traversal**:
  - *Issue*: WebRTC connections failed on public networks due to NAT.
  - *Solution*: Added a TURN server to relay traffic.
- **Local vs. Render Servers**:
  - *Issue*: Users on local and Render servers couldn’t join the same call.
  - *Solution*: Ensured all users connect to the Render server.
- **Video on Render**:
  - *Issue*: Video didn’t work on Render due to unreliable TURN servers.
  - *Solution*: Debugged with logs and used a better TURN server.
- **Security**:
  - *Issue*: High-severity vulnerabilities in `nodemon`.
  - *Solution*: Updated dependencies to secure versions.

## 🔮 Future Improvements

- Add user authentication for secure rooms.
- Implement reconnection logic for dropped connections.
- Set up a custom TURN server for reliability.
- Upgrade to a paid Render plan to avoid spin-down delays.

## 👤 Author

- **Gunarthika A.**
- GitHub: [https://github.com/Guna-01)]

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.