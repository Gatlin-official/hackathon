'use client'

import { X, Calendar, Clock, Check } from 'lucide-react'

interface EventDetail {
  number: number
  title: string
  date: string
  time: string
  description: string
  googleLink?: string
  status?: string
}

interface CalendarModalProps {
  isOpen: boolean
  onClose: () => void
  eventDetails: EventDetail[]
  simulationMode: boolean
}

export default function CalendarModal({ isOpen, onClose, eventDetails, simulationMode }: CalendarModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {simulationMode ? '📅 Calendar Events Created (Demo Mode)' : '📅 Calendar Events Created'}
              </h2>
              <p className="text-sm text-gray-600">
                {simulationMode ? 'Simulation mode - events preview below' : 'Events added to your Google Calendar'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Events List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {eventDetails.map((event) => (
              <div key={event.number} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                    {event.number}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{event.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{event.time}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{event.description}</p>
                    {event.googleLink && (
                      <div className="mt-2">
                        <a 
                          href={event.googleLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                        >
                          📅 View in Google Calendar
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          {simulationMode ? (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>💡 Demo Mode:</strong> These events are simulated for preview purposes. 
                  In production, they would appear in your actual Google Calendar.
                </p>
              </div>
              <div className="text-xs text-gray-600">
                <p><strong>To enable real Google Calendar integration:</strong></p>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Sign out and sign back in to grant calendar permissions</li>
                  <li>Allow access to Google Calendar when prompted</li>
                  <li>Events will then be created in your actual calendar</li>
                </ol>
                <button
                  onClick={() => window.location.href = '/api/auth/signin?callbackUrl=' + encodeURIComponent(window.location.href)}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  🔄 Re-authenticate with Calendar Access
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ Events have been successfully added to your Google Calendar! 
                Click the "View in Google Calendar" links above or check your calendar app.
              </p>
            </div>
          )}
          <button
            onClick={onClose}
            className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}