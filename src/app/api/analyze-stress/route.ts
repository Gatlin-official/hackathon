import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI with server-side API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')

interface StressAnalysisResult {
  stressScore: number // 1-10 scale
  stressLevel: 'low' | 'moderate' | 'high' | 'severe'
  emotions: string[]
  intention: string
  remedies: string[]
  urgency: 'normal' | 'attention' | 'urgent'
  confidence: number
}

interface AnalysisRequest {
  message: string
  userEmail: string
  messageId: string
  timestamp?: string
  conversationContext?: string[]
}

function getSystemPrompt(): string {
  return `You are an expert mental health AI assistant specialized in stress analysis and emotional support for students. 

Your role is to:
1. Analyze messages for stress levels on a scale of 1-10 (1=very calm, 10=extreme distress)
2. Identify emotions and intentions behind the message
3. Provide personalized remedies and coping strategies
4. Determine urgency level for intervention

Analyze the following message and respond ONLY in this JSON format:
{
  "stressScore": number (1-10),
  "stressLevel": "low" | "moderate" | "high" | "severe",
  "emotions": ["emotion1", "emotion2"],
  "intention": "brief description of what user needs",
  "remedies": ["remedy1", "remedy2", "remedy3"],
  "urgency": "normal" | "attention" | "urgent",
  "confidence": number (0-100)
}

Guidelines:
- Stress Score 1-3: low (calm, content, positive)
- Stress Score 4-6: moderate (some concern, minor stress)
- Stress Score 7-8: high (significant stress, needs support)
- Stress Score 9-10: severe (crisis level, immediate attention)

Be PRECISE and VARIED in your analysis:
- Different messages should get different stress scores (1-10)
- Remedies should be specific to the detected stress type
- Emotions should accurately reflect the message content
- Consider academic, social, personal, and health-related stress

Remedies should be:
- Specific and actionable
- Age-appropriate for students
- Evidence-based stress management techniques
- Personalized to the detected emotions and situation

Examples:
- "I'm fine, just chilling" → stressScore: 2, emotions: ["relaxed", "content"]
- "Worried about tomorrow's exam" → stressScore: 5, emotions: ["anxious", "concerned"]
- "I can't handle this anymore, everything is falling apart" → stressScore: 8, emotions: ["overwhelmed", "hopeless"]

Consider context clues like:
- Academic pressure (exams, deadlines, assignments)
- Social issues (relationships, peer pressure)
- Personal struggles (family, health, finances)
- Time management and workload
- Emotional expressions and language patterns`
}

function fallbackAnalysis(message: string): StressAnalysisResult {
  const lowerMessage = message.toLowerCase()
  
  // Enhanced keyword analysis with more variety
  const severeCrisisKeywords = [
    'suicide', 'kill myself', 'end it all', 'want to die', 'no point living'
  ]
  
  const highStressKeywords = [
    'panic', 'overwhelmed', 'can\'t cope', 'breaking down', 'crisis',
    'hopeless', 'desperate', 'falling apart', 'can\'t handle'
  ]
  
  const moderateStressKeywords = [
    'stressed', 'anxious', 'worried', 'scared', 'pressure', 'deadline',
    'exam', 'assignment', 'confused', 'frustrated', 'tired', 'exhausted',
    'nervous', 'concerned', 'struggling'
  ]

  const mildStressKeywords = [
    'bit worried', 'slightly nervous', 'little stressed', 'minor issue',
    'small problem', 'just concerned'
  ]

  const calmKeywords = [
    'calm', 'fine', 'okay', 'good', 'happy', 'excited', 'relaxed', 'peaceful',
    'great', 'awesome', 'chilling', 'content'
  ]

  let stressScore = 5 // Default
  let emotions: string[] = ['neutral']
  let urgency: 'normal' | 'attention' | 'urgent' = 'normal'

  if (severeCrisisKeywords.some(keyword => lowerMessage.includes(keyword))) {
    stressScore = 9 + Math.floor(Math.random() * 2) // 9-10
    emotions = ['desperate', 'hopeless', 'crisis']
    urgency = 'urgent'
  } else if (highStressKeywords.some(keyword => lowerMessage.includes(keyword))) {
    stressScore = 7 + Math.floor(Math.random() * 2) // 7-8
    emotions = ['overwhelmed', 'anxious', 'distressed']
    urgency = 'attention'
  } else if (moderateStressKeywords.some(keyword => lowerMessage.includes(keyword))) {
    stressScore = 4 + Math.floor(Math.random() * 3) // 4-6
    emotions = ['stressed', 'worried', 'anxious']
  } else if (mildStressKeywords.some(keyword => lowerMessage.includes(keyword))) {
    stressScore = 2 + Math.floor(Math.random() * 2) // 2-3
    emotions = ['slightly concerned', 'mildly worried']
  } else if (calmKeywords.some(keyword => lowerMessage.includes(keyword))) {
    stressScore = 1 + Math.floor(Math.random() * 2) // 1-2
    emotions = ['calm', 'relaxed', 'content']
  } else {
    // Neutral message - vary the score slightly
    stressScore = 3 + Math.floor(Math.random() * 3) // 3-5
  }

  // Generate personalized remedies based on stress level
  let remedies: string[] = []
  if (stressScore >= 9) {
    remedies = [
      '🚨 Please reach out to campus counseling services immediately',
      'Contact emergency services if you\'re having thoughts of self-harm',
      'Call a trusted friend or family member right now',
      'Practice deep breathing: inhale for 4, hold for 7, exhale for 8'
    ]
  } else if (stressScore >= 7) {
    remedies = [
      'Take a 10-15 minute break from what you\'re doing',
      'Practice progressive muscle relaxation',
      'Reach out to a friend, counselor, or support person',
      'Try the 5-4-3-2-1 grounding technique'
    ]
  } else if (stressScore >= 5) {
    remedies = [
      'Take 5 deep breaths using the 4-7-8 technique',
      'Step outside for fresh air and natural light',
      'Break large tasks into smaller, manageable steps',
      'Listen to calming music or nature sounds'
    ]
  } else if (stressScore >= 3) {
    remedies = [
      'Continue with gentle self-care practices',
      'Stay hydrated and maintain regular meals',
      'Consider light exercise or stretching',
      'Maintain good sleep hygiene'
    ]
  } else {
    remedies = [
      'Keep up the positive mindset!',
      'Continue your healthy habits',
      'Share your good energy with others',
      'Take time to appreciate this peaceful moment'
    ]
  }

  return {
    stressScore,
    stressLevel: stressScore >= 7 ? 'high' : stressScore >= 5 ? 'moderate' : stressScore >= 3 ? 'low' : 'low',
    emotions,
    intention: stressScore >= 7 ? 'seeking urgent support' : stressScore >= 5 ? 'expressing stress' : 'casual conversation',
    remedies,
    urgency,
    confidence: 75
  }
}

