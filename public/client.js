// Initialize Socket.IO connection to the Vercel backend
const socket = io("https://webrtc-video-chat-app.vercel.app/");
let localStream;
let peerConnections = {};
let roomId;
let userName;
let videoEnabled = true;
let audioEnabled = true;

// DOM elements for interaction
const joinBtn = document.getElementById('join-btn');
const videoToggle = document.getElementById('video-toggle');
const audioToggle = document.getElementById('audio-toggle');
const addParticipant = document.getElementById('add-participant');
const leaveCall = document.getElementById('leave-call');
const userNameInput = document.getElementById('user-name');
const roomIdInput = document.getElementById('room-id');
const joinSection = document.getElementById('join-section');
const callSection = document.getElementById('call-section');
const videos = document.getElementById('videos');
const chatWindow = document.getElementById('chat-window');
const chatInput = document.getElementById('chat-input');
const sendChat = document.getElementById('send-chat');

// Auto-fill room ID from URL query parameter
const urlParams = new URLSearchParams(window.location.search);
const roomFromUrl = urlParams.get('room');
if (roomFromUrl) {
  roomIdInput.value = roomFromUrl;
}

// Start media (camera and microphone) for the local user
async function startMedia() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (!document.getElementById('local-video')) {
      const localVideo = document.createElement('video');
      localVideo.id = 'local-video';
      localVideo.srcObject = localStream;
      localVideo.autoplay = true;
      localVideo.muted = true;
      localVideo.className = 'w-full h-64 object-cover rounded';
      const videoContainer = document.createElement('div');
      videoContainer.id = 'local-video-container';
      videoContainer.className = 'relative';
      videoContainer.innerHTML = `
        <p class="text-center">${userName} (You)</p>
        <i id="mic-icon-${socket.id}" class="fas fa-microphone mic-icon"></i>
      `;
      videoContainer.appendChild(localVideo);
      videos.appendChild(videoContainer);
    }
  } catch (error) {
    console.error('Error accessing media devices:', error);
  }
}

// Create a peer connection for WebRTC communication
function createPeerConnection(targetId, targetName) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  // Handle incoming video/audio streams from remote peers
  pc.ontrack = (event) => {
    let videoContainer = document.getElementById(`video-container-${targetId}`);
    if (!videoContainer) {
      videoContainer = document.createElement('div');
      videoContainer.id = `video-container-${targetId}`;
      videoContainer.className = 'relative';
      videoContainer.innerHTML = `
        <p class="text-center">${targetName}</p>
        <i id="mic-icon-${targetId}" class="fas fa-microphone mic-icon"></i>
      `;
      const remoteVideo = document.createElement('video');
      remoteVideo.id = `video-${targetId}`;
      remoteVideo.srcObject = event.streams[0];
      remoteVideo.autoplay = true;
      remoteVideo.className = 'w-full h-64 object-cover rounded';
      videoContainer.appendChild(remoteVideo);
      videos.appendChild(videoContainer);

      const videoTrack = event.streams[0].getVideoTracks()[0];
      if (!videoTrack.enabled) {
        toggleVideoDisplay(targetId, targetName, false);
      }
    }
  };

  // Send ICE candidates to the remote peer
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', { target: targetId, candidate: event.candidate });
    }
  };

  return pc;
}

// Toggle video display (show/hide video or placeholder)
function toggleVideoDisplay(userId, userName, enabled) {
  const videoContainer = document.getElementById(userId === socket.id ? 'local-video-container' : `video-container-${userId}`);
  const videoElement = document.getElementById(userId === socket.id ? 'local-video' : `video-${userId}`);
  if (videoContainer && videoElement) {
    if (enabled) {
      videoElement.style.display = 'block';
      const namePlaceholder = videoContainer.querySelector('.name-placeholder');
      if (namePlaceholder) namePlaceholder.remove();
    } else {
      videoElement.style.display = 'none';
      let namePlaceholder = videoContainer.querySelector('.name-placeholder');
      if (!namePlaceholder) {
        namePlaceholder = document.createElement('div');
        namePlaceholder.className = 'name-placeholder bg-gray-700 text-white flex items-center justify-center h-64 rounded';
        namePlaceholder.textContent = userName;
        videoContainer.appendChild(namePlaceholder);
      }
    }
  }
}

// Toggle mic icon based on audio state
function toggleMicIcon(userId, enabled) {
  const micIcon = document.getElementById(`mic-icon-${userId}`);
  if (micIcon) {
    micIcon.className = `fas fa-microphone${enabled ? '' : '-slash'} mic-icon`;
  }
}

