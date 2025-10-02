// lib/firebase-services.ts - Firebase service functions
import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  increment 
} from 'firebase/firestore'
import { db } from './firebase'
import { User, Group, Message, GroupMembership, InviteCode } from '@/types'

// User Services
export const userService = {
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'lastActive'>) {
    const docRef = await addDoc(collection(db, 'users'), {
      ...userData,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp()
    })
    return docRef.id
  },

  async getUserById(id: string) {
    const docRef = doc(db, 'users', id)
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as User : null
  },

  async getUserByEmail(email: string) {
    const q = query(collection(db, 'users'), where('email', '==', email))
    const querySnapshot = await getDocs(q)
    return querySnapshot.empty ? null : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as User
  },

  async updateUser(id: string, updates: Partial<User>) {
    const docRef = doc(db, 'users', id)
    await updateDoc(docRef, { ...updates, lastActive: serverTimestamp() })
  }
}

// Group Services
export const groupService = {
  async createGroup(groupData: Omit<Group, 'id' | 'createdAt' | 'memberCount'>) {
    const docRef = await addDoc(collection(db, 'groups'), {
      ...groupData,
      createdAt: serverTimestamp(),
      memberCount: 1
    })
    return docRef.id
  },

  async getGroupById(id: string) {
    const docRef = doc(db, 'groups', id)
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Group : null
  },

  async getPublicGroups() {
    // Simplified query to avoid composite index requirement
    const q = query(
      collection(db, 'groups'), 
      where('type', '==', 'public')
    )
    const querySnapshot = await getDocs(q)
    let groups = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group))
    
    // Filter active groups and sort in memory
    groups = groups
      .filter(group => group.isActive !== false)
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return timeB - timeA // desc order
      })
    
    return groups
  },

  async getUserGroups(userId: string) {
    // Simplified query to avoid composite index requirement
    const q = query(
      collection(db, 'groups'), 
      where('members', 'array-contains', userId)
    )
    const querySnapshot = await getDocs(q)
    let groups = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group))
    
    // Filter active groups in memory
    return groups.filter(group => group.isActive !== false)
  },

  async joinGroup(groupId: string, userId: string) {
    const docRef = doc(db, 'groups', groupId)
    await updateDoc(docRef, {
      members: [...(await this.getGroupById(groupId))?.members || [], userId],
      memberCount: increment(1)
    })
  },

  async leaveGroup(groupId: string, userId: string) {
    const group = await this.getGroupById(groupId)
    if (group) {
      const updatedMembers = group.members.filter(id => id !== userId)
      const docRef = doc(db, 'groups', groupId)
      await updateDoc(docRef, {
        members: updatedMembers,
        memberCount: increment(-1)
      })
    }
  }
}

// Message Services
export const messageService = {
  async createMessage(messageData: Omit<Message, 'id' | 'timestamp'>) {
    const docRef = await addDoc(collection(db, 'messages'), {
      ...messageData,
      timestamp: serverTimestamp()
    })
    return docRef.id
  },

  async getGroupMessages(groupId: string, limit: number = 50) {
    // Simplified query without orderBy to avoid composite index requirement
    const q = query(
      collection(db, 'messages'),
      where('groupId', '==', groupId)
    )
    const querySnapshot = await getDocs(q)
    let messages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message))
    
    // Sort in memory by timestamp
    messages.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0
      return timeA - timeB
    })
    
    return messages.slice(0, limit)
  },

  async updateMessage(messageId: string, updates: Partial<Message>) {
    const docRef = doc(db, 'messages', messageId)
    await updateDoc(docRef, { ...updates, edited: true, editedAt: serverTimestamp() })
  },

  async deleteMessage(messageId: string) {
    const docRef = doc(db, 'messages', messageId)
    await deleteDoc(docRef)
  }
}

// Invite Code Services
export const inviteService = {
  async createInviteCode(inviteData: Omit<InviteCode, 'createdAt' | 'usageCount'>) {
    const docRef = await addDoc(collection(db, 'inviteCodes'), {
      ...inviteData,
      createdAt: serverTimestamp(),
      usageCount: 0
    })
    return docRef.id
  },

  async getInviteByCode(code: string) {
    const q = query(collection(db, 'inviteCodes'), where('code', '==', code))
    const querySnapshot = await getDocs(q)
    if (querySnapshot.empty) return null
    const doc = querySnapshot.docs[0]
    return { id: doc.id, ...doc.data() } as InviteCode & { id: string }
  },

  async useInviteCode(code: string) {
    const invite = await this.getInviteByCode(code)
    if (invite) {
      const docRef = doc(db, 'inviteCodes', invite.id)
      await updateDoc(docRef, {
        usageCount: increment(1)
      })
    }
    return invite
  }
}