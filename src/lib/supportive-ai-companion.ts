// Supportive AI Companion for Stress Notifications
// This provides enhanced emotional responses for stress notifications

export interface EmotionalResponse {
  message: string
  emotionalTone: string
  followUpSuggestions?: string[]
  therapeuticTechniques?: string[]
  crisisLevel: 'none' | 'mild' | 'moderate' | 'severe'
}

export class SupportiveAICompanion {
  private responses: Map<string, EmotionalResponse> = new Map()

  constructor() {
    // Initialize with some default responses
    this.initializeDefaultResponses()
  }

  private initializeDefaultResponses() {
    this.responses.set('stress', {
      message: "I notice you're experiencing some stress. Remember, it's completely normal to feel this way sometimes. You're doing better than you think! 💙",
      emotionalTone: "supportive",
      followUpSuggestions: [
        "Take 3 deep breaths",
        "Try a 5-minute walk",
        "Practice gentle self-talk"
      ],
      therapeuticTechniques: ["Mindfulness", "Self-Compassion"],
      crisisLevel: "mild"
    })

    this.responses.set('anxiety', {
      message: "Anxiety can feel overwhelming, but you have the strength to work through this. Let's take it one moment at a time. 🌟",
      emotionalTone: "calming",
      followUpSuggestions: [
        "Ground yourself: name 5 things you can see",
        "Focus on slow, steady breathing",
        "Remember: this feeling will pass"
      ],
      therapeuticTechniques: ["Grounding Techniques", "Mindfulness"],
      crisisLevel: "moderate"
    })

    this.responses.set('panic', {
      message: "You're safe right now. This intense feeling will pass. Let's breathe together - in for 4, hold for 4, out for 6. You've got this! 🌬️💪",
      emotionalTone: "urgent-supportive",
      followUpSuggestions: [
        "Use the 4-4-6 breathing technique",
        "Find a safe, quiet space",
        "Contact someone you trust if needed"
      ],
      therapeuticTechniques: ["Crisis Intervention", "Breathing Exercises"],
      crisisLevel: "severe"
    })
  }

  async generateSupportiveResponse(stressLevel: string, message: string): Promise<EmotionalResponse> {
    // For high stress levels, provide more intensive support
    if (stressLevel === 'high' || message.toLowerCase().includes('panic') || message.toLowerCase().includes('crisis')) {
      return this.responses.get('panic') || this.getDefaultResponse('severe')
    }
    
    if (stressLevel === 'moderate' || message.toLowerCase().includes('anxious') || message.toLowerCase().includes('worried')) {
      return this.responses.get('anxiety') || this.getDefaultResponse('moderate')
    }
    
    // Default to mild stress response
    return this.responses.get('stress') || this.getDefaultResponse('mild')
  }

  private getDefaultResponse(crisisLevel: 'none' | 'mild' | 'moderate' | 'severe'): EmotionalResponse {
    return {
      message: "I'm here to support you through this moment. You're stronger than you realize! 💙",
      emotionalTone: "supportive",
      followUpSuggestions: ["Take a moment to breathe", "Practice self-compassion"],
      therapeuticTechniques: ["Emotional Support"],
      crisisLevel
    }
  }

  getCrisisResources(): string[] {
    return [
      "🆘 **Crisis Text Line**: Text HOME to 741741",
      "📞 **National Suicide Prevention Lifeline**: 988",
      "🏥 **Emergency Services**: Call 911 if in immediate danger",
      "💬 **Campus Counseling**: Contact your school's counseling center",
      "👥 **Trusted Friend/Family**: Reach out to someone you trust"
    ]
  }
}