// Add a notification message to the chat window
function addNotification(message) {
  const notificationElement = document.createElement('div');
  notificationElement.className = 'text-gray-500 italic';
  notificationElement.textContent = message;
  chatWindow.appendChild(notificationElement);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Join button event listener to start the call
joinBtn.addEventListener('click', async () => {
  userName = userNameInput.value.trim();
  roomId = roomIdInput.value.trim();
  if (!userName) {
    alert('Please enter your name');
    return;
  }
  await startMedia();
  socket.emit('join-room', { roomId, userName });
  joinSection.className = 'hidden';
  callSection.className = 'flex-1 flex flex-col';
});

// Handle room join confirmation and initiate peer connections
socket.on('room-joined', ({ roomId: joinedRoomId, users }) => {
  roomId = joinedRoomId;
  users.forEach(user => {
    if (user.id !== socket.id) {
      peerConnections[user.id] = createPeerConnection(user.id, user.name);
      peerConnections[user.id].createOffer()
        .then(offer => peerConnections[user.id].setLocalDescription(offer))
        .then(() => {
          socket.emit('offer', {
            sdp: peerConnections[user.id].localDescription,
            target: user.id
          });
        });
    }
  });
});

// Display join notification
socket.on('user-joined', ({ name }) => {
  addNotification(`${name} has joined the call`);
});

// Handle new user connection
socket.on('user-connected', ({ id, name }) => {
  peerConnections[id] = createPeerConnection(id, name);
});

// Handle WebRTC offer
socket.on('offer', async ({ sdp, sender, senderName }) => {
  if (!peerConnections[sender]) {
    peerConnections[sender] = createPeerConnection(sender, senderName);
  }
  await peerConnections[sender].setRemoteDescription(new RTCSessionDescription(sdp));
  const answer = await peerConnections[sender].createAnswer();
  await peerConnections[sender].setLocalDescription(answer);
  socket.emit('answer', { sdp: answer, target: sender });
});

// Handle WebRTC answer
socket.on('answer', async ({ sdp, sender }) => {
  await peerConnections[sender].setRemoteDescription(new RTCSessionDescription(sdp));
});

// Handle ICE candidates
socket.on('ice-candidate', async ({ candidate, sender }) => {
  if (peerConnections[sender]) {
    await peerConnections[sender].addIceCandidate(new RTCIceCandidate(candidate));
  }
});

// Handle user disconnection
socket.on('user-disconnected', ({ id, name }) => {
  if (peerConnections[id]) {
    peerConnections[id].close();
    delete peerConnections[id];
    const videoContainer = document.getElementById(`video-container-${id}`);
    if (videoContainer) {
      videos.removeChild(videoContainer);
    }
    addNotification(`${name} has left the call`);
  }
});

// Update video state for remote users
socket.on('video-state', ({ userId, userName, enabled }) => {
  toggleVideoDisplay(userId, userName, enabled);
});

// Update audio state for remote users
socket.on('audio-state', ({ userId, enabled }) => {
  toggleMicIcon(userId, enabled);
});

// Toggle local video on/off
videoToggle.addEventListener('click', () => {
  videoEnabled = !videoEnabled;
  localStream.getVideoTracks()[0].enabled = videoEnabled;
  videoToggle.textContent = `Video ${videoEnabled ? 'On' : 'Off'}`;
  videoToggle.className = `px-4 py-2 rounded text-white ${videoEnabled ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`;
  toggleVideoDisplay(socket.id, userName, videoEnabled);
  socket.emit('video-state', { roomId, userId: socket.id, userName, enabled: videoEnabled });
});

// Toggle local audio on/off
audioToggle.addEventListener('click', () => {
  audioEnabled = !audioEnabled;
  localStream.getAudioTracks()[0].enabled = audioEnabled;
  audioToggle.innerHTML = `<i class="fas fa-microphone${audioEnabled ? '' : '-slash'}"></i> Audio ${audioEnabled ? 'On' : 'Off'}`;
  audioToggle.className = `px-4 py-2 rounded text-white ${audioEnabled ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`;
  toggleMicIcon(socket.id, audioEnabled);
  socket.emit('audio-state', { roomId, userId: socket.id, enabled: audioEnabled });
});

// Copy invite link to clipboard
addParticipant.addEventListener('click', () => {
  const inviteLink = `${window.location.origin}/?room=${roomId}`;
  navigator.clipboard.writeText(inviteLink);
  alert('Invite link copied to clipboard: ' + inviteLink);
});

// Leave the call and clean up
leaveCall.addEventListener('click', () => {
  Object.values(peerConnections).forEach(pc => pc.close());
  peerConnections = {};
  localStream.getTracks().forEach(track => track.stop());
  videos.innerHTML = '';
  socket.disconnect();
  joinSection.className = 'flex-1 flex items-center justify-center';
  callSection.className = 'hidden';
});

// Send chat message on button click
sendChat.addEventListener('click', () => {
  const message = chatInput.value.trim();
  if (message) {
    socket.emit('chat-message', message);
    chatInput.value = '';
  }
});

// Send chat message on Enter key press
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && chatInput.value.trim()) {
    socket.emit('chat-message', chatInput.value.trim());
    chatInput.value = '';
  }
});

// Display received chat messages
socket.on('chat-message', ({ senderId, name, message }) => {
  const messageElement = document.createElement('div');
  const displayName = senderId === socket.id ? 'You' : name;
  messageElement.textContent = `${displayName}: ${message}`;
  chatWindow.appendChild(messageElement);
  chatWindow.scrollTop = chatWindow.scrollHeight;
});