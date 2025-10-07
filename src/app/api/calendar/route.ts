import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { GoogleCalendarService } from '../../../services/google-calendar-real'

// Server-side calendar service
export interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  description: string;
  type: 'study' | 'break' | 'wellness' | 'exam' | 'assignment';
  location?: string;
}

export interface StudyPlan {
  subject: string;
  examDate?: Date;
  stressLevel: number;
  currentTopic?: string;
  timeAvailable?: number;
}

export interface WellnessPlan {
  stressLevel: number;
  activities?: string[];
  timeAvailable?: number;
  preferredTime?: string;
}

class ServerCalendarService {
  generateStudyPlan(plan: StudyPlan): CalendarEvent[] {
    const events: CalendarEvent[] = []
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    
    // Create study sessions based on stress level and available time
    const sessionsCount = plan.stressLevel > 7 ? 2 : plan.stressLevel > 4 ? 3 : 4
    const sessionDuration = plan.timeAvailable ? Math.floor(plan.timeAvailable / sessionsCount) : 90
    
    for (let i = 0; i < sessionsCount; i++) {
      const startTime = new Date(tomorrow.getTime() + (i * 2 + 9) * 60 * 60 * 1000) // Start at 9 AM, 2-hour intervals
      const endTime = new Date(startTime.getTime() + sessionDuration * 60 * 1000)
      
      events.push({
        title: `${plan.subject} Study Session ${i + 1}`,
        start: startTime,
        end: endTime,
        description: plan.currentTopic 
          ? `Focus on ${plan.currentTopic}. Break complex topics into smaller parts.`
          : `Study session for ${plan.subject}. Review notes and practice problems.`,
        type: 'study' as const,
        location: 'Study Room / Library'
      })
      
      // Add break after each session (except the last)
      if (i < sessionsCount - 1) {
        const breakStart = new Date(endTime.getTime() + 15 * 60 * 1000)
        const breakEnd = new Date(breakStart.getTime() + 15 * 60 * 1000)
        
        events.push({
          title: '☀️ Study Break',
          start: breakStart,
          end: breakEnd,
          description: 'Take a refreshing break. Stretch, hydrate, and relax your mind.',
          type: 'break' as const
        })
      }
    }
    
    return events
  }
  
  generateWellnessPlan(plan: WellnessPlan): CalendarEvent[] {
    const events: CalendarEvent[] = []
    const now = new Date()
    
    // Immediate stress relief (if high stress)
    if (plan.stressLevel > 7) {
      const immediateSession = new Date(now.getTime() + 30 * 60 * 1000) // 30 minutes from now
      events.push({
        title: '🧘 Immediate Stress Relief',
        start: immediateSession,
        end: new Date(immediateSession.getTime() + 20 * 60 * 1000),
        description: 'Deep breathing exercises, progressive muscle relaxation, or quick meditation.',
        type: 'wellness' as const,
        location: 'Quiet space'
      })
    }
    
    // Daily wellness activities for the next 3 days
    for (let day = 0; day < 3; day++) {
      const targetDay = new Date(now.getTime() + day * 24 * 60 * 60 * 1000)
      
      // Morning wellness
      const morningTime = new Date(targetDay.setHours(8, 0, 0, 0))
      events.push({
        title: '🌅 Morning Mindfulness',
        start: morningTime,
        end: new Date(morningTime.getTime() + 15 * 60 * 1000),
        description: 'Start your day with meditation, gratitude practice, or gentle stretching.',
        type: 'wellness' as const
      })
      
      // Evening wellness
      const eveningTime = new Date(targetDay.setHours(19, 0, 0, 0))
      events.push({
        title: '🌙 Evening Wind-down',
        start: eveningTime,
        end: new Date(eveningTime.getTime() + 30 * 60 * 1000),
        description: 'Relaxation techniques, journaling, or calming activities before bed.',
        type: 'wellness' as const
      })
    }
    
    return events
  }
}

