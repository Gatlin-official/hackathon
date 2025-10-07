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
    this.model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' })
  }

  private getSystemPrompt(): string {
    return `You are an expert mental health AI assistant specialized in stress analysis and emotional support for students. You must provide UNIQUE and PERSONALIZED analysis for each message.

CRITICAL: Never give the same stress score or remedies for different messages. Each analysis must be contextually accurate and varied.

Your role is to:
1. Analyze messages for stress levels on a scale of 1-10 (1=very calm, 10=extreme distress)
2. Identify specific emotions and intentions behind the message  
3. Provide highly personalized remedies based on the exact content
4. Determine urgency level for intervention

Analyze the following message and respond ONLY in this JSON format:
{
  "stressScore": number (1-10),
  "stressLevel": "low" | "moderate" | "high" | "severe", 
  "emotions": ["emotion1", "emotion2"],
  "intention": "specific description of what user needs",
  "remedies": ["personalized remedy1", "specific remedy2", "targeted remedy3"],
  "urgency": "normal" | "attention" | "urgent",
  "confidence": number (0-100)
}

STRESS SCORING GUIDELINES (BE PRECISE):
- Score 1-2: Very positive, happy, excited messages
- Score 3-4: Calm, neutral, or mildly concerned messages  
- Score 5-6: Moderate stress, worry, academic pressure
- Score 7-8: High stress, anxiety, feeling overwhelmed
- Score 9-10: Severe distress, crisis indicators, desperation

EMOTION DETECTION - Look for:
- Academic: frustrated, overwhelmed, pressured, anxious, determined
- Social: lonely, excited, nervous, confident, rejected, loved
- Personal: tired, angry, sad, hopeful, confused, motivated
- Crisis: desperate, hopeless, panicked, suicidal, defeated

REMEDY PERSONALIZATION - Base remedies on:
- Specific stress triggers mentioned (exams, relationships, deadlines)
- Emotional state detected (anxiety vs sadness vs overwhelm)  
- Context clues (time pressure, social issues, academic struggles)
- Severity level (mild vs severe interventions)

Example personalized remedies:
- For exam stress: "Try the 2-minute rule: study topics for 2 minutes each to build momentum"
- For social anxiety: "Practice one small social interaction today, like saying hi to a classmate"
- For overwhelm: "Write down 3 most urgent tasks and tackle just one right now"
- For sadness: "Allow yourself to feel this emotion for 10 minutes, then do one self-care activity"`
  }

  async analyzeStress(context: ChatContext): Promise<StressAnalysisResult> {
    try {
      // Add randomization to prevent cached responses
      const analysisId = Math.random().toString(36).substring(2, 15)
      const currentTime = new Date().toISOString()
      
      // Enhanced prompt with more context for personalization
      const prompt = `${this.getSystemPrompt()}

ANALYSIS ID: ${analysisId}
TIMESTAMP: ${currentTime}

MESSAGE TO ANALYZE: "${context.message}"

DETAILED CONTEXT:
- User: ${context.userEmail}
- Time of day: ${context.timeOfDay || new Date().toLocaleTimeString()}
- Day of week: ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}
- Message length: ${context.message.length} characters
- Contains questions: ${context.message.includes('?') ? 'Yes' : 'No'}
- Contains exclamations: ${context.message.includes('!') ? 'Yes' : 'No'}
- Writing style: ${this.analyzeWritingStyle(context.message)}
${context.conversationContext ? `- Conversation context: ${context.conversationContext}` : ''}
${context.previousMessages ? `- Recent messages: ${context.previousMessages.slice(-3).join(' | ')}` : ''}

IMPORTANT: This is a unique message requiring fresh analysis. Do not use generic responses. Analyze the specific content, tone, and context to provide accurate stress scoring and personalized remedies.

Provide your detailed analysis:`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      console.log('Gemini AI Response:', text) // Debug log

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Invalid response format from Gemini')
      }

      const analysis: StressAnalysisResult = JSON.parse(jsonMatch[0])
      
      // Validate and enhance the response
      const validatedAnalysis = this.validateAnalysis(analysis)
      
      // Add personalized remedies based on analysis
      validatedAnalysis.remedies = this.generatePersonalizedRemedies(validatedAnalysis, context)
      
      console.log('Final Analysis Result:', validatedAnalysis) // Debug log
      
      return validatedAnalysis

    } catch (error) {
      console.error('Gemini stress analysis error:', error)
      
      // Enhanced fallback analysis
      return this.fallbackAnalysis(context.message, context)
    }
  }

  private analyzeWritingStyle(message: string): string {
    const styles = []
    
    if (message.length > 100) styles.push('detailed')
    else if (message.length < 20) styles.push('brief')
    
    if (message.includes('...')) styles.push('hesitant')
    if (message.match(/[A-Z]{2,}/)) styles.push('emphatic')
    if (message.match(/😭|😰|😱|💔/)) styles.push('distressed-emojis')
    if (message.match(/😊|😄|🙂|❤️/)) styles.push('positive-emojis')
    if (message.includes('help') || message.includes('please')) styles.push('seeking-support')
    
    return styles.length > 0 ? styles.join(', ') : 'neutral'
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

  private fallbackAnalysis(message: string, context?: ChatContext): StressAnalysisResult {
    const lowerMessage = message.toLowerCase()
    
    // Enhanced stress indicators with more precise scoring
    const severeStressKeywords = [
      'suicide', 'kill myself', 'end it all', 'want to die', 'hopeless', 'worthless',
      'hang myself', 'die', 'death', 'killing', 'suicidal'
    ]
    
    const highStressKeywords = [
      'panic', 'overwhelmed', 'can\'t cope', 'breaking down', 'crisis', 'desperate',
      'falling apart', 'can\'t handle', 'too much', 'extremely stressed', 'breakdown'
    ]
    
    const moderateStressKeywords = [
      'stressed', 'anxious', 'worried', 'scared', 'pressure', 'deadline',
      'exam', 'assignment', 'confused', 'frustrated', 'nervous'
    ]

    const mildStressKeywords = [
      'tired', 'exhausted', 'busy', 'concerned', 'unsure', 'bothered'
    ]

    const lowStressKeywords = [
      'calm', 'fine', 'okay', 'good', 'happy', 'excited', 'relaxed', 'peaceful',
      'great', 'awesome', 'love', 'amazing'
    ]

    // Dynamic scoring based on multiple factors
    let baseScore = 5
    let emotions = ['neutral']
    let intention = 'general communication'
    
    console.log(`🔍 Fallback Analysis - Checking message: "${message}"`)
    console.log(`🔍 Severe keywords check:`, severeStressKeywords.some(keyword => lowerMessage.includes(keyword)))
    
    // Keyword-based scoring with variability
    if (severeStressKeywords.some(keyword => lowerMessage.includes(keyword))) {
      baseScore = 9 + Math.floor(Math.random() * 2) // 9-10
      emotions = ['despair', 'hopeless', 'crisis']
      intention = 'urgent help needed'
      console.log(`🚨 SEVERE stress detected! Score: ${baseScore}`)
    } else if (highStressKeywords.some(keyword => lowerMessage.includes(keyword))) {
      baseScore = 7 + Math.floor(Math.random() * 2) // 7-8  
      emotions = ['overwhelmed', 'panicked', 'desperate']
      intention = 'seeking immediate support'
    } else if (moderateStressKeywords.some(keyword => lowerMessage.includes(keyword))) {
      baseScore = 5 + Math.floor(Math.random() * 2) // 5-6
      emotions = ['anxious', 'worried', 'stressed']
      intention = 'expressing concerns'
    } else if (mildStressKeywords.some(keyword => lowerMessage.includes(keyword))) {
      baseScore = 3 + Math.floor(Math.random() * 2) // 3-4
      emotions = ['tired', 'mild_concern']
      intention = 'sharing feelings'
    } else if (lowStressKeywords.some(keyword => lowerMessage.includes(keyword))) {
      baseScore = 1 + Math.floor(Math.random() * 2) // 1-2
      emotions = ['happy', 'calm', 'positive']
      intention = 'sharing positive feelings'
    }

    // Adjust score based on message characteristics
    if (message.includes('!')) baseScore += 1 // Exclamation adds intensity
    if (message.includes('?')) baseScore += 0.5 // Questions show uncertainty
    if (message.length > 100) baseScore += 0.5 // Long messages show more concern
    if (/[A-Z]{3,}/.test(message)) baseScore += 1 // CAPS indicate stress

    const finalScore = Math.max(1, Math.min(10, Math.round(baseScore)))

    // Generate contextual remedies based on stress level and content
    const remedies = this.generateContextualRemedies(finalScore, emotions, message)

    return {
      stressScore: finalScore,
      stressLevel: finalScore >= 8 ? 'severe' : finalScore >= 6 ? 'high' : finalScore >= 4 ? 'moderate' : 'low',
      emotions,
      intention,
      remedies,
      urgency: finalScore >= 8 ? 'urgent' : finalScore >= 6 ? 'attention' : 'normal',
      confidence: 75
    }
  }

  private generateContextualRemedies(stressScore: number, emotions: string[], message: string): string[] {
    const remedies: string[] = []
    const lowerMessage = message.toLowerCase()

    // High stress remedies (7-10)
    if (stressScore >= 7) {
      remedies.push('🚨 Take immediate action: Use the STOP technique (Stop, Take a breath, Observe, Proceed)')
      
      if (lowerMessage.includes('exam') || lowerMessage.includes('test')) {
        remedies.push('Break study material into 15-minute focused sessions')
        remedies.push('Create a realistic study timeline with breaks')
      }
      
      if (emotions.includes('overwhelmed') || emotions.includes('panicked')) {
        remedies.push('Practice box breathing: 4 counts in, hold 4, out 4, hold 4')
        remedies.push('Ground yourself: name 5 things you see, 4 you hear, 3 you touch')
      }
      
      remedies.push('Consider reaching out to campus counseling services')
    }
    
    // Moderate stress remedies (4-6)
    else if (stressScore >= 4) {
      if (lowerMessage.includes('deadline') || lowerMessage.includes('assignment')) {
        remedies.push('Use the 2-minute rule: if a task takes less than 2 minutes, do it now')
        remedies.push('Break your assignment into 3 smaller, manageable parts')
      }
      
      if (emotions.includes('anxious') || emotions.includes('worried')) {
        remedies.push('Try progressive muscle relaxation: tense and release each muscle group')
        remedies.push('Write down your worries, then write one action step for each')
      }
      
      remedies.push('Take a 10-minute walk outside or do light stretching')
      remedies.push('Listen to calming music or nature sounds')
    }
    
    // Low stress supportive remedies (1-3)  
    else {
      if (emotions.includes('happy') || emotions.includes('positive')) {
        remedies.push('Keep up the positive momentum with gratitude journaling')
        remedies.push('Share your good mood by reaching out to a friend')
      } else {
        remedies.push('Maintain your calm with 5 minutes of mindful breathing')
        remedies.push('Set a positive intention for the rest of your day')
      }
    }

    // Add general supportive remedies
    remedies.push('Stay hydrated and consider a healthy snack')
    remedies.push('Remember: this feeling is temporary and you have overcome challenges before')

    return remedies.slice(0, 4) // Limit to 4 most relevant remedies
  }

  // Generate personalized remedies based on specific stress triggers and context
  generatePersonalizedRemedies(analysis: StressAnalysisResult, context?: ChatContext): string[] {
    const baseRemedies = analysis.remedies || []
    const personalizedRemedies: string[] = []
    const message = context?.message?.toLowerCase() || ''

    // Academic stress remedies - more specific based on actual content
    if (message.includes('exam') || message.includes('test') || message.includes('quiz')) {
      personalizedRemedies.push(`📚 Study Strategy: Create a ${Math.floor(Math.random() * 3) + 2}-hour focused study block with 15-min breaks`)
      personalizedRemedies.push('Use active recall: close your notes and write down what you remember')
    } else if (message.includes('assignment') || message.includes('homework') || message.includes('project')) {
      personalizedRemedies.push('Break your assignment into 3 specific mini-goals and tackle one today')
      personalizedRemedies.push('Set a timer for 25 minutes and work on just one small section')
    } else if (message.includes('deadline') || message.includes('due')) {
      personalizedRemedies.push('Create a reverse timeline: work backwards from deadline to today')
      personalizedRemedies.push('Identify the most critical 20% that will give 80% of the results')
    }

    // Social stress remedies
    if (message.includes('friend') || message.includes('relationship') || message.includes('social')) {
      if (analysis.stressScore >= 6) {
        personalizedRemedies.push('Practice one small social interaction today (text, smile, or brief chat)')
        personalizedRemedies.push('Remember: most people are focused on themselves, not judging you')
      } else {
        personalizedRemedies.push('Plan one enjoyable social activity for this week')
      }
    }

    // Time-based remedies
    const hour = new Date().getHours()
    if (hour < 12) {
      personalizedRemedies.push('Start your day with 3 deep breaths and set one positive intention')
    } else if (hour > 20) {
      personalizedRemedies.push('Wind down with some calming music or light stretching before sleep')
    }

    // Emotion-specific remedies
    if (analysis.emotions.includes('overwhelmed')) {
      personalizedRemedies.push(`List just ${Math.floor(Math.random() * 3) + 3} tasks, pick the most important one, ignore the rest for now`)
    }
    if (analysis.emotions.includes('anxious')) {
      personalizedRemedies.push('Try the 5-4-3-2-1 technique: 5 things you see, 4 hear, 3 touch, 2 smell, 1 taste')
    }
    if (analysis.emotions.includes('frustrated')) {
      personalizedRemedies.push('Take 10 deep breaths, then write down exactly what\'s frustrating you')
    }

    // Crisis-level interventions
    if (analysis.stressScore >= 8) {
      personalizedRemedies.unshift('🚨 IMMEDIATE: Contact campus counseling center or crisis hotline if needed')
    }

    // Combine and limit remedies
    const allRemedies = [...baseRemedies, ...personalizedRemedies]
    const uniqueRemedies = allRemedies.filter((remedy, index) => allRemedies.indexOf(remedy) === index) // Remove duplicates
    
    return uniqueRemedies.slice(0, 5) // Limit to 5 most relevant remedies
  }
}

export const geminiStressAnalyzer = new GeminiStressAnalyzer()