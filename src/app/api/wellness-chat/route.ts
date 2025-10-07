import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory, userProfile } = await request.json()
    
    console.log('🤖 Wellness API called with:', { message, userProfile })
    
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured')
    }

    const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' })
    
    // Build conversation context
    const recentMessages = conversationHistory?.slice(-6) || []
    const messageHistoryText = recentMessages.map((msg: any) => 
      `${msg.isUser ? 'User' : 'Zen'}: ${msg.text}`
    ).join('\n')

    // Enhanced system prompt for better responses
    const systemPrompt = `You are "Zen", an advanced AI wellness companion for students. Your personality:

🧠 CORE IDENTITY:
- Warm, empathetic, genuinely caring
- Knowledgeable about psychology and stress management  
- Uses natural emojis in conversation
- Adapts to user's emotional state and input

💝 RESPONSE GUIDELINES:
- For greetings ("hi", "hello"): Be warm and welcoming, ask how they're feeling
- For positive messages: Celebrate and encourage
- For stress/anxiety: Validate feelings, offer specific coping strategies
- For academic concerns: Provide study tips and exam stress management
- For crisis keywords: Provide immediate support and resources

🎯 ALWAYS respond in this JSON format:
{
  "message": "Your warm, contextual response here",
  "emotionalTone": "empathetic|encouraging|urgent|celebratory", 
  "followUpSuggestions": ["specific suggestion 1", "specific suggestion 2"],
  "therapeuticTechniques": ["technique 1", "technique 2"],
  "crisisLevel": "none|mild|moderate|severe"
}

Make your response specifically about their message: "${message}"`

    const prompt = `${systemPrompt}

USER PROFILE:
- Name: ${userProfile?.name || 'Friend'}
- Previous conversation themes: ${conversationHistory?.length || 0} messages

RECENT CONVERSATION:
${messageHistoryText || 'This is the start of our conversation'}

USER'S CURRENT MESSAGE: "${message}"

Respond as Zen with a personalized, contextual response that directly addresses what they said.`

    console.log('🚀 Sending to Gemini:', prompt.substring(0, 200) + '...')

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    console.log('✅ Gemini response:', text)

    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from Gemini')
    }

    const botResponse = JSON.parse(jsonMatch[0])
    
    // Validate response structure
    const validatedResponse = {
      message: botResponse.message || getContextualFallback(message),
      emotionalTone: botResponse.emotionalTone || 'empathetic',
      followUpSuggestions: Array.isArray(botResponse.followUpSuggestions) ? botResponse.followUpSuggestions : [],
      therapeuticTechniques: Array.isArray(botResponse.therapeuticTechniques) ? botResponse.therapeuticTechniques : [],
      crisisLevel: botResponse.crisisLevel || 'none'
    }

    return NextResponse.json({
      success: true,
      response: validatedResponse,
      source: 'gemini_ai'
    })

  } catch (error) {
    console.error('❌ Wellness API error:', error)
    
    // Intelligent fallback based on user input
    const { message } = await request.json().catch(() => ({ message: 'hello' }))
    const fallbackResponse = getContextualFallback(message)
    
    return NextResponse.json({
      success: true,
      response: fallbackResponse,
      source: 'intelligent_fallback',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

function getContextualFallback(message: string): any {
  const lowerMessage = message.toLowerCase()
  
  // Greetings
  if (['hi', 'hello', 'hey', 'good morning', 'good evening'].some(greeting => 
    lowerMessage.includes(greeting))) {
    return {
      message: "Hello there! 😊 I'm Zen, your wellness companion. I'm really glad you're here. How are you feeling today? I'm here to listen and support you through whatever you're experiencing.",
      emotionalTone: 'encouraging',
      followUpSuggestions: [
        "Tell me about your day so far",
        "What's on your mind right now?",
        "How has your week been going?"
      ],
      therapeuticTechniques: [
        "Take a moment to check in with yourself",
        "Notice your breathing and take three deep breaths"
      ],
      crisisLevel: 'none'
    }
  }
  
  // Positive expressions
  if (['good', 'great', 'happy', 'excited', 'awesome', 'wonderful'].some(word => 
    lowerMessage.includes(word))) {
    return {
      message: "That's wonderful to hear! 🌟 I love seeing you in such a positive space. Your energy is contagious! What's been going particularly well for you?",
      emotionalTone: 'celebratory',
      followUpSuggestions: [
        "What's been the highlight of your day?",
        "How can we keep this positive momentum going?",
        "What are you most grateful for right now?"
      ],
      therapeuticTechniques: [
        "Practice gratitude by writing down 3 good things",
        "Share this positive energy with someone you care about"
      ],
      crisisLevel: 'none'
    }
  }
  
  // Crisis keywords
  if (['suicide', 'kill myself', 'end it all', 'hang myself', 'want to die'].some(word => 
    lowerMessage.includes(word))) {
    return {
      message: "I'm really concerned about what you just shared, and I want you to know that I'm here with you right now. 💙 What you're feeling is incredibly difficult, but you don't have to face this alone. Your life has value, and there are people who want to help you through this.",
      emotionalTone: 'urgent',
      followUpSuggestions: [
        "Are you in a safe place right now?",
        "Is there someone you trust that you could reach out to?",
        "Would you like me to help you find professional support?"
      ],
      therapeuticTechniques: [
        "Crisis breathing: 4 counts in, hold 4, out 6, repeat",
        "Grounding: Name 5 things you can see right now"
      ],
      crisisLevel: 'severe'
    }
  }
  
  // Stress/anxiety
  if (['stressed', 'anxious', 'worried', 'overwhelmed', 'panic', 'pressure'].some(word => 
    lowerMessage.includes(word))) {
    return {
      message: `I can hear that you're going through a tough time right now. 🤗 Feeling ${lowerMessage.includes('overwhelmed') ? 'overwhelmed' : lowerMessage.includes('anxious') ? 'anxious' : 'stressed'} is really challenging, and I want you to know that your feelings are completely valid. What's been weighing on you the most?`,
      emotionalTone: 'empathetic',
      followUpSuggestions: [
        "Can you tell me more about what's causing this stress?",
        "What does this feeling look like in your body?",
        "Have you been able to take care of yourself today?"
      ],
      therapeuticTechniques: [
        "Box breathing technique (4-4-4-4)",
        "Progressive muscle relaxation",
        "5-4-3-2-1 grounding exercise"
      ],
      crisisLevel: 'moderate'
    }
  }
  
  // Default response
  return {
    message: "Thank you for sharing that with me. I'm here to listen and support you. Can you tell me a bit more about what's on your mind? I want to understand how you're feeling so I can be most helpful to you. 💙",
    emotionalTone: 'empathetic',
    followUpSuggestions: [
      "What's been on your mind lately?",
      "How are you feeling right now?",
      "What would be most helpful for you today?"
    ],
    therapeuticTechniques: [
      "Take a moment to breathe deeply",
      "Check in with your emotions without judgment"
    ],
    crisisLevel: 'none'
  }
}