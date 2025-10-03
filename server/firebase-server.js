// server/firebase-server.js - Updated server with Firebase integration
const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
const admin = require('firebase-admin')
const { GoogleGenerativeAI } = require('@google/generative-ai')

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

// Initialize Gemini AI for comprehensive stress analysis
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

// Comprehensive Stress Analysis Function
async function performComprehensiveStressAnalysis(messageData) {
  try {
    const systemPrompt = `You are an AI system tasked with analyzing student forum messages for stress levels and providing support.

For each message text you receive:
1. Analyze the text and assign a **stress score from 0 to 10** (0 = no stress, 10 = extremely stressed).
2. If the stress score is greater than 5:
   - Generate a **short, empathetic, and actionable advice message** that the student can follow to relieve stress.
   - Include practical suggestions, mental health tips, or resources relevant to students.
3. If the stress score is 5 or below:
   - Return only the stress score.

Format the output as JSON:
{
  "message_id": "${messageData.id}",
  "stress_score": <numeric_score>,
  "ai_advice": "<advice_or_empty_if_score_≤5>"
}

Be concise, supportive, and empathetic. Do not provide generic advice—make it student-friendly.

Message to analyze: "${messageData.text}"`;

    const result = await model.generateContent(systemPrompt)
    const response = await result.response
    const responseText = response.text()
    
    // Parse the JSON response
    let analysis
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      // Fallback analysis
      analysis = {
        message_id: messageData.id,
        stress_score: 0,
        ai_advice: ""
      }
    }
    
    // Store comprehensive stress analysis in Firebase
    if (analysis.stress_score > 0) {
      await db.collection('comprehensive_stress_analyses').add({
        messageId: messageData.id,
        userEmail: messageData.userEmail,
        messageText: messageData.text,
        stressScore: Math.max(0, Math.min(10, analysis.stress_score)),
        aiAdvice: analysis.ai_advice || "",
        hasAdvice: analysis.stress_score > 5,
        analyzedAt: admin.firestore.FieldValue.serverTimestamp(),
        timestamp: messageData.timestamp
      })
      
      console.log(`Comprehensive analysis completed for message ${messageData.id}: stress score ${analysis.stress_score}`)
    }
    
  } catch (error) {
    console.error('Comprehensive stress analysis failed:', error)
  }
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
      
      // Trigger comprehensive stress analysis in background
      setImmediate(async () => {
        try {
          await performComprehensiveStressAnalysis({
            id: messageRef.id,
            text: message.text,
            userEmail: message.sender.email,
            timestamp: new Date()
          })
        } catch (error) {
          console.error('Error in comprehensive stress analysis:', error)
        }
      })
      
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
      
      if (!userEmail) {
        socket.emit('join-result', { success: false, message: 'Authentication required. Please log in first.' })
        return
      }
      
      if (!inviteCode || inviteCode.length !== 6) {
        socket.emit('join-result', { success: false, message: 'Please enter a valid 6-character invite code' })
        return
      }
      
      // Find group by invite code
      const groupsRef = db.collection('groups')
      const groupQuery = groupsRef.where('inviteCode', '==', inviteCode).where('isActive', '==', true)
      const groupSnapshot = await groupQuery.get()
      
      if (!groupSnapshot.empty) {
        const groupDoc = groupSnapshot.docs[0]
        const group = { id: groupDoc.id, ...groupDoc.data() }
        
        // Check if user is already a member
        if (group.members && group.members.includes(userEmail)) {
          socket.emit('join-result', { success: false, message: 'You are already a member of this group' })
          return
        }
        
        // Update group members safely
        const updatedMembers = group.members ? [...group.members, userEmail] : [userEmail]
        await groupDoc.ref.update({
          members: updatedMembers,
          memberCount: updatedMembers.length
        })
        
        // Join socket room
        socket.join(group.id)
        
        socket.emit('join-result', {
          success: true,
          group: {
            id: group.id,
            name: group.name,
            description: group.description,
            type: group.type,
            memberCount: updatedMembers.length
          }
        })
        
        // Emit group-joined event to trigger GroupList refresh
        socket.emit('group-joined', { groupId: group.id })
        
        console.log(`User ${userEmail} joined private group: ${group.name}`)
      } else {
        socket.emit('join-result', { success: false, message: 'Invalid invite code or group not found' })
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
    const userEmail = req.query.userEmail
    const groupsRef = db.collection('groups')
    
    // Get all groups (public and private where user is member/creator)
    const allGroupsSnapshot = await groupsRef.get()
    let groups = []
    
    allGroupsSnapshot.docs.forEach(doc => {
      const group = { id: doc.id, ...doc.data() }
      
      // Include public groups or private groups where user is member/creator
      if (group.type === 'public' || 
          (group.type === 'private' && userEmail && 
           (group.createdBy === userEmail || (group.members && group.members.includes(userEmail))))) {
        groups.push({
          ...group,
          createdAt: group.createdAt?.toDate()
        })
      }
    })
    
    // Filter active groups and sort in memory
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

// Get user's message history
app.get('/api/user/:email/messages', async (req, res) => {
  try {
    const userEmail = req.params.email
    const messagesRef = db.collection('messages')
    const messagesQuery = messagesRef.where('senderEmail', '==', userEmail)
    
    const snapshot = await messagesQuery.get()
    let messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }))
    
    // Get stress analyses for these messages
    const messageIds = messages.map(msg => msg.id)
    let stressAnalyses = []
    
    if (messageIds.length > 0) {
      const analysesRef = db.collection('stressAnalyses')
      const analysesQuery = analysesRef.where('messageId', 'in', messageIds.slice(0, 10)) // Firestore 'in' limit
      const analysesSnapshot = await analysesQuery.get()
      
      stressAnalyses = analysesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        analyzedAt: doc.data().analyzedAt?.toDate()
      }))
    }
    
    // Attach stress analyses to messages
    messages = messages.map(message => {
      const analysis = stressAnalyses.find(a => a.messageId === message.id)
      return analysis ? { ...message, stressAnalysis: analysis } : message
    })
    
    // Sort by timestamp descending and limit
    messages = messages
      .sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
      .slice(0, 100) // Last 100 messages
    
    res.json(messages)
  } catch (error) {
    console.error('Error fetching user messages:', error)
    res.status(500).json({ error: 'Failed to fetch user messages' })
  }
})

