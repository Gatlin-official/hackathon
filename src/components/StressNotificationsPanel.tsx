'use client'

import { useState } from 'react'
import { StressNotification } from '@/hooks/useStressNotifications'

interface StressNotificationsPanelProps {
  notifications: StressNotification[]
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onDelete: (id: string) => void
}

export default function StressNotificationsPanel({ 
  notifications, 
  onMarkAsRead, 
  onMarkAllAsRead, 
  onDelete 
}: StressNotificationsPanelProps) {
  const [selectedNotification, setSelectedNotification] = useState<StressNotification | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all')

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead
    if (filter === 'urgent') return notification.urgency === 'urgent' || notification.stressScore >= 8
    return true
  })

  const getStressColor = (level: string, score: number) => {
    if (score >= 8) return 'text-red-600 bg-red-50 border-red-200'
    if (level === 'high') return 'text-orange-600 bg-orange-50 border-orange-200'
    if (level === 'moderate') return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-green-600 bg-green-50 border-green-200'
  }

  const getUrgencyIcon = (urgency: string, score: number) => {
    if (score >= 8 || urgency === 'urgent') return '🚨'
    if (urgency === 'attention') return '⚠️'
    return '💙'
  }

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-semibold text-gray-800">🧠 Wellness Alerts</h3>
          {notifications.filter(n => !n.isRead).length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {notifications.filter(n => !n.isRead).length}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as any)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="urgent">Urgent</option>
          </select>
          
          {notifications.filter(n => !n.isRead).length > 0 && (
            <button 
              onClick={onMarkAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🌟</div>
            <p>No wellness alerts right now</p>
            <p className="text-sm">Keep taking care of yourself!</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-xl border-l-4 cursor-pointer transition-all ${
                !notification.isRead ? 'bg-blue-50 border-l-blue-500' : 'bg-gray-50 border-l-gray-300'
              } ${getStressColor(notification.stressLevel, notification.stressScore)} hover:shadow-md`}
              onClick={() => {
                setSelectedNotification(notification)
                if (!notification.isRead) onMarkAsRead(notification.id)
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getUrgencyIcon(notification.urgency, notification.stressScore)}</span>
                    <span className="font-medium text-gray-800">
                      Stress Level: {notification.stressLevel.charAt(0).toUpperCase() + notification.stressLevel.slice(1)} ({notification.stressScore}/10)
                    </span>
                    <span className="text-xs text-gray-500">{formatTimeAgo(notification.timestamp)}</span>
                  </div>
                  
                  <p className="text-gray-700 text-sm mb-2">{notification.message}</p>
                  
                  {notification.emotions.length > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-xs text-gray-600">Emotions detected:</span>
                      {notification.emotions.slice(0, 3).map((emotion, idx) => (
                        <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          {emotion}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-600 truncate">
                    "{notification.originalMessage}"
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(notification.id)
                  }}
                  className="text-gray-400 hover:text-red-500 ml-2"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detailed Notification Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                {getUrgencyIcon(selectedNotification.urgency, selectedNotification.stressScore)}
                Wellness Support
              </h4>
              <button 
                onClick={() => setSelectedNotification(null)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Stress Analysis */}
              <div className={`p-4 rounded-xl ${getStressColor(selectedNotification.stressLevel, selectedNotification.stressScore)}`}>
                <h5 className="font-semibold mb-2">Stress Analysis</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Level:</span> {selectedNotification.stressLevel}
                  </div>
                  <div>
                    <span className="font-medium">Score:</span> {selectedNotification.stressScore}/10
                  </div>
                  <div>
                    <span className="font-medium">Urgency:</span> {selectedNotification.urgency}
                  </div>
                  <div>
                    <span className="font-medium">Time:</span> {formatTimeAgo(selectedNotification.timestamp)}
                  </div>
                </div>
                
                {selectedNotification.emotions.length > 0 && (
                  <div className="mt-2">
                    <span className="font-medium text-sm">Emotions detected:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedNotification.emotions.map((emotion, idx) => (
                        <span key={idx} className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded-full">
                          {emotion}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Original Message */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h5 className="font-semibold text-gray-800 mb-2">Original Message</h5>
                <p className="text-gray-700 italic">"{selectedNotification.originalMessage}"</p>
              </div>

              {/* Personalized Remedies */}
              <div className="bg-green-50 p-4 rounded-xl">
                <h5 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  🌿 Personalized Support Suggestions
                </h5>
                <div className="space-y-2">
                  {selectedNotification.remedies.map((remedy, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2 bg-white rounded-lg">
                      <span className="text-green-600 mt-1">•</span>
                      <span className="text-gray-700 text-sm">{remedy}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                  I'm feeling better now
                </button>
                <button className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">
                  This was helpful
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Need more help
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}