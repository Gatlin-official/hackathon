import { GoogleGenerativeAI } from '@google/generative-ai';

export interface EnhancedStressAnalysis {
  // Core Analysis
  stressLevel: number; // 0-10 scale
  moodType: 'Calm' | 'Happy' | 'Stressed' | 'Anxious' | 'Angry' | 'Frustrated' | 'Sad' | 'Lonely' | 'Overwhelmed' | 'Motivated';
  intentType: 'Venting' | 'Seeking Help' | 'Sharing Information' | 'Asking for Advice' | 'Casual Chat' | 'Crisis';
  confidence: number; // 0-100%
  summary: string;
  suggestedAction: string;
  
  // Enhanced Features
  emotionConfidence: number; // Hybrid model confidence
  stressPatterns: string[]; // Detected repetitive patterns
  crisisIndicators: boolean; // Crisis mode trigger
  supportLevel: 'none' | 'peer' | 'professional' | 'emergency';
  moodHistory?: MoodPoint[]; // For tracking over time
  
  // AI Coach Features
  conversationTone: 'supportive' | 'neutral' | 'concerned' | 'urgent';
  suggestedReply?: string; // AI conversation coach suggestion
  
  // Wellness Recommendations
  wellnessActivities: WellnessActivity[];
  
  // Legacy compatibility
  stressIndicators: string[];
  emotions: string[];
  suggestions: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reason?: string;
}

export interface MoodPoint {
  timestamp: Date;
  stressLevel: number;
  moodType: string;
}

export interface WellnessActivity {
  type: 'breathing' | 'meditation' | 'exercise' | 'social' | 'creative';
  title: string;
  description: string;
  duration: string; // e.g., "5 minutes"
  urgency: 'low' | 'medium' | 'high';
}

export interface MessageContext {
  text: string;
  intention?: 'venting' | 'advice' | 'urgent' | null;
  timestamp: Date;
  userHistory?: EnhancedStressAnalysis[];
  conversationContext?: string[]; // Recent messages for context
  userProfile?: {
    stressPatterns: string[];
    preferredSupport: string[];
    riskFactors: string[];
  };
}

export class EnhancedStressAnalyzer {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private fallbackModel: any;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    console.log('Enhanced Stress Analyzer: Gemini API Key configured:', !!apiKey);
    
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      throw new Error('Gemini API key not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY in .env.local');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    
    // Primary model for detailed analysis
    this.model = this.genAI.getGenerativeModel({ 
      model: 'models/gemini-2.5-flash',
      generationConfig: {
        temperature: 0.6, // Slightly lower for more consistent responses
        topP: 0.85,
        topK: 40,
        maxOutputTokens: 2048, // Increased for detailed responses
      }
    });
    
    // Fallback model with different settings for quick analysis
    this.fallbackModel = this.genAI.getGenerativeModel({
      model: 'models/gemini-2.5-flash',
      generationConfig: {
        temperature: 0.4,
        topP: 0.7,
        maxOutputTokens: 1024,
      }
    });
    
