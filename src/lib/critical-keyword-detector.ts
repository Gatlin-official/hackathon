'use client'

// Critical keyword detection for immediate intervention
export class CriticalKeywordDetector {
  private criticalKeywords = [
    // Self-harm indicators
    'kill myself', 'end my life', 'want to die', 'suicide', 'kill me',
    'end it all', 'better off dead', 'not worth living', 'take my life',
    
    // Crisis expressions
    'can\'t go on', 'give up', 'hopeless', 'no point', 'nothing matters',
    'everyone would be better without me', 'tired of living'
  ]

  private urgentKeywords = [
    'crisis', 'emergency', 'help me', 'desperate', 'breaking down',
    'can\'t cope', 'losing it', 'falling apart'
  ]

  detectCriticalContent(message: string): {
    isCritical: boolean
    isUrgent: boolean
    detectedKeywords: string[]
    riskLevel: 'none' | 'urgent' | 'critical'
  } {
    const lowerMessage = message.toLowerCase()
    const detectedCritical: string[] = []
    const detectedUrgent: string[] = []

    // Check for critical keywords
    this.criticalKeywords.forEach(keyword => {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        detectedCritical.push(keyword)
      }
    })

    // Check for urgent keywords
    this.urgentKeywords.forEach(keyword => {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        detectedUrgent.push(keyword)
      }
    })

    const isCritical = detectedCritical.length > 0
    const isUrgent = detectedUrgent.length > 0

    return {
      isCritical,
      isUrgent,
      detectedKeywords: [...detectedCritical, ...detectedUrgent],
      riskLevel: isCritical ? 'critical' : isUrgent ? 'urgent' : 'none'
    }
  }

  generateCrisisAlert(detectedKeywords: string[]): string {
    return `We noticed some concerning words in your message (${detectedKeywords.join(', ')}). 

🆘 **Immediate Support Available:**
• Crisis Hotline: 988 (US) or your local emergency number
• Campus Counseling: Available 24/7 for students
• Emergency Services: Call 911 if you're in immediate danger

You matter and help is available. Please reach out to someone right now.`
  }
}

export const criticalKeywordDetector = new CriticalKeywordDetector()