function validateAnalysis(analysis: any): StressAnalysisResult {
  return {
    stressScore: Math.max(1, Math.min(10, analysis.stressScore || 5)),
    stressLevel: ['low', 'moderate', 'high', 'severe'].includes(analysis.stressLevel) 
      ? analysis.stressLevel : 'moderate',
    emotions: Array.isArray(analysis.emotions) ? analysis.emotions : ['uncertain'],
    intention: analysis.intention || 'seeking support',
    remedies: Array.isArray(analysis.remedies) ? analysis.remedies : [
      'Take deep breaths and pause for a moment',
      'Consider talking to someone you trust',
      'Try some light physical activity'
    ],
    urgency: ['normal', 'attention', 'urgent'].includes(analysis.urgency) 
      ? analysis.urgency : 'normal',
    confidence: Math.max(0, Math.min(100, analysis.confidence || 75))
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json()
    const { message, userEmail, messageId, timestamp, conversationContext } = body

    if (!message || !userEmail) {
      return NextResponse.json(
        { error: 'Message and userEmail are required' },
        { status: 400 }
      )
    }

    console.log(`[Stress Analysis] Processing message from ${userEmail}: "${message.substring(0, 50)}..."`)

    try {
      // Try Gemini AI analysis first
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
      
      const prompt = `${getSystemPrompt()}

Message to analyze: "${message}"
User context: Student (${userEmail})
Time: ${timestamp || new Date().toLocaleTimeString()}
${conversationContext ? `Recent context: ${conversationContext.join(', ')}` : ''}

Provide your analysis:`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      console.log(`[Stress Analysis] Gemini response: ${text.substring(0, 100)}...`)

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from Gemini')
      }

      const analysis: StressAnalysisResult = JSON.parse(jsonMatch[0])
      const validatedAnalysis = validateAnalysis(analysis)
      
      console.log(`[Stress Analysis] Success - Score: ${validatedAnalysis.stressScore}, Level: ${validatedAnalysis.stressLevel}`)
      
      return NextResponse.json({
        success: true,
        analysis: validatedAnalysis,
        source: 'gemini_ai',
        messageId
      })

    } catch (geminiError) {
      console.error('[Stress Analysis] Gemini AI failed, using fallback:', geminiError)
      
      // Fallback to enhanced keyword analysis
      const fallbackResult = fallbackAnalysis(message)
      
      console.log(`[Stress Analysis] Fallback - Score: ${fallbackResult.stressScore}, Level: ${fallbackResult.stressLevel}`)
      
      return NextResponse.json({
        success: true,
        analysis: fallbackResult,
        source: 'fallback_analysis',
        messageId
      })
    }

  } catch (error) {
    console.error('[Stress Analysis] API Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to analyze stress',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}