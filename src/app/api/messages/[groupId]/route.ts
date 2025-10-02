// app/api/messages/[groupId]/route.ts - API routes for messages
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { messageService, userService } from '@/lib/firebase-services'

interface RouteParams {
  params: {
    groupId: string
  }
}

// GET /api/messages/[groupId] - Get messages for a group
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { groupId } = params
    const messages = await messageService.getGroupMessages(groupId)
    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

// POST /api/messages/[groupId] - Create a new message
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { groupId } = params
    const body = await request.json()
    const { text, intention } = body

    // Get user from database
    let user = await userService.getUserByEmail(session.user.email)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create message
    const messageId = await messageService.createMessage({
      groupId,
      text,
      senderId: user.id,
      senderName: user.username,
      senderEmail: user.email,
      intention: intention || null
    })

    const message = {
      id: messageId,
      groupId,
      text,
      senderId: user.id,
      senderName: user.username,
      senderEmail: user.email,
      timestamp: new Date(),
      intention: intention || null
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
  }
}