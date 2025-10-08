import { google } from 'googleapis'
import { getServerSession } from 'next-auth'

export class GoogleCalendarService {
  private calendar: any

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )
    
    auth.setCredentials({ access_token: accessToken })
    this.calendar = google.calendar({ version: 'v3', auth })
  }

  async createEvent(event: {
    title: string
    start: Date
    end: Date
    description?: string
    location?: string
  }) {
    try {
      const calendarEvent = {
        summary: event.title,
        description: event.description || '',
        location: event.location || '',
        start: {
          dateTime: event.start.toISOString(),
          timeZone: 'America/New_York', // You can make this dynamic based on user preference
        },
        end: {
          dateTime: event.end.toISOString(),
          timeZone: 'America/New_York',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 15 }, // 15 minutes before
          ],
        },
      }

      console.log('📅 Creating Google Calendar event:', calendarEvent)

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: calendarEvent,
      })

      console.log('📅 Google Calendar API response:', {
        id: response.data.id,
        htmlLink: response.data.htmlLink,
        status: response.data.status
      })

      return {
        success: true,
        event: response.data,
        eventId: response.data.id,
        htmlLink: response.data.htmlLink
      }
    } catch (error: any) {
      console.error('Error creating calendar event:', error)
      return {
        success: false,
        error: error.message || 'Failed to create calendar event'
      }
    }
  }

  async createMultipleEvents(events: Array<{
    title: string
    start: Date
    end: Date
    description?: string
    location?: string
  }>) {
    const results = []
    
    for (const event of events) {
      const result = await this.createEvent(event)
      results.push({
        ...result,
        originalEvent: event
      })
    }

    return {
      success: results.every(r => r.success),
      results,
      createdCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length
    }
  }

  async listCalendars() {
    try {
      const response = await this.calendar.calendarList.list()
      return {
        success: true,
        calendars: response.data.items
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to list calendars'
      }
    }
  }

  // Helper method to check if user has calendar access
  async hasCalendarAccess() {
    try {
      console.log('🔍 Testing Google Calendar API access...')
      const response = await this.calendar.calendarList.list({ maxResults: 1 })
      console.log('✅ Calendar API test successful:', response.data ? 'Got calendars' : 'No calendars but API works')
      return true
    } catch (error: any) {
      console.error('❌ Calendar API test failed:', {
        message: error.message,
        code: error.code,
        status: error.status
      })
      return false
    }
  }
}

// Server-side helper to get calendar service from session
export async function getCalendarService(req?: any) {
  const session = await getServerSession(req) as any
  
  console.log('🔍 Session debug:', {
    hasSession: !!session,
    hasAccessToken: !!session?.accessToken,
    userEmail: session?.user?.email
  })
  
  if (!session?.accessToken) {
    throw new Error('No access token available. Please sign in with Google Calendar permissions.')
  }

  return new GoogleCalendarService(session.accessToken)
}