    console.log('Enhanced Stress Analyzer initialized successfully');
  }

  async analyzeStress(context: MessageContext): Promise<EnhancedStressAnalysis> {
    try {
      console.log('🧠 Starting enhanced stress analysis for:', context.text.substring(0, 50));
      
      // First, check for crisis indicators
      const crisisCheck = this.detectCrisisIndicators(context.text);
      
      // Use enhanced prompt with context
      const prompt = this.buildEnhancedPrompt(context);
      console.log('📝 Generated enhanced prompt length:', prompt.length);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      console.log('🤖 Primary AI response received, length:', responseText.length);
      
      let analysis = this.parseEnhancedResponse(responseText);
      
      // Apply crisis detection override
      if (crisisCheck.isCrisis) {
        analysis = this.applyCrisisOverride(analysis, crisisCheck);
      }
      
      // Add conversation coaching
      analysis.suggestedReply = await this.generateConversationCoach(context, analysis);
      
      // Add wellness recommendations
      analysis.wellnessActivities = this.generateWellnessActivities(analysis);
      
      // Calculate hybrid confidence
      analysis.emotionConfidence = this.calculateHybridConfidence(context, analysis);
      
      // Detect stress patterns
      analysis.stressPatterns = this.detectStressPatterns(context, analysis);
      
      console.log('✅ Enhanced analysis completed:', {
        stress: analysis.stressLevel,
        mood: analysis.moodType,
        crisis: analysis.crisisIndicators,
        support: analysis.supportLevel
      });
      
      return analysis;
      
    } catch (error) {
      console.error('❌ Enhanced stress analysis failed:', error);
      
      // Try fallback model
      try {
        console.log('🔄 Attempting fallback analysis...');
        const fallbackPrompt = this.buildSimplePrompt(context.text);
        const fallbackResult = await this.fallbackModel.generateContent(fallbackPrompt);
        const fallbackResponse = await fallbackResult.response;
        
        return this.parseEnhancedResponse(fallbackResponse.text(), true);
      } catch (fallbackError) {
        console.error('❌ Fallback analysis also failed:', fallbackError);
        return this.getEnhancedFallback(context.text);
      }
    }
  }

  private buildEnhancedPrompt(context: MessageContext): string {
    const intentionContext = context.intention 
      ? `User marked this as: "${context.intention}".` 
      : '';

    const historyContext = context.userHistory?.length 
      ? `Recent stress history: ${context.userHistory.slice(-5).map(h => `${h.stressLevel}(${h.moodType})`).join(', ')}` 
      : '';

    const conversationContext = context.conversationContext?.length
      ? `Recent conversation: ${context.conversationContext.slice(-3).join(' → ')}`
      : '';

    const profileContext = context.userProfile 
      ? `User patterns: ${context.userProfile.stressPatterns.join(', ')}`
      : '';

    return `You are an advanced AI emotional intelligence system integrated into a student mental health platform. 
Your role is to provide comprehensive emotional analysis with crisis detection and personalized support recommendations.

CONTEXT:
${intentionContext}
${historyContext} 
${conversationContext}
${profileContext}

ANALYSIS FRAMEWORK:
1. **Stress Level (0–10)**: 0=completely calm, 3=mild concern, 6=significant stress, 8=severe distress, 10=crisis state
2. **Mood Type**: Calm, Happy, Stressed, Anxious, Angry, Frustrated, Sad, Lonely, Overwhelmed, Motivated
3. **Intent Type**: Venting, Seeking Help, Sharing Information, Asking for Advice, Casual Chat, Crisis
4. **Support Level**: none, peer, professional, emergency
5. **Conversation Tone**: supportive, neutral, concerned, urgent
6. **Crisis Indicators**: Look for suicide ideation, self-harm, extreme hopelessness, severe depression
7. **Stress Patterns**: Identify repetitive concerning phrases or themes

CRISIS DETECTION PRIORITY:
- Any mention of self-harm, suicide, or "wanting to die" = IMMEDIATE CRISIS
- Expressions of complete hopelessness or "no way out" = HIGH RISK
- Severe emotional breakdown language = ELEVATED CONCERN

RESPONSE FORMAT (strict JSON):
{
  "stress_level": number,
  "mood_type": "string",
  "intent_type": "string", 
  "confidence": number,
  "summary": "string",
  "suggested_action": "string",
  "support_level": "string",
  "conversation_tone": "string",
  "crisis_indicators": boolean,
  "stress_patterns": ["array of patterns"],
  "emotional_keywords": ["key emotional words found"]
}

ANALYZE THIS MESSAGE:
"${context.text}"

Consider the full emotional context, previous patterns, and provide actionable, empathetic recommendations.`;
  }

  private buildSimplePrompt(text: string): string {
    return `Analyze this message for stress and emotion. Return JSON with stress_level (0-10), mood_type, and summary:
"${text}"`;
  }

  private parseEnhancedResponse(responseText: string, isFallback = false): EnhancedStressAnalysis {
    try {
      console.log('🔍 Parsing enhanced AI response...');
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      const result: EnhancedStressAnalysis = {
        // Core analysis
        stressLevel: Math.max(0, Math.min(10, parsed.stress_level || 0)),
        moodType: parsed.mood_type || 'Calm',
        intentType: parsed.intent_type || 'Casual Chat',
        confidence: Math.max(0, Math.min(100, parsed.confidence || 50)),
        summary: parsed.summary || 'Message analysis completed',
        suggestedAction: parsed.suggested_action || 'Continue with positive engagement',
        
        // Enhanced features
        emotionConfidence: isFallback ? 40 : 75,
        stressPatterns: parsed.stress_patterns || [],
        crisisIndicators: parsed.crisis_indicators || false,
        supportLevel: parsed.support_level || 'none',
        conversationTone: parsed.conversation_tone || 'neutral',
        wellnessActivities: [], // Will be filled later
        
        // Legacy compatibility
        stressIndicators: parsed.emotional_keywords || [],
        emotions: [parsed.mood_type?.toLowerCase() || 'neutral'],
        suggestions: [parsed.suggested_action || 'Stay positive'],
        riskLevel: this.determineRiskLevel(parsed.stress_level || 0),
        reason: parsed.summary || 'Enhanced AI analysis'
      };
      
      console.log('✅ Successfully parsed enhanced response');
      return result;
      
    } catch (error) {
      console.error('❌ Failed to parse enhanced response:', error);
      return this.getEnhancedFallback(responseText);
    }
  }

  private detectCrisisIndicators(text: string): { isCrisis: boolean; severity: number; indicators: string[] } {
    const lowerText = text.toLowerCase();
    let severity = 0;
    const indicators: string[] = [];
    
    // CRITICAL indicators (immediate intervention)
    const criticalPatterns = [
      /\b(want to die|wanna die|wish I was dead)\b/,
      /\b(kill myself|end my life|suicide)\b/,
      /\b(better off dead|not worth living)\b/,
      /\b(end it all|can't go on)\b/
    ];
    
    criticalPatterns.forEach(pattern => {
      if (pattern.test(lowerText)) {
        severity += 10;
        indicators.push('Critical self-harm language detected');
      }
    });
    
    // HIGH RISK indicators
    const highRiskPatterns = [
      /\b(completely hopeless|no way out|nothing left)\b/,
      /\b(everyone hates me|nobody cares|alone forever)\b/,
      /\b(can't take it anymore|breaking down completely)\b/
    ];
    
    highRiskPatterns.forEach(pattern => {
      if (pattern.test(lowerText)) {
        severity += 5;
        indicators.push('High risk emotional distress');
      }
    });
    
    return {
      isCrisis: severity >= 5,
      severity,
      indicators
    };
  }

  private applyCrisisOverride(analysis: EnhancedStressAnalysis, crisisCheck: any): EnhancedStressAnalysis {
    return {
      ...analysis,
      stressLevel: Math.max(analysis.stressLevel, 8),
      intentType: 'Crisis',
      crisisIndicators: true,
      supportLevel: 'emergency',
      conversationTone: 'urgent',
      suggestedAction: '🚨 IMMEDIATE SUPPORT NEEDED: Please reach out to a counselor, trusted friend, or crisis hotline right away. You matter and help is available.',
      stressPatterns: [...analysis.stressPatterns, ...crisisCheck.indicators]
    };
  }

  private async generateConversationCoach(context: MessageContext, analysis: EnhancedStressAnalysis): Promise<string> {
    if (analysis.crisisIndicators) {
      return "Please prioritize your safety and reach out for immediate support. I'm here to listen.";
    }

    const coachingPrompts = {
      'Overwhelmed': "I can hear that you're feeling really overwhelmed right now. That's completely valid.",
      'Anxious': "It sounds like you're experiencing some anxiety. Would you like to talk through what's on your mind?",
      'Sad': "I'm sorry you're going through a difficult time. Your feelings are important.",
      'Angry': "I can sense your frustration. Sometimes it helps to express what's bothering you.",
      'Lonely': "Feeling alone can be really hard. You're not actually alone - this community is here for you."
    };

    return coachingPrompts[analysis.moodType as keyof typeof coachingPrompts] || 
           "Thank you for sharing. How are you feeling right now?";
  }

  private generateWellnessActivities(analysis: EnhancedStressAnalysis): WellnessActivity[] {
    const activities: WellnessActivity[] = [];
    
    // Base activities for everyone
    if (analysis.stressLevel >= 6) {
      activities.push({
        type: 'breathing',
        title: '5-Minute Breathing Exercise',
        description: 'Deep breathing to reduce immediate stress',
        duration: '5 minutes',
        urgency: 'high'
      });
    }
    
    // Mood-specific activities
    switch (analysis.moodType) {
      case 'Anxious':
        activities.push({
          type: 'meditation',
          title: 'Anxiety Relief Meditation',
          description: 'Guided meditation for calming anxious thoughts',
          duration: '10 minutes',
          urgency: 'medium'
        });
        break;
        
      case 'Lonely':
        activities.push({
          type: 'social',
          title: 'Connect with Community',
          description: 'Join a support group or reach out to a friend',
          duration: '30 minutes',
          urgency: 'medium'
        });
        break;
        
      case 'Overwhelmed':
        activities.push({
          type: 'creative',
          title: 'Stress Release Journaling',
          description: 'Write down your thoughts to clear your mind',
          duration: '15 minutes',
          urgency: 'high'
        });
        break;
    }
    
    return activities;
  }

  private calculateHybridConfidence(context: MessageContext, analysis: EnhancedStressAnalysis): number {
    let confidence = analysis.confidence || 50;
    
    // Boost confidence with context
    if (context.userHistory?.length) confidence += 10;
    if (context.conversationContext?.length) confidence += 5;
    if (context.text.length > 50) confidence += 5;
    
    // Reduce confidence for ambiguous cases
    if (analysis.stressLevel === 5) confidence -= 10; // Middle values are often uncertain
    
    return Math.max(0, Math.min(100, confidence));
  }

  private detectStressPatterns(context: MessageContext, analysis: EnhancedStressAnalysis): string[] {
    const patterns: string[] = [];
    
    if (context.userHistory?.length) {
      const recentStressLevels = context.userHistory.slice(-5).map(h => h.stressLevel);
      const avgStress = recentStressLevels.reduce((a, b) => a + b, 0) / recentStressLevels.length;
      
      if (avgStress > 6) {
        patterns.push('Sustained high stress levels');
      }
      
      if (recentStressLevels.every(level => level > 5)) {
        patterns.push('Consistently elevated stress');
      }
    }
    
    // Text pattern detection
    const text = context.text.toLowerCase();
    if (text.includes('always') && (text.includes('stress') || text.includes('worry'))) {
      patterns.push('Absolute thinking about stress');
    }
    
    return patterns;
  }

  private determineRiskLevel(stressLevel: number): 'low' | 'medium' | 'high' | 'critical' {
    if (stressLevel >= 8) return 'critical';
    if (stressLevel >= 6) return 'high';
    if (stressLevel >= 4) return 'medium';
    return 'low';
  }

  private getEnhancedFallback(text: string): EnhancedStressAnalysis {
    const basic = this.basicTextAnalysis(text);
    
    return {
      stressLevel: basic.stressLevel,
      moodType: basic.moodType,
      intentType: 'Casual Chat',
      confidence: 30,
      summary: 'Basic text analysis (AI unavailable)',
      suggestedAction: 'Continue your conversation',
      emotionConfidence: 30,
      stressPatterns: [],
      crisisIndicators: basic.stressLevel >= 8,
      supportLevel: basic.stressLevel >= 6 ? 'peer' : 'none',
      conversationTone: basic.stressLevel >= 7 ? 'concerned' : 'neutral',
      wellnessActivities: [],
      stressIndicators: [basic.moodType.toLowerCase()],
      emotions: [basic.moodType.toLowerCase()],
      suggestions: ['Take care of yourself'],
      riskLevel: this.determineRiskLevel(basic.stressLevel),
      reason: 'Fallback analysis'
    };
  }

  private basicTextAnalysis(text: string): { stressLevel: number; moodType: any } {
    const lower = text.toLowerCase();
    let stress = 2;
    let mood: any = 'Calm';
    
    // Crisis detection
    if (lower.includes('die') || lower.includes('suicide') || lower.includes('kill myself')) {
      return { stressLevel: 9, moodType: 'Overwhelmed' };
    }
    
    // High stress
    if (lower.includes('overwhelmed') || lower.includes('panic') || lower.includes('crisis')) {
      stress = 7;
      mood = 'Overwhelmed';
    }
    // Medium stress
    else if (lower.includes('stressed') || lower.includes('anxious') || lower.includes('worried')) {
      stress = 5;
      mood = 'Anxious';
    }
    // Positive indicators
    else if (lower.includes('happy') || lower.includes('great') || lower.includes('excited')) {
      stress = 1;
      mood = 'Happy';
    }
    
    return { stressLevel: stress, moodType: mood };
  }

  // Mood tracking for dashboard
  generateMoodHistory(analyses: EnhancedStressAnalysis[]): MoodPoint[] {
    return analyses.map(analysis => ({
      timestamp: new Date(),
      stressLevel: analysis.stressLevel,
      moodType: analysis.moodType
    }));
  }

  // Pattern alert system
  shouldTriggerPatternAlert(context: MessageContext): boolean {
    if (!context.userHistory?.length) return false;
    
    const recentAnalyses = context.userHistory.slice(-10);
    const highStressCount = recentAnalyses.filter(a => a.stressLevel >= 7).length;
    
    return highStressCount >= 3; // Alert if 3+ high stress messages in recent history
  }
}

// Singleton instance
let enhancedAnalyzer: EnhancedStressAnalyzer | null = null;

export function getEnhancedStressAnalyzer(): EnhancedStressAnalyzer {
  if (!enhancedAnalyzer) {
    enhancedAnalyzer = new EnhancedStressAnalyzer();
  }
  return enhancedAnalyzer;
}