'use client'

import { useSession } from 'next-auth/react'
import { useState } from 'react'

export default function CalendarDebugPage() {
  const { data: session, status } = useSession()
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testCalendarAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_access' })
      })
      
      const result = await response.json()
      setTestResult(result)
    } catch (error: any) {
      setTestResult({ error: error.message })
    }
    setLoading(false)
  }

  const createTestEvent = async () => {
    setLoading(true)
    try {
      const testEvent = {
        title: 'Real Google Calendar Test',
        start: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
        end: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        description: 'Testing real Google Calendar integration from debug page',
        type: 'study'
      }

      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'create_events',
          events: [testEvent]
        })
      })
      
      const result = await response.json()
      setTestResult(result)
    } catch (error: any) {
      setTestResult({ error: error.message })
    }
    setLoading(false)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔧 Google Calendar Debug Page</h1>
      
      <div className="space-y-6">
        {/* Session Info */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-lg font-semibold mb-2">📱 Session Status</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Status:</strong> {status}</p>
            <p><strong>User:</strong> {session?.user?.email || 'Not signed in'}</p>
            <p><strong>Access Token:</strong> {(session as any)?.accessToken ? '✅ Present' : '❌ Missing'}</p>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="flex gap-4">
          <button
            onClick={testCalendarAPI}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : '🔍 Test Calendar Access'}
          </button>
          
          <button
            onClick={createTestEvent}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : '📅 Create Test Event'}
          </button>
        </div>

        {/* Test Results */}
        {testResult && (
          <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-semibold mb-2">🧪 Test Results</h2>
            <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Debug Info */}
        <div className="p-4 border rounded-lg bg-yellow-50">
          <h2 className="text-lg font-semibold mb-2">💡 Debugging Tips</h2>
          <ul className="text-sm space-y-1">
            <li>• Make sure you're signed in with Google (see session status above)</li>
            <li>• When signing in, grant Calendar permissions when prompted</li>
            <li>• If showing simulation mode, try signing out and signing back in</li>
            <li>• Check browser developer console for additional error messages</li>
            <li>• Real events should appear in your Google Calendar immediately</li>
          </ul>
        </div>
      </div>
    </div>
  )
}