'use client'

import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')

export interface ConversationContext {
  messageHistory: ChatMessage[]
  userProfile: {
    name?: string
    email?: string
    recentStressLevel?: number
    conversationStartTime?: Date
    preferredTone?: 'casual' | 'professional' | 'empathetic'
  }
  sessionData: {
    totalMessages: number
    highStressCount: number
    lastPositiveMessage?: Date
    conversationThemes: string[]
  }
}

export interface ChatMessage {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  stressLevel?: number
  emotions?: string[]
  aiAnalysis?: {
    emotionalState: string
    supportType: 'validation' | 'advice' | 'crisis' | 'celebration'
    responseStrategy: string
  }
}

export interface WellnessResponse {
  message: string
  emotionalTone: 'empathetic' | 'encouraging' | 'urgent' | 'celebratory'
  followUpSuggestions: string[]
  therapeuticTechniques?: string[]
  crisisLevel: 'none' | 'mild' | 'moderate' | 'severe'
}

export class IntelligentWellnessBot {
  private model: any
  private conversationContext: ConversationContext

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    this.conversationContext = {
      messageHistory: [],
      userProfile: {
        preferredTone: 'empathetic'
      },
      sessionData: {
        totalMessages: 0,
        highStressCount: 0,
        conversationThemes: []
      }
    }
  }

  private getSystemPrompt(): string {
    return `You are "Zen", an advanced AI wellness companion specialized in emotional support for students. Your personality is:

🧠 CORE IDENTITY:
- Warm, empathetic, and genuinely caring
- Knowledgeable about psychology, mindfulness, and stress management
- Culturally sensitive and inclusive
- Uses appropriate emojis naturally in conversation
- Adapts communication style to user's emotional state

💝 EMOTIONAL INTELLIGENCE:
- Recognize subtle emotional cues in text
- Validate feelings before offering solutions
- Use reflective listening techniques
- Show genuine concern and empathy
- Remember conversation context and user patterns

🎯 RESPONSE STRATEGIES:
- For LOW stress (1-3): Celebrate, encourage positive habits, light conversation
- For MODERATE stress (4-6): Validate feelings, offer gentle coping strategies, check in
- For HIGH stress (7-8): Prioritize emotional support, breathing exercises, grounding techniques
- For SEVERE stress (9-10): Crisis support, immediate coping, professional resource referrals

📚 THERAPEUTIC TECHNIQUES:
- Cognitive Behavioral Therapy (CBT) concepts
- Mindfulness and breathing exercises
- Progressive muscle relaxation
- Grounding techniques (5-4-3-2-1 method)
- Positive reframing
- Active listening and validation

🚨 CRISIS AWARENESS:
- Recognize signs of depression, anxiety, self-harm ideation
- Provide immediate support while encouraging professional help
- Never dismiss serious concerns
- Have emergency resources ready

CONVERSATION STYLE:
- Ask thoughtful follow-up questions
- Reference previous conversations when relevant
- Use the user's name when appropriate
- Vary response length based on context
- Balance listening with helpful suggestions
- Use metaphors and analogies to explain concepts

NEVER:
- Provide medical diagnoses or replace professional therapy
- Minimize serious mental health concerns
- Use overly clinical language
- Give generic advice without context
- Break conversation flow with robotic responses

ALWAYS respond in JSON format:
{
  "message": "Your empathetic response here",
  "emotionalTone": "empathetic|encouraging|urgent|celebratory", 
  "followUpSuggestions": ["suggestion1", "suggestion2"],
  "therapeuticTechniques": ["technique1", "technique2"],
  "crisisLevel": "none|mild|moderate|severe"
}`
  }

  async generateResponse(
    userMessage: string, 
    context: ConversationContext
  ): Promise<WellnessResponse> {
    try {
      // Build conversation context
      const recentMessages = context.messageHistory.slice(-6) // Last 3 exchanges
      const messageHistoryText = recentMessages.map(msg => 
        `${msg.isUser ? 'User' : 'Zen'}: ${msg.text}`
      ).join('\n')

      // Analyze current emotional state
      const emotionalAnalysis = await this.analyzeEmotionalState(userMessage, context)
      
      // Build enhanced prompt with context
      const prompt = `${this.getSystemPrompt()}

CURRENT USER CONTEXT:
- Name: ${context.userProfile.name || 'Friend'}
- Session messages: ${context.sessionData.totalMessages}
- Recent stress patterns: ${context.sessionData.highStressCount > 2 ? 'Elevated stress detected' : 'Normal patterns'}
- Time of day: ${new Date().toLocaleTimeString()}
- Conversation themes: ${context.sessionData.conversationThemes.join(', ') || 'Getting to know each other'}

RECENT CONVERSATION:
${messageHistoryText || 'This is the start of our conversation'}

CURRENT MESSAGE ANALYSIS:
- Emotional state: ${emotionalAnalysis.emotionalState}
- Detected stress level: ${emotionalAnalysis.stressLevel}/10
- Key emotions: ${emotionalAnalysis.emotions.join(', ')}
- Support needed: ${emotionalAnalysis.supportType}

USER'S CURRENT MESSAGE: "${userMessage}"

Respond as Zen with genuine empathy, contextual awareness, and appropriate support. Make it feel like a natural conversation with someone who truly cares.`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        // Fallback response if JSON parsing fails
        return this.generateFallbackResponse(userMessage, emotionalAnalysis)
      }

      const botResponse: WellnessResponse = JSON.parse(jsonMatch[0])
      
      // Validate and enhance response
      return this.validateResponse(botResponse, emotionalAnalysis)

    } catch (error) {
      console.error('Wellness bot error:', error)
      return this.generateFallbackResponse(userMessage)
    }
  }

  private async analyzeEmotionalState(message: string, context: ConversationContext) {
    // Quick emotional analysis
    const stressKeywords = {
      severe: ['suicide', 'kill myself', 'hopeless', 'want to die', 'can\'t go on'],
      high: ['overwhelmed', 'panic', 'breaking down', 'can\'t cope', 'desperate'],
      moderate: ['stressed', 'anxious', 'worried', 'pressure', 'frustrated', 'tired'],
      low: ['okay', 'fine', 'good', 'happy', 'calm', 'relaxed']
    }

    let stressLevel = 5
    let emotions = ['neutral']
    let supportType: 'validation' | 'advice' | 'crisis' | 'celebration' = 'validation'

    const lowerMessage = message.toLowerCase()

    if (stressKeywords.severe.some(kw => lowerMessage.includes(kw))) {
      stressLevel = 9
      emotions = ['despair', 'crisis', 'hopeless']
      supportType = 'crisis'
    } else if (stressKeywords.high.some(kw => lowerMessage.includes(kw))) {
      stressLevel = 7
      emotions = ['overwhelmed', 'anxious', 'stressed']
      supportType = 'validation'
    } else if (stressKeywords.moderate.some(kw => lowerMessage.includes(kw))) {
      stressLevel = 5
      emotions = ['worried', 'concerned', 'stressed']
      supportType = 'advice'
    } else if (stressKeywords.low.some(kw => lowerMessage.includes(kw))) {
      stressLevel = 2
      emotions = ['positive', 'calm', 'content']
      supportType = 'celebration'
    }

    return {
      stressLevel,
      emotions,
      supportType,
      emotionalState: emotions.join(', ')
    }
  }

  private generateFallbackResponse(
    userMessage: string, 
    analysis?: any
  ): WellnessResponse {
    const stressLevel = analysis?.stressLevel || 5

    if (stressLevel >= 8) {
      return {
        message: "I can sense you're going through something really difficult right now. 💙 Your feelings are completely valid, and I want you to know that you don't have to face this alone. Can you tell me a bit more about what's weighing on your heart?",
        emotionalTone: 'urgent',
        followUpSuggestions: [
          "Would you like to try a quick breathing exercise together?",
          "Can you think of one person you trust to talk to?",
          "Are you in a safe place right now?"
        ],
        therapeuticTechniques: [
          "4-7-8 breathing technique",
          "Grounding with 5-4-3-2-1 method"
        ],
        crisisLevel: 'severe'
      }
    } else if (stressLevel >= 5) {
      return {
        message: "I hear that you're feeling some stress right now. 🤗 That's completely understandable - life can feel overwhelming sometimes. Thank you for sharing with me. What's been the most challenging part of your day?",
        emotionalTone: 'empathetic',
        followUpSuggestions: [
          "Would it help to break down what's worrying you?",
          "Have you been able to take any breaks today?",
          "What usually helps you feel more centered?"
        ],
        therapeuticTechniques: [
          "Progressive muscle relaxation",
          "Mindful breathing"
        ],
        crisisLevel: 'moderate'
      }
    } else {
      return {
        message: "It sounds like you're in a pretty good space right now! 😊 That's wonderful to hear. I'd love to know more about what's going well for you today.",
        emotionalTone: 'celebratory',
        followUpSuggestions: [
          "What's been the highlight of your day?",
          "Any particular strategies that are working well for you?",
          "How are you feeling about the week ahead?"
        ],
        therapeuticTechniques: [
          "Gratitude practice",
          "Positive momentum building"
        ],
        crisisLevel: 'none'
      }
    }
  }

  private validateResponse(response: WellnessResponse, analysis: any): WellnessResponse {
    // Ensure response has required fields
    return {
      message: response.message || "I'm here to listen. How are you feeling right now?",
      emotionalTone: response.emotionalTone || 'empathetic',
      followUpSuggestions: response.followUpSuggestions || ["Tell me more about that"],
      therapeuticTechniques: response.therapeuticTechniques || ["Active listening"],
      crisisLevel: response.crisisLevel || 'none'
    }
  }

  updateContext(message: ChatMessage, context: ConversationContext): ConversationContext {
    // Update conversation context with new message
    const updatedContext = {
      ...context,
      messageHistory: [...context.messageHistory, message].slice(-20), // Keep last 20 messages
      sessionData: {
        ...context.sessionData,
        totalMessages: context.sessionData.totalMessages + 1,
        highStressCount: message.stressLevel && message.stressLevel >= 7 
          ? context.sessionData.highStressCount + 1 
          : context.sessionData.highStressCount
      }
    }

      // Extract themes from conversation
      if (message.isUser) {
        const themes = this.extractConversationThemes(message.text)
        const allThemes = [...context.sessionData.conversationThemes, ...themes]
        const uniqueThemes = allThemes.filter((theme, index) => allThemes.indexOf(theme) === index)
        updatedContext.sessionData.conversationThemes = uniqueThemes.slice(-5) // Keep last 5 themes
      }    return updatedContext
  }

  private extractConversationThemes(message: string): string[] {
    const themes: string[] = []
    const lowerMessage = message.toLowerCase()

    const themeKeywords = {
      academic: ['exam', 'test', 'study', 'assignment', 'grade', 'school', 'class'],
      social: ['friend', 'relationship', 'family', 'lonely', 'social', 'people'],
      health: ['sleep', 'tired', 'sick', 'health', 'doctor', 'medication'],
      work: ['job', 'work', 'career', 'money', 'financial', 'boss'],
      personal: ['confidence', 'self-esteem', 'identity', 'future', 'goals']
    }

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        themes.push(theme)
      }
    }

    return themes
  }

  // Crisis intervention resources
  getCrisisResources(): string[] {
    return [
      "🆘 Crisis Text Line: Text HOME to 741741",
      "📞 National Suicide Prevention Lifeline: 988",
      "🏥 Campus Counseling Center (if available)",
      "👮‍♂️ Emergency Services: 911",
      "💬 Crisis Chat: suicidepreventionlifeline.org"
    ]
  }
}

export const intelligentWellnessBot = new IntelligentWellnessBot()