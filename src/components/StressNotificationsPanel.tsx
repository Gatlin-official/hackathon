'use client''use client''use client''use client'



import React from 'react'

import { StressNotification } from '@/hooks/useStressNotifications'

import { useState } from 'react'

interface Props {

  notifications: StressNotification[]import { StressNotification } from '@/hooks/useStressNotifications'

  onMarkAsRead: (id: string) => void

  onMarkAllAsRead: () => voidimport { useState } from 'react'import { useState } from 'react'

  onDelete: (id: string) => void

}interface StressNotificationsPanelProps {



export default function StressNotificationsPanel({ notifications, onMarkAsRead, onMarkAllAsRead, onDelete }: Props) {  notifications: StressNotification[]import { StressNotification } from '@/hooks/useStressNotifications'import { StressNotification } from '@/hooks/useStressNotifications'

  return (

    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">  onMarkAsRead: (id: string) => void

      <div className="flex items-center justify-between mb-6">

        <h3 className="text-xl font-semibold text-gray-800">🧠 Wellness Alerts</h3>  onMarkAllAsRead: () => void

        {notifications.filter(n => !n.isRead).length > 0 && (

          <button onClick={onMarkAllAsRead} className="text-sm text-blue-600 hover:text-blue-800">  onDelete: (id: string) => void

            Mark all read ({notifications.filter(n => !n.isRead).length})

          </button>}interface StressNotificationsPanelProps {interface StressNotificationsPanelProps {

        )}

      </div>



      <div className="space-y-3 max-h-96 overflow-y-auto">export default function StressNotificationsPanel({   notifications: StressNotification[]  notifications: StressNotification[]

        {notifications.length === 0 ? (

          <div className="text-center py-8 text-gray-500">  notifications, 

            <div className="text-4xl mb-2">🌟</div>

            <p>No wellness alerts right now</p>  onMarkAsRead,   onMarkAsRead: (id: string) => void  onMarkAsRead: (id: string) => void

            <p className="text-sm">Keep taking care of yourself!</p>

          </div>  onMarkAllAsRead, 

        ) : (

          notifications.map((notification) => (  onDelete   onMarkAllAsRead: () => void  onMarkAllAsRead: () => void

            <div key={notification.id} className="border rounded-lg p-4 bg-blue-50 border-blue-200">

              <div className="flex justify-between items-start">}: StressNotificationsPanelProps) {

                <div className="flex-1">

                  <div className="flex items-center gap-2 mb-1">  const [selectedNotification, setSelectedNotification] = useState<StressNotification | null>(null)  onDelete: (id: string) => void  onDelete: (id: string) => void

                    <span className="font-medium text-sm">Stress Level: {notification.stressLevel}</span>

                    <span className="text-xs text-gray-500">Score: {notification.stressScore}/10</span>  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all')

                  </div>

                  <p className="text-sm text-gray-700 mb-1">{notification.message}</p>}}

                  <p className="text-xs text-gray-600 italic">"{notification.originalMessage}"</p>

                </div>  const filteredNotifications = notifications.filter(notification => {

                <button onClick={() => onDelete(notification.id)} className="text-gray-400 hover:text-red-500 ml-2">

                  ×    if (filter === 'unread') return !notification.isRead

                </button>

              </div>    if (filter === 'urgent') return notification.urgency === 'urgent' || notification.stressScore >= 8

            </div>

          ))    return trueexport default function StressNotificationsPanel({ export default function StressNotificationsPanel({ 

        )}

      </div>  })

    </div>

  )  notifications,   notifications, 

}
  const getStressColor = (level: string, score: number) => {

    if (score >= 8) return 'text-red-600 bg-red-50 border-red-200'  onMarkAsRead,   onMarkAsRead, 

    if (level === 'high') return 'text-orange-600 bg-orange-50 border-orange-200'

    if (level === 'moderate') return 'text-yellow-600 bg-yellow-50 border-yellow-200'  onMarkAllAsRead,   onMarkAllAsRead, 

    return 'text-green-600 bg-green-50 border-green-200'

  }  onDelete   onDelete 



  const getUrgencyIcon = (urgency: string, score: number) => {}: StressNotificationsPanelProps) {}: StressNotificationsPanelProps) {

    if (score >= 8 || urgency === 'urgent') return '🚨'

    if (urgency === 'attention') return '⚠️'  const [selectedNotification, setSelectedNotification] = useState<StressNotification | null>(null)  const [selectedNotification, setSelectedNotification] = useState<StressNotification | null>(null)

    return '💙'

  }  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all')  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all')



  const formatTimeAgo = (timestamp: Date) => {

    const now = new Date()

    const diff = now.getTime() - timestamp.getTime()  const filteredNotifications = notifications.filter(notification => {  const filteredNotifications = notifications.filter(notification => {

    const minutes = Math.floor(diff / 60000)

    const hours = Math.floor(minutes / 60)    if (filter === 'unread') return !notification.isRead    if (filter === 'unread') return !notification.isRead

    const days = Math.floor(hours / 24)

    if (filter === 'urgent') return notification.urgency === 'urgent' || notification.stressScore >= 8    if (filter === 'urgent') return notification.urgency === 'urgent' || notification.stressScore >= 8

    if (days > 0) return `${days}d ago`

    if (hours > 0) return `${hours}h ago`    return true    return true

    if (minutes > 0) return `${minutes}m ago`

    return 'Just now'  })  })

  }



  return (

    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">  const getStressColor = (level: string, score: number) => {  const getStressColor = (level: string, score: number) => {

      <div className="flex items-center justify-between mb-6">

        <div className="flex items-center gap-3">    if (score >= 8) return 'text-red-600 bg-red-50 border-red-200'    if (score >= 8) return 'text-red-600 bg-red-50 border-red-200'

          <h3 className="text-xl font-semibold text-gray-800">🧠 Wellness Alerts</h3>

          {notifications.filter(n => !n.isRead).length > 0 && (    if (level === 'high') return 'text-orange-600 bg-orange-50 border-orange-200'    if (level === 'high') return 'text-orange-600 bg-orange-50 border-orange-200'

            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">

              {notifications.filter(n => !n.isRead).length}    if (level === 'moderate') return 'text-yellow-600 bg-yellow-50 border-yellow-200'    if (level === 'moderate') return 'text-yellow-600 bg-yellow-50 border-yellow-200'

            </span>

          )}    return 'text-green-600 bg-green-50 border-green-200'    return 'text-green-600 bg-green-50 border-green-200'

        </div>

      </div>  }  }



      <div className="space-y-3 max-h-96 overflow-y-auto">

        {filteredNotifications.length === 0 ? (

          <div className="text-center py-8 text-gray-500">  const getUrgencyIcon = (urgency: string, score: number) => {  const getUrgencyIcon = (urgency: string, score: number) => {

            <div className="text-4xl mb-2">🌟</div>

            <p>No wellness alerts right now</p>    if (score >= 8 || urgency === 'urgent') return '🚨'    if (score >= 8 || urgency === 'urgent') return '🚨'

            <p className="text-sm">Keep taking care of yourself!</p>

          </div>    if (urgency === 'attention') return '⚠️'    if (urgency === 'attention') return '⚠️'

        ) : (

          filteredNotifications.map((notification) => (    return '💙'    return '💙'

            <div

              key={notification.id}  }  }

              className={`border rounded-lg p-4 ${getStressColor(notification.stressLevel, notification.stressScore)}`}

            >

              <div className="flex items-start justify-between">

                <div className="flex items-start gap-3 flex-1">  const formatTimeAgo = (timestamp: Date) => {  const formatTimeAgo = (timestamp: Date) => {

                  <div className="text-xl">

                    {getUrgencyIcon(notification.urgency, notification.stressScore)}    const now = new Date()    const now = new Date()

                  </div>

                      const diff = now.getTime() - timestamp.getTime()    const diff = now.getTime() - timestamp.getTime()

                  <div className="flex-1">

                    <div className="flex items-center gap-2 mb-1">    const minutes = Math.floor(diff / 60000)    const minutes = Math.floor(diff / 60000)

                      <span className="font-medium text-sm">

                        Stress Level: {notification.stressLevel}    const hours = Math.floor(minutes / 60)    const hours = Math.floor(minutes / 60)

                      </span>

                      <span className="text-xs text-gray-500">    const days = Math.floor(hours / 24)    const days = Math.floor(hours / 24)

                        Score: {notification.stressScore}/10

                      </span>

                      <span className="text-xs text-gray-400">

                        {formatTimeAgo(notification.timestamp)}    if (days > 0) return `${days}d ago`    if (days > 0) return `${days}d ago`

                      </span>

                    </div>    if (hours > 0) return `${hours}h ago`    if (hours > 0) return `${hours}h ago`

                    

                    <p className="text-sm text-gray-700 mb-2">    if (minutes > 0) return `${minutes}m ago`    if (minutes > 0) return `${minutes}m ago`

                      {notification.message}

                    </p>    return 'Just now'    return 'Just now'

                    

                    <p className="text-xs text-gray-600 italic">  }  }

                      "{notification.originalMessage}"

                    </p>

                  </div>

                </div>  return (  return (

                

                <button    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">

                  onClick={(e) => {

                    e.stopPropagation()      {/* Header */}      {/* Header */}

                    onDelete(notification.id)

                  }}      <div className="flex items-center justify-between mb-6">      <div className="flex items-center justify-between mb-6">

                  className="text-gray-400 hover:text-red-500 ml-2"

                >        <div className="flex items-center gap-3">        <div className="flex items-center gap-3">

                  ×

                </button>          <h3 className="text-xl font-semibold text-gray-800">🧠 Wellness Alerts</h3>          <h3 className="text-xl font-semibold text-gray-800">🧠 Wellness Alerts</h3>

              </div>

            </div>          {notifications.filter(n => !n.isRead).length > 0 && (          {notifications.filter(n => !n.isRead).length > 0 && (

          ))

        )}            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">

      </div>

    </div>              {notifications.filter(n => !n.isRead).length}              {notifications.filter(n => !n.isRead).length}

  )

}            </span>            </span>

          )}          )}

        </div>        </div>

                

        <div className="flex items-center gap-2">        <div className="flex items-center gap-2">

          <select           <select 

            value={filter}             value={filter} 

            onChange={(e) => setFilter(e.target.value as any)}            onChange={(e) => setFilter(e.target.value as any)}

            className="text-sm border border-gray-300 rounded-md px-2 py-1"            className="text-sm border border-gray-300 rounded-md px-2 py-1"

          >          >

            <option value="all">All</option>            <option value="all">All</option>

            <option value="unread">Unread</option>            <option value="unread">Unread</option>

            <option value="urgent">Urgent</option>            <option value="urgent">Urgent</option>

          </select>          </select>

                    

          {notifications.filter(n => !n.isRead).length > 0 && (          {notifications.filter(n => !n.isRead).length > 0 && (

            <button             <button 

              onClick={onMarkAllAsRead}              onClick={onMarkAllAsRead}

              className="text-sm text-blue-600 hover:text-blue-800"              className="text-sm text-blue-600 hover:text-blue-800"

            >            >

              Mark all read              Mark all read

            </button>            </button>

          )}          )}

        </div>        </div>

      </div>      </div>



      {/* Notifications List */}      {/* Notifications List */}

      <div className="space-y-3 max-h-96 overflow-y-auto">      <div className="space-y-3 max-h-96 overflow-y-auto">

        {filteredNotifications.length === 0 ? (        {filteredNotifications.length === 0 ? (

          <div className="text-center py-8 text-gray-500">          <div className="text-center py-8 text-gray-500">

            <div className="text-4xl mb-2">🌟</div>            <div className="text-4xl mb-2">🌟</div>

            <p>No wellness alerts right now</p>            <p>No wellness alerts right now</p>

            <p className="text-sm">Keep taking care of yourself!</p>            <p className="text-sm">Keep taking care of yourself!</p>

          </div>          </div>

        ) : (        ) : (

          filteredNotifications.map((notification) => (          filteredNotifications.map((notification) => (

            <div            <div

              key={notification.id}              key={notification.id}

              className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${              className={`p-4 rounded-xl border-l-4 cursor-pointer transition-all ${

                notification.isRead ? 'opacity-70' : ''                !notification.isRead ? 'bg-blue-50 border-l-blue-500' : 'bg-gray-50 border-l-gray-300'

              } ${getStressColor(notification.stressLevel, notification.stressScore)}`}              } ${getStressColor(notification.stressLevel, notification.stressScore)} hover:shadow-md`}

              onClick={() => {              onClick={() => {

                setSelectedNotification(notification)                setSelectedNotification(notification)

                if (!notification.isRead) {                if (!notification.isRead) onMarkAsRead(notification.id)

                  onMarkAsRead(notification.id)              }}

                }            >

              }}              <div className="flex items-start justify-between">

            >                <div className="flex-1">

              <div className="flex items-start justify-between">                  <div className="flex items-center gap-2 mb-2">

                <div className="flex items-start gap-3 flex-1">                    <span className="text-lg">{getUrgencyIcon(notification.urgency, notification.stressScore)}</span>

                  <div className="text-xl">                    <span className="font-medium text-gray-800">

                    {getUrgencyIcon(notification.urgency, notification.stressScore)}                      Stress Level: {notification.stressLevel.charAt(0).toUpperCase() + notification.stressLevel.slice(1)} ({notification.stressScore}/10)

                  </div>                    </span>

                                      <span className="text-xs text-gray-500">{formatTimeAgo(notification.timestamp)}</span>

                  <div className="flex-1">                  </div>

                    <div className="flex items-center gap-2 mb-1">                  

                      <span className="font-medium text-sm">                  <p className="text-gray-700 text-sm mb-2">{notification.message}</p>

                        Stress Level: {notification.stressLevel}                  

                      </span>                  {notification.emotions.length > 0 && (

                      <span className="text-xs text-gray-500">                    <div className="flex items-center gap-1 mb-2">

                        Score: {notification.stressScore}/10                      <span className="text-xs text-gray-600">Emotions detected:</span>

                      </span>                      {notification.emotions.slice(0, 3).map((emotion, idx) => (

                      <span className="text-xs text-gray-400">                        <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">

                        {formatTimeAgo(notification.timestamp)}                          {emotion}

                      </span>                        </span>

                    </div>                      ))}

                                        </div>

                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">                  )}

                      {notification.message}                  

                    </p>                  <div className="text-xs text-gray-600 truncate">

                                        "{notification.originalMessage}"

                    {notification.emotions.length > 0 && (                  </div>

                      <div className="flex flex-wrap gap-1 mb-2">                </div>

                        {notification.emotions.slice(0, 3).map((emotion, index) => (                

                          <span                <button

                            key={index}                  onClick={(e) => {

                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"                    e.stopPropagation()

                          >                    onDelete(notification.id)

                            {emotion}                  }}

                          </span>                  className="text-gray-400 hover:text-red-500 ml-2"

                        ))}                >

                        {notification.emotions.length > 3 && (                  ✕

                          <span className="text-xs text-gray-500">                </button>

                            +{notification.emotions.length - 3} more              </div>

                          </span>            </div>

                        )}          ))

                      </div>        )}

                    )}      </div>

                    

                    <p className="text-xs text-gray-600 italic">      {/* Detailed Notification Modal */}

                      "{notification.originalMessage}"      {selectedNotification && (

                    </p>        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">

                  </div>          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">

                </div>            <div className="flex items-center justify-between mb-4">

                              <h4 className="text-xl font-semibold text-gray-800 flex items-center gap-2">

                <button                {getUrgencyIcon(selectedNotification.urgency, selectedNotification.stressScore)}

                  onClick={(e) => {                Wellness Support

                    e.stopPropagation()              </h4>

                    onDelete(notification.id)              <button 

                  }}                onClick={() => setSelectedNotification(null)}

                  className="text-gray-400 hover:text-red-500 ml-2"                className="text-gray-500 hover:text-gray-700 text-xl"

                >              >

                  ×                ✕

                </button>              </button>

              </div>            </div>

            </div>

          ))            <div className="space-y-4">

        )}              {/* Stress Analysis */}

      </div>              <div className={`p-4 rounded-xl ${getStressColor(selectedNotification.stressLevel, selectedNotification.stressScore)}`}>

                <h5 className="font-semibold mb-2">Stress Analysis</h5>

      {/* Modal for detailed view */}                <div className="grid grid-cols-2 gap-4 text-sm">

      {selectedNotification && (                  <div>

        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">                    <span className="font-medium">Level:</span> {selectedNotification.stressLevel}

          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">                  </div>

            <div className="flex items-center justify-between mb-4">                  <div>

              <h4 className="font-semibold text-lg">Wellness Alert Details</h4>                    <span className="font-medium">Score:</span> {selectedNotification.stressScore}/10

              <button                  </div>

                onClick={() => setSelectedNotification(null)}                  <div>

                className="text-gray-500 hover:text-gray-700"                    <span className="font-medium">Urgency:</span> {selectedNotification.urgency}

              >                  </div>

                ×                  <div>

              </button>                    <span className="font-medium">Time:</span> {formatTimeAgo(selectedNotification.timestamp)}

            </div>                  </div>

                            </div>

            <div className="space-y-3">                

              <div>                {selectedNotification.emotions.length > 0 && (

                <span className="font-medium">Message:</span>                  <div className="mt-2">

                <p className="text-gray-700 mt-1">{selectedNotification.originalMessage}</p>                    <span className="font-medium text-sm">Emotions detected:</span>

              </div>                    <div className="flex flex-wrap gap-1 mt-1">

                                    {selectedNotification.emotions.map((emotion, idx) => (

              <div>                        <span key={idx} className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded-full">

                <span className="font-medium">Analysis:</span>                          {emotion}

                <p className="text-gray-700 mt-1">{selectedNotification.message}</p>                        </span>

              </div>                      ))}

                                  </div>

              <div>                  </div>

                <span className="font-medium">Stress Level:</span>                )}

                <span className="ml-2 capitalize">{selectedNotification.stressLevel}</span>              </div>

                <span className="ml-2 text-gray-500">({selectedNotification.stressScore}/10)</span>

              </div>              {/* Original Message */}

                            <div className="bg-gray-50 p-4 rounded-xl">

              {selectedNotification.emotions.length > 0 && (                <h5 className="font-semibold text-gray-800 mb-2">Original Message</h5>

                <div>                <p className="text-gray-700 italic">"{selectedNotification.originalMessage}"</p>

                  <span className="font-medium">Detected Emotions:</span>              </div>

                  <div className="flex flex-wrap gap-1 mt-1">

                    {selectedNotification.emotions.map((emotion, index) => (              {/* Personalized Remedies */}

                      <span              <div className="bg-green-50 p-4 rounded-xl">

                        key={index}                <h5 className="font-semibold text-green-800 mb-3 flex items-center gap-2">

                        className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full"                  🌿 Personalized Support Suggestions

                      >                </h5>

                        {emotion}                <div className="space-y-2">

                      </span>                  {selectedNotification.remedies.map((remedy, idx) => (

                    ))}                    <div key={idx} className="flex items-start gap-3 p-2 bg-white rounded-lg">

                  </div>                      <span className="text-green-600 mt-1">•</span>

                </div>                      <span className="text-gray-700 text-sm">{remedy}</span>

              )}                    </div>

                                ))}

              {selectedNotification.remedies.length > 0 && (                </div>

                <div>              </div>

                  <span className="font-medium">Suggested Remedies:</span>

                  <ul className="list-disc list-inside text-gray-700 mt-1">              {/* Action Buttons */}

                    {selectedNotification.remedies.map((remedy, index) => (              <div className="flex gap-3 pt-4">

                      <li key={index} className="text-sm">{remedy}</li>                <button className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">

                    ))}                  I'm feeling better now

                  </ul>                </button>

                  </div>                <button className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">

              )}                  This was helpful

                              </button>

              <div className="text-xs text-gray-500">                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">

                {formatTimeAgo(selectedNotification.timestamp)}                  Need more help

              </div>                </button>

            </div>              </div>

          </div>            </div>

        </div>          </div>

      )}        </div>

    </div>      )}

  )    </div>

}  )
}