const serverCalendarService = new ServerCalendarService();

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json()
    
    console.log('📅 Calendar API called:', action, params)
    
    // Get user session for real calendar integration with proper auth context
    const session = await getServerSession(authOptions) as any
    console.log('🔍 Session debug in API:', {
      hasSession: !!session,
      hasAccessToken: !!session?.accessToken,
      userEmail: session?.user?.email,
      sessionKeys: session ? Object.keys(session) : 'no session'
    })
    
    const hasRealAccess = session?.accessToken
    
    switch (action) {
      case 'generate_study_plan': {
        const events = serverCalendarService.generateStudyPlan(params as StudyPlan)
        return NextResponse.json({
          success: true,
          events,
          simulationMode: !hasRealAccess,
          message: hasRealAccess ? 'Study plan generated' : 'Study plan generated (demo mode)'
        })
      }
      
      case 'generate_wellness_plan': {
        const events = serverCalendarService.generateWellnessPlan(params as WellnessPlan)
        return NextResponse.json({
          success: true,
          events,
          simulationMode: !hasRealAccess,
          message: hasRealAccess ? 'Wellness plan generated' : 'Wellness plan generated (demo mode)'
        })
      }
      
      case 'create_events': {
        const { events } = params as { events: CalendarEvent[] }
        
        if (hasRealAccess) {
          // Real Google Calendar integration
          try {
            const calendarService = new GoogleCalendarService(session.accessToken)
            
            // Check calendar access first
            const hasAccess = await calendarService.hasCalendarAccess()
            if (!hasAccess) {
              return NextResponse.json({
                success: false,
                error: 'No calendar access. Please re-authenticate with Google Calendar permissions.',
                simulationMode: true,
                eventDetails: events.map((event, index) => ({
                  number: index + 1,
                  title: event.title,
                  date: event.start.toLocaleDateString(),
                  time: `${event.start.toLocaleTimeString()} - ${event.end.toLocaleTimeString()}`,
                  description: event.description
                }))
              })
            }
            
            // Create events in real Google Calendar
            console.log('📅 Creating events in Google Calendar:', events.length, 'events')
            const result = await calendarService.createMultipleEvents(events.map(event => ({
              title: event.title,
              start: new Date(event.start),
              end: new Date(event.end),
              description: event.description,
              location: event.location
            })))
            
            console.log('📅 Calendar creation result:', {
              success: result.success,
              createdCount: result.createdCount,
              failedCount: result.failedCount
            })
            
            if (result.success) {
              return NextResponse.json({
                success: true,
                createdEvents: result.createdCount,
                simulationMode: false,
                eventDetails: result.results.map((res, index) => ({
                  number: index + 1,
                  title: res.originalEvent.title,
                  date: res.originalEvent.start.toLocaleDateString(),
                  time: `${res.originalEvent.start.toLocaleTimeString()} - ${res.originalEvent.end.toLocaleTimeString()}`,
                  description: res.originalEvent.description || '',
                  googleLink: res.htmlLink,
                  status: res.success ? 'created' : 'failed'
                })),
                message: `Successfully created ${result.createdCount} events in your Google Calendar!`
              })
            } else {
              throw new Error(`Failed to create some events. Created: ${result.createdCount}, Failed: ${result.failedCount}`)
            }
            
          } catch (error: any) {
            console.error('Real calendar integration error:', error)
            // Fallback to simulation mode if real integration fails
            return NextResponse.json({
              success: false,
              error: error.message,
              simulationMode: true,
              createdEvents: events.length,
              eventDetails: events.map((event, index) => ({
                number: index + 1,
                title: event.title,
                date: new Date(event.start).toLocaleDateString(),
                time: `${new Date(event.start).toLocaleTimeString()} - ${new Date(event.end).toLocaleTimeString()}`,
                description: event.description
              })),
              message: 'Calendar integration error. Showing preview instead.'
            })
          }
        } else {
          // Simulation mode (no real calendar access)
          return NextResponse.json({
            success: true,
            simulationMode: true,
            createdEvents: events.length,
            eventDetails: events.map((event, index) => ({
              number: index + 1,
              title: event.title,
              date: new Date(event.start).toLocaleDateString(),
              time: `${new Date(event.start).toLocaleTimeString()} - ${new Date(event.end).toLocaleTimeString()}`,
              description: event.description
            })),
            message: `Demo Mode: Created ${events.length} events! Sign in with Google Calendar permissions for real integration.`
          })
        }
      }
      
      case 'check_access': {
        if (hasRealAccess) {
          try {
            const calendarService = new GoogleCalendarService(session.accessToken)
            const hasAccess = await calendarService.hasCalendarAccess()
            
            return NextResponse.json({
              success: true,
              hasRealAccess: hasAccess,
              simulationMode: !hasAccess,
              message: hasAccess ? 'Real Google Calendar access available' : 'Simulation mode - no calendar permissions'
            })
          } catch (error) {
            return NextResponse.json({
              success: true,
              hasRealAccess: false,
              simulationMode: true,
              message: 'Simulation mode - calendar access check failed'
            })
          }
        } else {
          return NextResponse.json({
            success: true,
            hasRealAccess: false,
            simulationMode: true,
            message: 'Simulation mode - not signed in with Google'
          })
        }
      }
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown action'
        })
    }
  } catch (error: any) {
    console.error('Calendar API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 })
  }
}