// Save stress analysis
app.post('/api/stress-analysis', async (req, res) => {
  try {
    const analysisData = req.body
    
    // Store in Firebase
    const analysisRef = await db.collection('stressAnalyses').add({
      ...analysisData,
      analyzedAt: admin.firestore.FieldValue.serverTimestamp()
    })
    
    console.log('Stress analysis saved:', analysisRef.id)
    res.json({ id: analysisRef.id, success: true })
  } catch (error) {
    console.error('Error saving stress analysis:', error)
    res.status(500).json({ error: 'Failed to save stress analysis' })
  }
})

// Get comprehensive stress analyses for user
app.get('/api/user/:email/comprehensive-analyses', async (req, res) => {
  try {
    const userEmail = req.params.email
    
    // Get comprehensive stress analyses
    const analysesRef = db.collection('comprehensive_stress_analyses')
    const analysesQuery = analysesRef.where('userEmail', '==', userEmail)
    
    const snapshot = await analysesQuery.get()
    const analyses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      analyzedAt: doc.data().analyzedAt?.toDate(),
      timestamp: doc.data().timestamp?.toDate()
    }))
    
    // Sort by timestamp (most recent first)
    analyses.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0))
    
    console.log(`Found ${analyses.length} comprehensive analyses for user ${userEmail}`)
    res.json(analyses)
  } catch (error) {
    console.error('Error fetching comprehensive analyses:', error)
    res.status(500).json({ error: 'Failed to fetch comprehensive analyses' })
  }
})

const PORT = process.env.PORT || 3003
server.listen(PORT, () => {
  console.log(`Socket.io server with Firebase running on port ${PORT}`)
})