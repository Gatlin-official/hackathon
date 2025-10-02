const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')

const app = express()
const server = http.createServer(app)

// Configure Socket.io with CORS
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

app.use(cors())
app.use(express.json())

// In-memory storage (replace with database in production)
const groups = new Map()
const messages = new Map()

// Start with no groups - all groups will be created by users in real-time

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  // Join a group
  socket.on('join-group', (groupId) => {
    socket.join(groupId)
    console.log(`Socket ${socket.id} joined group ${groupId}`)
    
    // Add user to group members
    if (groups.has(groupId)) {
      groups.get(groupId).members.add(socket.id)
    }
    
    // Send existing messages to the user
    const groupMessages = messages.get(groupId) || []
    socket.emit('load-messages', groupMessages)
  })

  // Leave a group
  socket.on('leave-group', (groupId) => {
    socket.leave(groupId)
    if (groups.has(groupId)) {
      groups.get(groupId).members.delete(socket.id)
    }
    console.log(`Socket ${socket.id} left group ${groupId}`)
  })

  // Handle new message
  socket.on('send-message', (data) => {
    const { groupId, message } = data
    console.log('New message:', message)
    
    // Store message
    if (!messages.has(groupId)) {
      messages.set(groupId, [])
    }
    messages.get(groupId).push(message)
    
    // Broadcast message to all users in the group
    io.to(groupId).emit('new-message', message)
  })

  // Handle group creation
  socket.on('create-group', (groupData) => {
    const groupId = Date.now().toString()
    const inviteCode = groupData.type === 'private' ? Math.random().toString(36).substring(2, 8).toUpperCase() : null
    const inviteLink = groupData.type === 'private' ? `http://localhost:3000/join/${groupId}?code=${inviteCode}` : null
    
    const newGroup = {
      id: groupId,
      ...groupData,
      memberCount: 1,
      members: new Set([socket.id]),
      inviteCode: inviteCode,
      inviteLink: inviteLink
    }
    
    groups.set(newGroup.id, newGroup)
    messages.set(newGroup.id, [])
    
    // Send group info back to creator (including invite details)
    socket.emit('group-created-details', newGroup)
    
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
    
    console.log('New group created:', newGroup.name, 'Type:', newGroup.type)
  })

  // Handle joining private group
  socket.on('join-private-group', (data) => {
    const { inviteCode } = data
    let foundGroup = null
    
    // Find group by invite code
    for (const [groupId, group] of groups.entries()) {
      if (group.inviteCode === inviteCode) {
        foundGroup = group
        break
      }
    }
    
    if (foundGroup) {
      // Add user to group
      foundGroup.members.add(socket.id)
      foundGroup.memberCount = foundGroup.members.size
      
      // Join socket room
      socket.join(foundGroup.id)
      
      socket.emit('join-result', { 
        success: true, 
        group: {
          id: foundGroup.id,
          name: foundGroup.name,
          description: foundGroup.description,
          type: foundGroup.type,
          memberCount: foundGroup.memberCount
        }
      })
      
      console.log(`User joined private group: ${foundGroup.name}`)
    } else {
      socket.emit('join-result', { success: false, message: 'Invalid invite code' })
    }
  })

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
    
    // Remove user from all groups
    groups.forEach((group) => {
      group.members.delete(socket.id)
      group.memberCount = group.members.size
    })
  })
})

// REST API endpoints
app.get('/api/groups', (req, res) => {
  const groupsArray = Array.from(groups.values()).map(group => ({
    id: group.id,
    name: group.name,
    description: group.description,
    memberCount: group.members.size
  }))
  res.json(groupsArray)
})

app.get('/api/groups/:id/messages', (req, res) => {
  const groupId = req.params.id
  const groupMessages = messages.get(groupId) || []
  res.json(groupMessages)
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`)
})