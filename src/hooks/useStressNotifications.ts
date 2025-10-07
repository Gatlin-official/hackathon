'use client'

import { useState, useEffect } from 'react'

export interface StressNotification {
  id: string
  userId: string
  message: string
  stressScore: number
  stressLevel: 'low' | 'moderate' | 'high' | 'severe'
  remedies: string[]
  timestamp: Date
  originalMessage: string
  emotions: string[]
  urgency: 'normal' | 'attention' | 'urgent'
  isRead: boolean
  actionTaken?: string
}

interface StressNotificationContextType {
  notifications: StressNotification[]
  unreadCount: number
  addNotification: (notification: Omit<StressNotification, 'id' | 'timestamp' | 'isRead'>) => void
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  deleteNotification: (notificationId: string) => void
  getHighPriorityNotifications: () => StressNotification[]
}

export const useStressNotifications = (userId: string): StressNotificationContextType => {
  const [notifications, setNotifications] = useState<StressNotification[]>([])

  // Load notifications from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`stress_notifications_${userId}`)
    if (stored) {
      try {
        const parsed = JSON.parse(stored).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }))
        setNotifications(parsed)
      } catch (error) {
        console.error('Error loading notifications:', error)
      }
    }
  }, [userId])

  // Save notifications to localStorage when they change
  useEffect(() => {
    try {
      if (notifications.length > 0) {
        localStorage.setItem(`stress_notifications_${userId}`, JSON.stringify(notifications))
      }
    } catch (error) {
      console.error('Error saving notifications to localStorage:', error)
      // Silently fail - localStorage issues shouldn't break the app
    }
  }, [notifications, userId])

  const addNotification = (notificationData: Omit<StressNotification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: StressNotification = {
      ...notificationData,
      id: `stress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      isRead: false
    }

    setNotifications(prev => [newNotification, ...prev])

    // Show browser notification for high-priority alerts
    if (notificationData.urgency === 'urgent' || notificationData.stressScore >= 8) {
      showBrowserNotification(newNotification)
    }
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  const getHighPriorityNotifications = () => {
    return notifications.filter(n => 
      !n.isRead && (n.urgency === 'urgent' || n.stressScore >= 7)
    )
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getHighPriorityNotifications
  }
}

// Browser notification helper
const showBrowserNotification = (notification: StressNotification) => {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Wellness Check-in', {
        body: `We noticed you might be feeling stressed. Check your dashboard for personalized support.`,
        icon: '/wellness-icon.png',
        tag: `stress-${notification.id}`
      })
    }
  } catch (error) {
    console.error('Error showing browser notification:', error)
    // Silently fail - notification system shouldn't break the app
  }
}

// Request notification permission
export const requestNotificationPermission = async () => {
  try {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return Notification.permission === 'granted'
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return false
  }
}