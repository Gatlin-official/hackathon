import { NextRequest, NextResponse } from 'next/server'

// Server-side calendar service (simplified for demo)
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
  totalHours: number;
  events: CalendarEvent[];
  stressLevel: number;
}

class ServerCalendarService {
  // Generate AI-powered study plan based on stress and subject
  generateStudyPlan(subject: string, examDate: Date, currentStress: number): StudyPlan {
    const now = new Date();
    const daysUntilExam = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Adjust study intensity based on stress level
    const baseHoursPerDay = currentStress > 7 ? 2 : currentStress > 5 ? 3 : 4; // Less intense for high stress
    const totalHours = Math.min(daysUntilExam * baseHoursPerDay, 50);
    
    const events: CalendarEvent[] = [];
    
    for (let day = 0; day < daysUntilExam - 1; day++) {
      const studyDate = new Date(now);
      studyDate.setDate(now.getDate() + day);
      
      // Morning study session
      const morningStart = new Date(studyDate);
      morningStart.setHours(9, 0, 0);
      const morningEnd = new Date(morningStart);
      morningEnd.setHours(morningStart.getHours() + Math.min(baseHoursPerDay / 2, 2));
      
      events.push({
        title: `📚 ${subject} Study Session - Morning`,
        start: morningStart,
        end: morningEnd,
        description: `Focus session for ${subject}. Take breaks every 25 minutes. Stay hydrated! 💧`,
        type: 'study'
      });

      // Wellness break (mandatory for stress > 6)
      if (currentStress > 6 || day % 2 === 0) {
        const breakStart = new Date(morningEnd);
        breakStart.setHours(breakStart.getHours() + 2);
        const breakEnd = new Date(breakStart);
        breakEnd.setMinutes(breakStart.getMinutes() + 30);
        
        events.push({
          title: `🧘 Wellness Break - Stress Relief`,
          start: breakStart,
          end: breakEnd,
          description: `Mandatory stress relief: Deep breathing, short walk, or meditation. You've got this! 💪`,
          type: 'wellness'
        });
      }

      // Evening review (lighter session)
      if (daysUntilExam > 3) {
        const eveningStart = new Date(studyDate);
        eveningStart.setHours(16, 0, 0);
        const eveningEnd = new Date(eveningStart);
        eveningEnd.setHours(eveningStart.getHours() + 1);
        
        events.push({
          title: `📖 ${subject} Review - Evening`,
          start: eveningStart,
          end: eveningEnd,
          description: `Light review and practice problems. Focus on understanding, not cramming! 🎯`,
          type: 'study'
        });
      }
    }

    // Final exam day preparation
    const examDay = new Date(examDate);
    const prepStart = new Date(examDay);
    prepStart.setHours(8, 0, 0);
    const prepEnd = new Date(prepStart);
    prepEnd.setHours(9, 0, 0);
    
    events.push({
      title: `🎯 ${subject} EXAM - Final Prep`,
      start: prepStart,
      end: prepEnd,
      description: `Light review, positive affirmations, and relaxation. You're ready! 🌟`,
      type: 'exam'
    });

    return {
      subject,
      examDate,
      totalHours,
      events,
      stressLevel: currentStress
    };
  }

  // Generate wellness schedule based on stress level
  generateWellnessPlan(stressLevel: number, days: number = 7): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const now = new Date();
    
    for (let day = 0; day < days; day++) {
      const date = new Date(now);
      date.setDate(now.getDate() + day);
      
      // Morning wellness routine (high stress gets more support)
      if (stressLevel > 6) {
        const morningWellness = new Date(date);
        morningWellness.setHours(7, 30, 0);
        const morningEnd = new Date(morningWellness);
        morningEnd.setMinutes(morningWellness.getMinutes() + 15);
        
        events.push({
          title: `🌅 Morning Calm - Stress Recovery`,
          start: morningWellness,
          end: morningEnd,
          description: `Start your day peacefully: 5 min meditation + positive affirmations. You're stronger than your stress! 💪`,
          type: 'wellness'
        });
      }
      
      // Afternoon break
      const afternoonBreak = new Date(date);
      afternoonBreak.setHours(14, 0, 0);
      const afternoonEnd = new Date(afternoonBreak);
      afternoonEnd.setMinutes(afternoonBreak.getMinutes() + 20);
      
      events.push({
        title: `☀️ Midday Reset`,
        start: afternoonBreak,
        end: afternoonEnd,
        description: `Quick recharge: Step outside, stretch, or grab a healthy snack. Fresh air works wonders! 🌿`,
        type: 'wellness'
      });
      
      // Evening wind-down (essential for high stress)
      if (stressLevel > 5) {
        const eveningWellness = new Date(date);
        eveningWellness.setHours(20, 0, 0);
        const eveningEnd = new Date(eveningWellness);
        eveningEnd.setMinutes(eveningWellness.getMinutes() + 30);
        
        events.push({
          title: `🌙 Evening Unwind`,
          start: eveningWellness,
          end: eveningEnd,
          description: `Wind down routine: Journal, gentle music, or call a friend. Tomorrow is a new day! ✨`,
          type: 'wellness'
        });
      }
    }
    
    return events;
  }
}

const serverCalendarService = new ServerCalendarService();

export async function POST(request: NextRequest) {
  try {
    const { action, ...params } = await request.json()
    
    console.log('📅 Calendar API called:', action, params)
    
    let events: CalendarEvent[] = []
    
    switch (action) {
      case 'generate_study_plan':
        const { subject, examDate, stressLevel } = params
        const examDateObj = examDate ? new Date(examDate) : 
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default to 1 week from now
        
        const studyPlan = serverCalendarService.generateStudyPlan(
          subject || 'Your Subject', 
          examDateObj, 
          stressLevel || 5
        )
        events = studyPlan.events
        break
        
      case 'generate_wellness_plan':
        events = serverCalendarService.generateWellnessPlan(params.stressLevel || 5, params.days || 7)
        break
        
      case 'generate_time_management':
        // Mix of both study and wellness
        const subject2 = params.subject || 'Studies'
        const examDate2 = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
        const studyPlan2 = serverCalendarService.generateStudyPlan(subject2, examDate2, params.stressLevel || 5)
        const wellnessEvents = serverCalendarService.generateWellnessPlan(params.stressLevel || 5, 5)
        events = [...studyPlan2.events.slice(0, 6), ...wellnessEvents.slice(0, 4)]
        break
        
      case 'create_events':
        // In a real implementation, this would integrate with Google Calendar API
        // For now, we'll simulate success
        const { events: eventsToCreate } = params
        console.log('📅 Simulating calendar event creation for', eventsToCreate?.length, 'events')
        
        return NextResponse.json({
          success: true,
          message: 'Calendar events created successfully! (Simulated)',
          createdEvents: eventsToCreate?.length || 0,
          calendarUrl: 'https://calendar.google.com'
        })
        
      default:
        throw new Error('Invalid action')
    }
    
    return NextResponse.json({
      success: true,
      events: events.slice(0, 10), // Limit to first 10 events
      message: `Generated ${events.length} calendar events`
    })
    
  } catch (error) {
    console.error('Calendar API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process calendar request'
    }, { status: 500 })
  }
}