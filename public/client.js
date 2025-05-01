const socket = io();
const joinSection = document.getElementById('join-section');
const callSection = document.getElementById('call-section');
const userNameInput = document.getElementById('user-name');
const roomIdInput = document.getElementById('room-id');
const joinBtn = document.getElementById('join-btn');
const videoToggle = document.getElementById('video-toggle');
const audioToggle = document.getElementById('audio-toggle');
const switchCameraBtn = document.getElementById('switch-camera');
const videos = document.getElementById('videos');
const chat = document.getElementById('chat-window');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('send-chat');
const addParticipantBtn = document.getElementById('add-participant');
const leaveCallBtn = document.getElementById('leave-call');

let userName, roomId, localStream, peerConnections = {};
let currentCameraIndex = 0;
let videoDevices = [];

const urlParams = new URLSearchParams(window.location.search);
const roomFromUrl = urlParams.get('room');
if (roomFromUrl) {
  roomIdInput.value = roomFromUrl;
  userName = userNameInput.value.trim();
  if (userName) {
    roomId = roomFromUrl;
    startMedia().then(() => {
      socket.emit('join-room', { roomId, userName });
      joinSection.className = 'hidden';
      callSection.className = 'flex-1 flex flex-col';
    });
  }
}

async function getVideoDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  videoDevices = devices.filter(device => device.kind === 'videoinput');
  console.log('Available video devices:', videoDevices);
}

async function startMedia() {
  try {
    await getVideoDevices();
    if (videoDevices.length === 0) {
      throw new Error('No video devices found');
    }

    const constraints = {
      video: {
        deviceId: videoDevices[currentCameraIndex].deviceId
      },
      audio: true
    };

    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    if (!document.getElementById('local-video')) {
      const localVideo = document.createElement('video');
      localVideo.id = 'local-video';
      localVideo.srcObject = localStream;
      localVideo.autoplay = true;
      localVideo.muted = true;
      localVideo.playsInline = true;
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

async function switchCamera() {
  if (videoDevices.length <= 1) {
    console.log('Only one camera available, cannot switch');
    return;
  }

  currentCameraIndex = (currentCameraIndex + 1) % videoDevices.length;
  const constraints = {
    video: {
      deviceId: videoDevices[currentCameraIndex].deviceId
    },
    audio: true
  };

  try {
    const newStream = await navigator.mediaDevices.getUserMedia(constraints);
    const newVideoTrack = newStream.getVideoTracks()[0];

    // Stop the old video track
    const oldVideoTrack = localStream.getVideoTracks()[0];
    oldVideoTrack.stop();
    localStream.removeTrack(oldVideoTrack);
    localStream.addTrack(newVideoTrack);

    // Update the local video element
    const localVideo = document.getElementById('local-video');
    localVideo.srcObject = localStream;

    // Update all peer connections with the new video track
    Object.keys(peerConnections).forEach(targetId => {
      const pc = peerConnections[targetId];
      const sender = pc.getSenders().find(s => s.track.kind === 'video');
      if (sender) {
        sender.replaceTrack(newVideoTrack);
      }
    });

    // Notify others to update their video state
    socket.emit('video-state', { videoEnabled: newVideoTrack.enabled, senderId: socket.id });
  } catch (error) {
    console.error('Error switching camera:', error);
  }
}

function createPeerConnection(targetId, targetName) {
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'turn:relay.metered.ca:80', username: 'your-username', credential: 'your-credential' }
    ]
  });

  localStream.getTracks().forEach(track => {
    console.log(`Adding track to peer connection: ${track.kind}`);
    pc.addTrack(track, localStream);
  });

  pc.ontrack = (event) => {
    console.log(`Received remote stream for ${targetId}`, event.streams[0]);
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
      remoteVideo.playsInline = true;
      remoteVideo.className = 'w-full h-64 object-cover rounded';
      videoContainer.appendChild(remoteVideo);
      videos.appendChild(videoContainer);

      const videoTrack = event.streams[0].getVideoTracks()[0];
      if (!videoTrack.enabled) {
        toggleVideoDisplay(targetId, targetName, false);
      }
    }
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      console.log(`Sending ICE candidate to ${targetId}:`, event.candidate);
      socket.emit('ice-candidate', { target: targetId, candidate: event.candidate });
    }
  };

  pc.oniceconnectionstatechange = () => {
    console.log(`ICE connection state for ${targetId}: ${pc.iceConnectionState}`);
    if (pc.iceConnectionState === 'failed') {
      console.log('ICE connection failed. Restarting ICE...');
      pc.restartIce();
    }
  };

  return pc;
}

joinBtn.addEventListener('click', async () => {
  userName = userNameInput.value.trim();
  roomId = roomIdInput.value.trim() || new Date().getTime().toString();
  console.log(`Joining room: ${roomId}`);
  if (!userName) {
    alert('Please enter your name');
    return;
  }
  await startMedia();
  socket.emit('join-room', { roomId, userName });
  joinSection.className = 'hidden';
  callSection.className = 'flex-1 flex flex-col';
});

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

