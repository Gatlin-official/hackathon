// types/index.ts - Type definitions for Firebase data models
export interface User {
  id: string
  email: string
  username: string
  displayName?: string
  profilePicture?: string
  createdAt: Date
  lastActive: Date
}

export interface Group {
  id: string
  name: string
  description: string
  type: 'public' | 'private'
  inviteCode?: string
  inviteLink?: string
  createdBy: string
  createdAt: Date
  memberCount: number
  members: string[]
  isActive: boolean
}

export interface Message {
  id: string
  groupId: string
  text: string
  senderId: string
  senderName: string
  senderEmail: string
  timestamp: Date
  intention?: 'venting' | 'advice' | 'urgent' | null
  edited?: boolean
  editedAt?: Date
  stressAnalysis?: MessageStressAnalysis
}

export interface MessageStressAnalysis {
  id: string
  messageId: string
  stressLevel: number // 0-10
  stressIndicators: string[]
  emotions: string[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  aiSolution?: string
  suggestions: string[]
  confidence: number
  reason?: string // AI explanation for the stress level assigned
  analyzedAt: Date
}

export interface GroupMembership {
  id: string
  groupId: string
  userId: string
  joinedAt: Date
  role: 'member' | 'admin' | 'owner'
  isActive: boolean
}

export interface InviteCode {
  id?: string
  code: string
  groupId: string
  createdBy: string
  createdAt: Date
  expiresAt?: Date
  usageCount: number
  maxUsage?: number
  isActive: boolean
}