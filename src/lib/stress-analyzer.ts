import { GoogleGenerativeAI } from '@google/generative-ai';

export interface StressAnalysis {
  stressLevel: number; // 0-10 scale
  moodType: string; // Calm, Happy, Stressed, Anxious, Angry, Frustrated, Sad, Lonely, Overwhelmed, Motivated
  intentType: string; // Venting, Seeking Help, Sharing Information, Asking for Advice, Casual Chat
  confidence: number; // 0-100%
  summary: string; // One-sentence emotional summary
  suggestedAction: string; // Short empathetic response or recommendation
  
  // Legacy fields for backward compatibility - required to avoid undefined errors
  stressIndicators: string[];
  emotions: string[];
  suggestions: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reason?: string;
}

export interface MessageContext {
  text: string;
  intention?: 'venting' | 'advice' | 'urgent' | null;
  timestamp: Date;
  userHistory?: StressAnalysis[]; // Previous stress levels for context
}

export class StressAnalyzer {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    console.log('Gemini API Key configured:', !!apiKey);
    
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      throw new Error('Gemini API key not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY in .env.local');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'models/gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      }
    });
    console.log('Stress Analyzer initialized successfully');
  }

  async analyzeStress(context: MessageContext): Promise<StressAnalysis> {
    try {
      console.log('Starting stress analysis for:', context.text.substring(0, 50));
      
      const prompt = this.buildAnalysisPrompt(context);
      console.log('Generated prompt length:', prompt.length);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      console.log('AI response received, length:', responseText.length);
      
      const analysis = this.parseResponse(responseText);
      
      const finalResult = {
        ...analysis,
        confidence: this.calculateConfidence(context, analysis)
      } as StressAnalysis;
      
      console.log('Final analysis result:', finalResult);
      return finalResult;
    } catch (error) {
      console.error('Stress analysis failed:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      
      // Return a better fallback based on the message content
      return {
        ...this.getFallbackAnalysis(context.text),
        confidence: 0.3
      } as StressAnalysis;
    }
  }

  private buildAnalysisPrompt(context: MessageContext): string {
    const intentionContext = context.intention 
      ? `The user marked this message as "${context.intention}".` 
      : '';

    const historyContext = context.userHistory?.length 
      ? `Recent user stress levels: ${context.userHistory.slice(-3).map(h => h.stressLevel).join(', ')}` 
      : '';

    return `You are an AI assistant integrated into a student social discussion platform. 
Your job is to analyze the emotional tone and stress level in the user's message and understand the intention behind it.

${intentionContext} ${historyContext}

Analyze the message based on these categories:
1. **Stress Level (0–10)** — 0 = calm/neutral, 10 = extreme stress or emotional breakdown.
2. **Mood Type** — (choose one): Calm, Happy, Stressed, Anxious, Angry, Frustrated, Sad, Lonely, Overwhelmed, Motivated.
3. **Intent Type** — (choose one): Venting, Seeking Help, Sharing Information, Asking for Advice, Casual Chat.
4. **Confidence** — How confident you are in your analysis (0–100%).
5. **Summary** — A one-sentence emotional summary of what the user seems to be expressing.
6. **Suggested Action** — A short and empathetic response or recommendation (e.g., suggest taking a break, journaling, reaching out to a counselor, or joining a relaxation group).

Respond **strictly in this JSON format:**
{
  "stress_level": number,
  "mood_type": "string",
  "intent_type": "string",
  "confidence": number,
  "summary": "string",
  "suggested_action": "string"
}

Now analyze this message:
"${context.text}"`;
  }

  private parseResponse(responseText: string): Partial<StressAnalysis> {
    try {
      console.log('Raw AI response:', responseText); // Debug log
      
      // Clean the response to extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in AI response');
        throw new Error('No JSON found in response');
      }
      
      const cleanJson = jsonMatch[0];
      console.log('Extracted JSON:', cleanJson); // Debug log
      
      const parsed = JSON.parse(cleanJson);
      console.log('Parsed JSON:', parsed); // Debug log
      
      // Map from new JSON format to StressAnalysis interface
      const result: Partial<StressAnalysis> = {
        stressLevel: Math.max(0, Math.min(10, parsed.stress_level || 0)),
        moodType: parsed.mood_type || 'Calm',
        intentType: parsed.intent_type || 'Casual Chat',
        confidence: Math.max(0, Math.min(100, parsed.confidence || 50)),
        summary: parsed.summary || 'Message analysis completed',
        suggestedAction: parsed.suggested_action || 'Continue engaging in positive conversations',
        
        // Legacy fields for backward compatibility
        stressIndicators: [],
        emotions: [parsed.mood_type?.toLowerCase() || 'neutral'],
        suggestions: [parsed.suggested_action || 'Stay positive'],
        riskLevel: this.determineRiskLevel(parsed.stress_level || 0),
        reason: parsed.summary || 'Analysis based on message content and context'
      };
      
      console.log('Final parsed result:', result); // Debug log
      return result;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.error('Response text was:', responseText);
      return this.getFallbackAnalysis(responseText);
    }
  }

  private determineRiskLevel(stressLevel: number): 'low' | 'medium' | 'high' | 'critical' {
    if (stressLevel >= 8) return 'critical';
    if (stressLevel >= 6) return 'high';
    if (stressLevel >= 4) return 'medium';
    return 'low';
  }

  private getFallbackAnalysis(originalText: string): Partial<StressAnalysis> {
    // Create a basic analysis based on keywords if AI parsing fails
    const text = originalText.toLowerCase();
    let stressLevel = 2;
    let moodType = 'Calm';
    let intentType = 'Casual Chat';
    let summary = 'Unable to fully analyze message';
    let suggestedAction = 'Continue with your conversation';

    // High-risk keywords
    if (text.includes('die') || text.includes('kill') || text.includes('suicide')) {
      stressLevel = 9;
      moodType = 'Overwhelmed';
      intentType = 'Seeking Help';
      summary = 'Message indicates severe emotional distress';
      suggestedAction = 'Please reach out to a counselor or trusted friend immediately';
    }
    // High stress keywords  
    else if (text.includes('overwhelmed') || text.includes('panic') || text.includes('crisis')) {
      stressLevel = 7;
      moodType = 'Overwhelmed';
      intentType = 'Venting';
      summary = 'Message shows high stress and overwhelm';
      suggestedAction = 'Take a break and practice deep breathing exercises';
    }
    // Medium stress
    else if (text.includes('stressed') || text.includes('worried') || text.includes('anxious')) {
      stressLevel = 5;
      moodType = 'Anxious';
      intentType = 'Venting';
      summary = 'Message indicates moderate stress levels';
      suggestedAction = 'Consider talking to someone about what\'s bothering you';
    }

    return {
      stressLevel,
      moodType,
      intentType,
      confidence: 40, // Lower confidence for fallback
      summary,
      suggestedAction,
      
      // Legacy fields for backward compatibility
      stressIndicators: [moodType.toLowerCase()],
      emotions: [moodType.toLowerCase()],
      suggestions: [suggestedAction],
      riskLevel: this.determineRiskLevel(stressLevel),
      reason: 'Fallback analysis due to AI parsing error'
    };
  }

  private calculateConfidence(context: MessageContext, analysis: Partial<StressAnalysis>): number {
    let confidence = 0.7; // Base confidence
    
    // Higher confidence for longer messages
    if (context.text.length > 100) confidence += 0.1;
    
    // Higher confidence when intention is provided
    if (context.intention) confidence += 0.1;
    
    // Higher confidence for clear stress indicators
    if (analysis.stressIndicators && analysis.stressIndicators.length > 2) {
      confidence += 0.1;
    }
    
    return Math.min(1.0, confidence);
  }

  private getDefaultAnalysis(): StressAnalysis {
    return {
      stressLevel: 3,
      moodType: 'Calm',
      intentType: 'Casual Chat',
      confidence: 30,
      summary: 'Message appears to be neutral conversation',
      suggestedAction: 'Continue with positive engagement',
      
      // Legacy fields for backward compatibility
      stressIndicators: [],
      emotions: ['neutral'],
      suggestions: ['Take deep breaths', 'Consider talking to someone'],
      riskLevel: 'low',
      reason: 'Default analysis when AI processing fails'
    };
  }

  // Emotionally intelligent quick stress check for real-time typing
  quickStressCheck(text: string): { level: number; shouldWarn: boolean } {
    const lowerText = text.toLowerCase();
    let level = 0;
    
    // CRITICAL STRESS INDICATORS (High priority)
    const criticalWords = ['die', 'kill myself', 'suicide', 'end it all', 'not worth living', 'better off dead'];
    criticalWords.forEach(word => {
      if (lowerText.includes(word)) level += 8;
    });
    
    // HIGH STRESS INDICATORS
    const highStressWords = [
      'overwhelmed', 'can\'t handle', 'breaking down', 'crisis', 'emergency',
      'hopeless', 'desperate', 'panic', 'terrified', 'can\'t take it'
    ];
    highStressWords.forEach(word => {
      if (lowerText.includes(word)) level += 3;
    });
    
    // MODERATE STRESS INDICATORS  
    const moderateStressWords = [
      'stressed', 'anxious', 'worried', 'overwhelm', 'pressure', 'deadline',
      'failing', 'behind', 'struggling', 'tired', 'exhausted'
    ];
    moderateStressWords.forEach(word => {
      if (lowerText.includes(word)) level += 2;
    });
    
    // MILD STRESS INDICATORS
    const mildStressWords = [
      'nervous', 'concerned', 'uneasy', 'bothered', 'trouble', 'difficulty'
    ];
    mildStressWords.forEach(word => {
      if (lowerText.includes(word)) level += 1;
    });
    
    // POSITIVE INDICATORS (reduce stress level)
    const positiveWords = [
      'great', 'amazing', 'happy', 'excited', 'love', 'grateful', 'calm', 'peaceful'
    ];
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) level = Math.max(0, level - 2);
    });
    
    // Check for emotional punctuation patterns
    const allCapsCount = (text.match(/[A-Z]{3,}/g) || []).length;
    const exclamationCount = (text.match(/!+/g) || []).length;
    const questionCount = (text.match(/\?{2,}/g) || []).length;
    
    if (allCapsCount > 2) level += 2; // ALL CAPS indicates strong emotion
    if (exclamationCount > 3) level += 1;
    if (questionCount > 0) level += 1;
    
    // Final level adjustment
    const finalLevel = Math.min(10, Math.max(0, level));
    
    return {
      level: finalLevel,
      shouldWarn: finalLevel >= 6
    };
  }

  // Get stress trend over time
  getStressTrend(analyses: StressAnalysis[]): {
    trend: 'improving' | 'stable' | 'worsening';
    averageStress: number;
    peakStress: number;
  } {
    if (analyses.length < 2) {
      return { trend: 'stable', averageStress: 0, peakStress: 0 };
    }

    const stressLevels = analyses.map(a => a.stressLevel);
    const averageStress = stressLevels.reduce((sum, level) => sum + level, 0) / stressLevels.length;
    const peakStress = Math.max(...stressLevels);
    
    // Simple trend calculation
    const recent = stressLevels.slice(-3);
    const earlier = stressLevels.slice(-6, -3);
    
    if (recent.length && earlier.length) {
      const recentAvg = recent.reduce((sum, level) => sum + level, 0) / recent.length;
      const earlierAvg = earlier.reduce((sum, level) => sum + level, 0) / earlier.length;
      
      if (recentAvg < earlierAvg - 0.5) return { trend: 'improving', averageStress, peakStress };
      if (recentAvg > earlierAvg + 0.5) return { trend: 'worsening', averageStress, peakStress };
    }
    
    return { trend: 'stable', averageStress, peakStress };
  }
}

// Singleton instance for the app
let stressAnalyzer: StressAnalyzer | null = null;

export function getStressAnalyzer(): StressAnalyzer {
  if (!stressAnalyzer) {
    stressAnalyzer = new StressAnalyzer();
  }
  return stressAnalyzer;
}