socket.on('user-joined', ({ id, name }) => {
  addChatMessage(`${name} has joined the call`, 'system');
  peerConnections[id] = createPeerConnection(id, name);
});

socket.on('user-disconnected', ({ id, name }) => {
  addChatMessage(`${name} has left the call`, 'system');
  const videoContainer = document.getElementById(`video-container-${id}`);
  if (videoContainer) videoContainer.remove();
  if (peerConnections[id]) {
    peerConnections[id].close();
    delete peerConnections[id];
  }
});

socket.on('offer', ({ sdp, sender, senderName }) => {
  if (!peerConnections[sender]) {
    peerConnections[sender] = createPeerConnection(sender, senderName);
  }
  peerConnections[sender].setRemoteDescription(new RTCSessionDescription(sdp))
    .then(() => peerConnections[sender].createAnswer())
    .then(answer => peerConnections[sender].setLocalDescription(answer))
    .then(() => {
      socket.emit('answer', {
        sdp: peerConnections[sender].localDescription,
        target: sender
      });
    });
});

socket.on('answer', ({ sdp, sender }) => {
  peerConnections[sender].setRemoteDescription(new RTCSessionDescription(sdp));
});

socket.on('ice-candidate', ({ candidate, sender }) => {
  if (peerConnections[sender]) {
    peerConnections[sender].addIceCandidate(new RTCIceCandidate(candidate));
  }
});

function toggleVideoDisplay(targetId, targetName, videoEnabled) {
  const video = document.getElementById(`video-${targetId}`);
  if (videoEnabled) {
    video.classList.remove('hidden');
  } else {
    video.classList.add('hidden');
  }
}

socket.on('video-state', ({ videoEnabled, senderId }) => {
  toggleVideoDisplay(senderId, '', videoEnabled);
  const videoTrack = localStream.getVideoTracks()[0];
  if (videoEnabled && !videoTrack.enabled) {
    document.getElementById(`video-${senderId}`).classList.add('hidden');
  }
});

socket.on('audio-state', ({ audioEnabled, senderId }) => {
  const micIcon = document.getElementById(`mic-icon-${senderId}`);
  if (micIcon) {
    micIcon.className = `fas fa-microphone${audioEnabled ? '' : '-slash'} mic-icon`;
  }
});

socket.on('chat-message', ({ senderId, name, message }) => {
  addChatMessage(`${name}: ${message}`, senderId === socket.id ? 'self' : 'other');
});

function addChatMessage(message, type) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message ${type}`;
  messageDiv.textContent = message;
  chat.appendChild(messageDiv);
  chat.scrollTop = chat.scrollHeight;
}

videoToggle.addEventListener('click', () => {
  const videoTrack = localStream.getVideoTracks()[0];
  videoTrack.enabled = !videoTrack.enabled;
  videoToggle.textContent = `Video ${videoTrack.enabled ? 'On' : 'Off'}`;
  videoToggle.classList.toggle('bg-green-500', videoTrack.enabled);
  videoToggle.classList.toggle('bg-red-500', !videoTrack.enabled);
  const localVideo = document.getElementById('local-video');
  localVideo.classList.toggle('hidden', !videoTrack.enabled);
  socket.emit('video-state', { videoEnabled: videoTrack.enabled, senderId: socket.id });
});

audioToggle.addEventListener('click', () => {
  const audioTrack = localStream.getAudioTracks()[0];
  audioTrack.enabled = !audioTrack.enabled;
  audioToggle.innerHTML = `<i class="fas fa-microphone${audioTrack.enabled ? '' : '-slash'}"></i> Audio ${audioTrack.enabled ? 'On' : 'Off'}`;
  audioToggle.classList.toggle('bg-green-500', audioTrack.enabled);
  audioToggle.classList.toggle('bg-red-500', !audioTrack.enabled);
  const micIcon = document.getElementById(`mic-icon-${socket.id}`);
  micIcon.className = `fas fa-microphone${audioTrack.enabled ? '' : '-slash'} mic-icon`;
  socket.emit('audio-state', { audioEnabled: audioTrack.enabled, senderId: socket.id });
});

switchCameraBtn.addEventListener('click', switchCamera);

chatSend.addEventListener('click', () => {
  const message = chatInput.value.trim();
  if (message) {
    socket.emit('chat-message', message);
    chatInput.value = '';
  }
});

chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') chatSend.click();
});

addParticipantBtn.addEventListener('click', () => {
  const inviteLink = `${window.location.origin}?room=${roomId}`;
  navigator.clipboard.writeText(inviteLink).then(() => {
    alert('Invite link copied to clipboard: ' + inviteLink);
  });
});

leaveCallBtn.addEventListener('click', () => {
  socket.disconnect();
  joinSection.className = 'flex-1 flex items-center justify-center';
  callSection.className = 'hidden';
  videos.innerHTML = '';
  chat.innerHTML = '';
  localStream.getTracks().forEach(track => track.stop());
  Object.values(peerConnections).forEach(pc => pc.close());
  peerConnections = {};
});