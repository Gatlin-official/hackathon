'use client'

import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')

interface StressAnalysisResult {
  stressScore: number // 1-10 scale
  stressLevel: 'low' | 'moderate' | 'high' | 'severe'
  emotions: string[]
  intention: string
  remedies: string[]
  urgency: 'normal' | 'attention' | 'urgent'
  confidence: number
}

interface ChatContext {
  message: string
  userEmail: string
  previousMessages?: string[]
  timeOfDay?: string
  conversationContext?: string
}

export class GeminiStressAnalyzer {
  private model: any

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-pro' })
  }

  private getSystemPrompt(): string {
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

Remedies should be:
- Specific and actionable
- Age-appropriate for students
- Evidence-based stress management techniques
- Personalized to the detected emotions and situation

Consider context clues like:
- Academic pressure (exams, deadlines, assignments)
- Social issues (relationships, peer pressure)
- Personal struggles (family, health, finances)
- Time management and workload
- Emotional expressions and language patterns`
  }

  async analyzeStress(context: ChatContext): Promise<StressAnalysisResult> {
    try {
      const prompt = `${this.getSystemPrompt()}

Message to analyze: "${context.message}"
User context: Student (${context.userEmail})
Time: ${context.timeOfDay || new Date().toLocaleTimeString()}
${context.conversationContext ? `Conversation context: ${context.conversationContext}` : ''}
${context.previousMessages ? `Recent messages: ${context.previousMessages.join(', ')}` : ''}

Provide your analysis:`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Invalid response format from Gemini')
      }

      const analysis: StressAnalysisResult = JSON.parse(jsonMatch[0])
      
      // Validate and sanitize the response
      return this.validateAnalysis(analysis)

    } catch (error) {
      console.error('Gemini stress analysis error:', error)
      
      // Fallback analysis using keyword detection
      return this.fallbackAnalysis(context.message)
    }
  }

  private validateAnalysis(analysis: any): StressAnalysisResult {
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

  private fallbackAnalysis(message: string): StressAnalysisResult {
    const lowerMessage = message.toLowerCase()
    
    // Stress indicators
    const highStressKeywords = [
      'panic', 'overwhelmed', 'can\'t cope', 'breaking down', 'crisis',
      'suicide', 'kill myself', 'end it all', 'hopeless', 'desperate'
    ]
    
    const moderateStressKeywords = [
      'stressed', 'anxious', 'worried', 'scared', 'pressure', 'deadline',
      'exam', 'assignment', 'confused', 'frustrated', 'tired', 'exhausted'
    ]

    const lowStressKeywords = [
      'calm', 'fine', 'okay', 'good', 'happy', 'excited', 'relaxed', 'peaceful'
    ]

    let stressScore = 5 // Default moderate

    if (highStressKeywords.some(keyword => lowerMessage.includes(keyword))) {
      stressScore = 8
    } else if (moderateStressKeywords.some(keyword => lowerMessage.includes(keyword))) {
      stressScore = 6
    } else if (lowStressKeywords.some(keyword => lowerMessage.includes(keyword))) {
      stressScore = 3
    }

    return {
      stressScore,
      stressLevel: stressScore >= 7 ? 'high' : stressScore >= 5 ? 'moderate' : 'low',
      emotions: ['uncertain'],
      intention: 'expressing feelings',
      remedies: [
        'Practice the 4-7-8 breathing technique',
        'Take a 10-minute walk outside',
        'Listen to calming music or sounds',
        'Reach out to a friend or counselor'
      ],
      urgency: stressScore >= 8 ? 'urgent' : 'normal',
      confidence: 60
    }
  }

  // Generate personalized remedies based on specific stress triggers
  generatePersonalizedRemedies(analysis: StressAnalysisResult, userContext?: any): string[] {
    const baseRemedies = analysis.remedies
    const personalizedRemedies: string[] = []

    // Academic stress remedies
    if (analysis.intention.toLowerCase().includes('academic') || 
        analysis.emotions.some(e => ['overwhelmed', 'pressure'].includes(e.toLowerCase()))) {
      personalizedRemedies.push(
        'Break large tasks into smaller, manageable chunks',
        'Use the Pomodoro Technique (25min work, 5min break)',
        'Create a realistic study schedule with buffer time'
      )
    }

    // Social stress remedies
    if (analysis.emotions.some(e => ['lonely', 'isolated', 'rejected'].includes(e.toLowerCase()))) {
      personalizedRemedies.push(
        'Join a study group or student organization',
        'Reach out to one person you trust today',
        'Practice self-compassion and positive self-talk'
      )
    }

    // High stress/crisis remedies
    if (analysis.stressScore >= 8) {
      personalizedRemedies.push(
        '🚨 Consider contacting your campus counseling center',
        'Use the STOP technique: Stop, Take a breath, Observe, Proceed mindfully',
        'Practice grounding: name 5 things you see, 4 you hear, 3 you touch',
        'If thoughts of self-harm occur, contact emergency services immediately'
      )
    }

    return [...baseRemedies, ...personalizedRemedies].slice(0, 6) // Limit to 6 remedies
  }
}

export const geminiStressAnalyzer = new GeminiStressAnalyzer()