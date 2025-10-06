const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
const admin = require('firebase-admin')

// Load environment variables from root directory
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

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
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003"],
    methods: ["GET", "POST"]
  }
})

app.use(cors())
app.use(express.json())

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // Join a group
  socket.on('join-group', async (groupId) => {
    try {
      socket.join(groupId)
      console.log(`Socket ${socket.id} joined group ${groupId}`)
      
      // Get existing messages from Firebase
      const messagesRef = db.collection('groups').doc(groupId).collection('messages')
      const messagesSnapshot = await messagesRef.orderBy('timestamp', 'asc').get()
      
      const groupMessages = []
      messagesSnapshot.forEach(doc => {
        const data = doc.data()
        groupMessages.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        })
      })
      
      socket.emit('load-messages', groupMessages)
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
      const { groupId, message, username, isAI } = data
      console.log('New message:', message)
      
      const messageData = {
        text: message.text || message,
        username: message.username || username || 'Anonymous',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        isAI: message.isAI || isAI || false
      }

      // Store message in Firebase
      const messagesRef = db.collection('groups').doc(groupId).collection('messages')
      const docRef = await messagesRef.add(messageData)
      
      // Create response with proper timestamp for real-time display
      const responseMessage = {
        id: docRef.id,
        ...messageData,
        timestamp: new Date() // Use current time for immediate display
      }

      // Broadcast message to all users in the group
      io.to(groupId).emit('new-message', responseMessage)
      console.log(`Message stored in Firebase and broadcasted to group ${groupId}`)
    } catch (error) {
      console.error('Error sending message:', error)
      socket.emit('error', 'Failed to send message')
    }
  })

  // Handle group creation
  socket.on('create-group', async (groupData) => {
    try {
      const groupId = Date.now().toString()
      const inviteCode = groupData.type === 'private' ? Math.random().toString(36).substring(2, 8).toUpperCase() : null
      const inviteLink = groupData.type === 'private' ? `http://localhost:3001/join/${groupId}?code=${inviteCode}` : null
      
      const newGroup = {
        id: groupId,
        name: groupData.name,
        description: groupData.description,
        type: groupData.type,
        memberCount: 1,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: groupData.userEmail,
        inviteCode: inviteCode,
        inviteLink: inviteLink
      }
      
      // Store group in Firebase
      await db.collection('groups').doc(groupId).set(newGroup)
      
      // Add creator to members collection
      if (groupData.userEmail) {
        await db.collection('groups').doc(groupId).collection('members').doc(groupData.userEmail).set({
          email: groupData.userEmail,
          joinedAt: admin.firestore.FieldValue.serverTimestamp(),
          role: 'creator'
        })
      }
      
      // Send group info back to creator (including invite details)
      const responseGroup = {
        ...newGroup,
        createdAt: new Date() // For immediate display
      }
      socket.emit('group-created-details', responseGroup)
      
      // Send updated groups list to all clients (without sensitive invite info for private groups)
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
        // Only send to the creator for private groups
        socket.emit('group-created', publicGroupInfo)
      }
      
      console.log('New group created in Firebase:', newGroup.name, 'Type:', newGroup.type)
    } catch (error) {
      console.error('Error creating group:', error)
      socket.emit('error', 'Failed to create group')
    }
  })

    // Handle joining private group
  socket.on('join-private-group', async (data) => {
    try {
      const { inviteCode, userEmail } = data
      
      if (!userEmail) {
        socket.emit('join-result', { success: false, message: 'User email required' })
        return
      }
      
      // Find group with matching invite code in Firebase
      const groupsSnapshot = await db.collection('groups').where('inviteCode', '==', inviteCode).get()
      
      if (!groupsSnapshot.empty) {
        const groupDoc = groupsSnapshot.docs[0]
        const groupData = groupDoc.data()
        
        // Add user to members collection
        await db.collection('groups').doc(groupDoc.id).collection('members').doc(userEmail).set({
          email: userEmail,
          joinedAt: admin.firestore.FieldValue.serverTimestamp()
        })
        
        // Update member count
        const membersSnapshot = await db.collection('groups').doc(groupDoc.id).collection('members').get()
        await db.collection('groups').doc(groupDoc.id).update({
          memberCount: membersSnapshot.size
        })
        
        // Join socket room
        socket.join(groupDoc.id)
        
        socket.emit('join-result', { 
          success: true, 
          group: {
            id: groupDoc.id,
            name: groupData.name,
            description: groupData.description,
            type: groupData.type,
            memberCount: membersSnapshot.size
          }
        })
        
        console.log(`User ${userEmail} joined private group: ${groupData.name}`)
      } else {
        socket.emit('join-result', { success: false, message: 'Invalid invite code' })
      }
    } catch (error) {
      console.error('Error joining private group:', error)
      socket.emit('join-result', { success: false, message: 'Failed to join group' })
    }
  })

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
    // User is automatically removed from socket rooms
  })
})

// REST API endpoints
app.get('/api/groups', async (req, res) => {
  try {
    const { userEmail } = req.query
    const groupsSnapshot = await db.collection('groups').get()
    const groupsArray = []
    
    for (const doc of groupsSnapshot.docs) {
      const data = doc.data()
      
      // For public groups, always include them
      if (data.type === 'public') {
        groupsArray.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          type: data.type,
          memberCount: data.memberCount || 1,
          createdAt: data.createdAt?.toDate() || new Date()
        })
      } 
      // For private groups, only include if user is a member
      else if (data.type === 'private' && userEmail) {
        const membersSnapshot = await db.collection('groups').doc(doc.id).collection('members').doc(userEmail).get()
        if (membersSnapshot.exists) {
          groupsArray.push({
            id: doc.id,
            name: data.name,
            description: data.description,
            type: data.type,
            memberCount: data.memberCount || 1,
            createdAt: data.createdAt?.toDate() || new Date()
          })
        }
      }
    }
    
    res.json(groupsArray)
  } catch (error) {
    console.error('Error fetching groups:', error)
    res.status(500).json({ error: 'Failed to fetch groups' })
  }
})

app.get('/api/groups/:id/messages', async (req, res) => {
  try {
    const groupId = req.params.id
    const messagesRef = db.collection('groups').doc(groupId).collection('messages')
    const messagesSnapshot = await messagesRef.orderBy('timestamp', 'asc').get()
    
    const groupMessages = []
    messagesSnapshot.forEach(doc => {
      const data = doc.data()
      groupMessages.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date()
      })
    })
    
    res.json(groupMessages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    res.status(500).json({ error: 'Failed to fetch messages' })
  }
})

const PORT = process.env.PORT || 3003
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`)
})