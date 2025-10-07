import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Sample test notifications
    const testNotifications = [
      {
        id: `test_notification_${Date.now()}_1`,
        userId: userId,
        message: 'We noticed you might be experiencing some stress. Here are some personalized suggestions to help you feel better.',
        stressScore: 6,
        stressLevel: 'moderate',
        remedies: [
          'Take 5 deep breaths and focus on your breathing',
          'Step outside for a few minutes of fresh air',
          'Listen to calming music or nature sounds',
          'Do some gentle stretching exercises'
        ],
        originalMessage: 'I feel really overwhelmed with all these assignments',
        emotions: ['anxiety', 'overwhelm', 'stress'],
        urgency: 'attention',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        isRead: false
      },
      {
        id: `test_notification_${Date.now()}_2`,
        userId: userId, 
        message: 'High stress levels detected. Please consider taking a break and trying some of these coping strategies.',
        stressScore: 8,
        stressLevel: 'high',
        remedies: [
          'Practice the 4-7-8 breathing technique',
          'Reach out to a friend or family member',
          'Try a 5-minute meditation or mindfulness exercise',
          'Consider speaking with a counselor if stress persists'
        ],
        originalMessage: 'I cant handle this anymore everything is falling apart',
        emotions: ['panic', 'despair', 'overwhelm'],
        urgency: 'urgent',
        timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        isRead: false
      },
      {
        id: `test_notification_${Date.now()}_3`,
        userId: userId,
        message: 'Great job managing your stress! Keep up the positive momentum.',
        stressScore: 2,
        stressLevel: 'low',
        remedies: [
          'Maintain your current healthy habits',
          'Stay hydrated throughout the day',
          'Continue regular sleep schedule',
          'Keep up with physical activity'
        ],
        originalMessage: 'Feeling much better today, got good sleep',
        emotions: ['contentment', 'relief'],
        urgency: 'normal',
        timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
        isRead: false
      }
    ]

    return NextResponse.json({ 
      success: true, 
      notifications: testNotifications,
      message: 'Test notifications created successfully'
    })

  } catch (error) {
    console.error('Error creating test notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create test notifications' }, 
      { status: 500 }
    )
  }
}