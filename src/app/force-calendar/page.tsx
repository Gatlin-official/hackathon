'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { useState } from 'react'

export default function ForceCalendarAuth() {
  const { data: session, status } = useSession()
  const [testResult, setTestResult] = useState<any>(null)

  const forceReauth = async () => {
    // Sign out first, then sign back in with proper calendar permissions
    await signOut({ redirect: false })
    // Small delay to ensure signout completes
    setTimeout(() => {
      signIn('google', { 
        callbackUrl: window.location.origin + '/debug-calendar',
        redirect: true 
      })
    }, 100)
  }

  const testRealCalendar = async () => {
    try {
      const testEvent = {
        title: 'REAL Calendar Test - ' + new Date().toLocaleTimeString(),
        start: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
        end: new Date(Date.now() + 90 * 60 * 1000).toISOString(), // 1.5 hours from now
        description: 'This should appear in your REAL Google Calendar with alarms!',
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
      
      if (!result.simulationMode) {
        alert('✅ SUCCESS! Check your Google Calendar - the event should be there with notifications!')
      }
    } catch (error: any) {
      setTestResult({ error: error.message })
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">🚀 Force Real Google Calendar Integration</h1>
      
      <div className="space-y-6">
        {/* Current Status */}
        <div className="p-6 border rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">Current Status</h2>
          <div className="space-y-2">
            <p><strong>Authentication:</strong> {status}</p>
            <p><strong>User:</strong> {session?.user?.email || 'Not signed in'}</p>
            <p><strong>Access Token:</strong> {(session as any)?.accessToken ? '✅ Present' : '❌ Missing'}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          {!session ? (
            <button
              onClick={() => signIn('google')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg text-lg font-medium hover:bg-blue-700"
            >
              🔑 Sign In with Google Calendar Access
            </button>
          ) : (
            <>
              <button
                onClick={forceReauth}
                className="px-6 py-3 bg-red-600 text-white rounded-lg text-lg font-medium hover:bg-red-700"
              >
                🔄 Force Re-authentication (Sign Out & Back In)
              </button>
              
              <button
                onClick={testRealCalendar}
                className="px-6 py-3 bg-green-600 text-white rounded-lg text-lg font-medium hover:bg-green-700"
              >
                📅 Create REAL Calendar Event Now!
              </button>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="p-6 border rounded-lg bg-yellow-50">
          <h2 className="text-xl font-semibold mb-4">📋 Steps to Enable Real Calendar</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li className="font-medium">Click "Force Re-authentication" above</li>
            <li className="font-medium">When Google asks for permissions, make sure to:</li>
            <ul className="ml-6 mt-2 space-y-1 text-sm list-disc list-inside">
              <li>✅ Allow access to your Google Calendar</li>
              <li>✅ Allow the app to create and manage calendar events</li>
              <li>✅ Don't skip any permission requests</li>
            </ul>
            <li className="font-medium">After signing back in, click "Create REAL Calendar Event"</li>
            <li className="font-medium">Check your Google Calendar - you should see the event!</li>
          </ol>
        </div>

        {/* Test Results */}
        {testResult && (
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">🧪 Test Results</h2>
            <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto whitespace-pre-wrap">
              {JSON.stringify(testResult, null, 2)}
            </pre>
            
            {!testResult.simulationMode && testResult.success && (
              <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded">
                <p className="text-green-800 font-medium">
                  🎉 SUCCESS! Your event has been created in Google Calendar!
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Open Google Calendar on your phone or computer to see the event with notifications.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}