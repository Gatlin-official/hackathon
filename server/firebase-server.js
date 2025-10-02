// server/firebase-server.js - Updated server with Firebase integration
const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
const admin = require('firebase-admin')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const app = express()
const server = http.createServer(app)

// Debug environment variables
console.log('Firebase Config Check:')
console.log('PROJECT_ID:', process.env.FIREBASE_PROJECT_ID)
console.log('CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL)
console.log('PRIVATE_KEY exists:', !!process.env.FIREBASE_PRIVATE_KEY)

// Initialize Firebase Admin (with environment variables)
if (!admin.apps.length) {
  const serviceAccount = {
    project_id: process.env.FIREBASE_PROJECT_ID,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  }
  
  console.log('Service Account Object:', {
    project_id: serviceAccount.project_id,
    client_email: serviceAccount.client_email,
    private_key_length: serviceAccount.private_key?.length
  })
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

const db = admin.firestore()

// Configure Socket.io with CORS
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    methods: ["GET", "POST"]
  }
})

app.use(cors())
app.use(express.json())

// Helper Functions
function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function generateUsername(email) {
  const animals = ['Tiger', 'Eagle', 'Wolf', 'Fox', 'Bear', 'Lion', 'Hawk', 'Shark', 'Panda', 'Scout']
  const adjectives = ['Swift', 'Wild', 'Brave', 'Clever', 'Strong', 'Quick', 'Bold', 'Smart', 'Fast', 'Cool']
  
  const animal = animals[Math.floor(Math.random() * animals.length)]
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const number = Math.floor(Math.random() * 1000)
  
  return `${adjective}${animal}${number}`
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // Join a group
  socket.on('join-group', async (groupId) => {
    try {
      socket.join(groupId)
      console.log(`Socket ${socket.id} joined group ${groupId}`)
      
      // Load and send existing messages from Firebase (simplified query)
      const messagesRef = db.collection('messages')
      const messagesQuery = messagesRef.where('groupId', '==', groupId)
      
      const messagesSnapshot = await messagesQuery.get()
      let messages = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }))
      
      // Sort in memory and limit (fine for moderate message counts)
      messages = messages
        .sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0))
        .slice(0, 50)
      
      console.log(`Loaded ${messages.length} messages for group ${groupId}`)
      socket.emit('load-messages', messages)
    } catch (error) {
      console.error('Error joining group:', error)
      socket.emit('error', 'Failed to join group')
    }
  })

  // Leave a group
  socket.on('leave-group', (groupId) => {
    socket.leave(groupId)
    console.log(`Socket ${socket.id} left group ${groupId}`)
  })

  // Handle new message
  socket.on('send-message', async (data) => {
    try {
      const { groupId, message } = data
      console.log('New message:', message)
      
      // Store message in Firebase
      const messageRef = await db.collection('messages').add({
        groupId,
        text: message.text,
        senderId: message.sender.email, // Using email as temp user ID
        senderName: message.sender.name,
        senderEmail: message.sender.email,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        intention: message.intention || null
      })
      
      const messageWithId = {
        id: messageRef.id,
        ...message,
        timestamp: new Date()
      }
      
      // Broadcast message to all users in the group
      io.to(groupId).emit('new-message', messageWithId)
    } catch (error) {
      console.error('Error sending message:', error)
      socket.emit('error', 'Failed to send message')
    }
  })

  // Handle group creation
  socket.on('create-group', async (groupData) => {
    try {
      console.log('Received group data:', JSON.stringify(groupData, null, 2))
      
      // Validate required fields
      if (!groupData.name) {
        socket.emit('error', 'Group name is required')
        return
      }
      
      if (!groupData.createdBy) {
        socket.emit('error', 'User must be logged in to create a group')
        return
      }
      
      const inviteCode = groupData.type === 'private' ? generateInviteCode() : null
      const inviteLink = groupData.type === 'private' 
        ? `http://localhost:3000/join/${inviteCode}` 
        : null
      
      console.log('Creating group:', groupData.name, 'by:', groupData.createdBy)
      
      // Store group in Firebase
      const groupRef = await db.collection('groups').add({
        name: groupData.name,
        description: groupData.description || '',
        type: groupData.type,
        inviteCode: inviteCode,
        inviteLink: inviteLink,
        createdBy: groupData.createdBy,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        memberCount: 1,
        members: [groupData.createdBy],
        isActive: true
      })
      
      console.log('Group created with ID:', groupRef.id)
      
      const newGroup = {
        id: groupRef.id,
        ...groupData,
        inviteCode: inviteCode,
        inviteLink: inviteLink,
        memberCount: 1
      }
      
      // Send group info back to creator
      socket.emit('group-created-details', newGroup)
      
      // Send updated groups list to all clients
      const publicGroupInfo = {
        id: newGroup.id,
        name: newGroup.name,
        description: newGroup.description,
        type: newGroup.type,
        memberCount: newGroup.memberCount
      }
      
      if (newGroup.type === 'public') {
        io.emit('group-created', publicGroupInfo)
      } else {
        socket.emit('group-created', publicGroupInfo)
      }
      
      console.log('New group created:', newGroup.name, 'Type:', newGroup.type)
    } catch (error) {
      console.error('Error creating group:', error)
      socket.emit('error', `Failed to create group: ${error.message}`)
    }
  })

  // Handle joining private group
  socket.on('join-private-group', async (data) => {
    try {
      const { inviteCode, userEmail } = data
      
      // Find group by invite code
      const groupsRef = db.collection('groups')
      const groupQuery = groupsRef.where('inviteCode', '==', inviteCode).where('isActive', '==', true)
      const groupSnapshot = await groupQuery.get()
      
      if (!groupSnapshot.empty) {
        const groupDoc = groupSnapshot.docs[0]
        const group = { id: groupDoc.id, ...groupDoc.data() }
        
        // Update group members
        if (!group.members.includes(userEmail)) {
          await groupDoc.ref.update({
            members: admin.firestore.FieldValue.arrayUnion(userEmail),
            memberCount: admin.firestore.FieldValue.increment(1)
          })
        }
        
        // Join socket room
        socket.join(group.id)
        
        socket.emit('join-result', {
          success: true,
          group: {
            id: group.id,
            name: group.name,
            description: group.description,
            type: group.type,
            memberCount: group.memberCount + 1
          }
        })
        
        console.log(`User joined private group: ${group.name}`)
      } else {
        socket.emit('join-result', { success: false, message: 'Invalid invite code' })
      }
    } catch (error) {
      console.error('Error joining private group:', error)
      socket.emit('error', 'Failed to join private group')
    }
  })

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

// REST API endpoints
app.get('/api/groups', async (req, res) => {
  try {
    const groupsRef = db.collection('groups')
    // Simplified query to avoid index requirement
    const publicGroupsQuery = groupsRef.where('type', '==', 'public')
    
    const snapshot = await publicGroupsQuery.get()
    let groups = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }))
    
    // Filter active groups and sort in memory (small dataset)
    groups = groups
      .filter(group => group.isActive !== false)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
    
    res.json(groups)
  } catch (error) {
    console.error('Error fetching groups:', error)
    res.status(500).json({ error: 'Failed to fetch groups' })
  }
})

app.get('/api/groups/:id/messages', async (req, res) => {
  try {
    const groupId = req.params.id
    const messagesRef = db.collection('messages')
    const messagesQuery = messagesRef.where('groupId', '==', groupId)
    
    const snapshot = await messagesQuery.get()
    let messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }))
    
    // Sort in memory and limit
    messages = messages
      .sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0))
      .slice(0, 50)
    
    res.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

const PORT = process.env.PORT || 3002
server.listen(PORT, () => {
  console.log(`Socket.io server with Firebase running on port ${PORT}`)
})