import { GoogleGenerativeAI } from '@google/generative-ai';

export interface StressAnalysis {
  stressLevel: number; // 0-10 scale
  stressIndicators: string[];
  emotions: string[];
  suggestions: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
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
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      throw new Error('Gemini API key not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY in .env.local');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async analyzeStress(context: MessageContext): Promise<StressAnalysis> {
    try {
      const prompt = this.buildAnalysisPrompt(context);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const rawText = response.text();
      const analysis = this.parseResponse(rawText);
      if (!analysis || (analysis.stressLevel === 3 && analysis.emotions?.includes('neutral'))) {
        // Likely fallback / bad parse (default signature) – log for debugging
        console.warn('[StressAnalyzer] Low-quality or default analysis detected. Raw response:', rawText);
      }
      
      return {
        ...analysis,
        confidence: this.calculateConfidence(context, analysis)
      } as StressAnalysis;
    } catch (error) {
      console.error('Stress analysis failed:', error);
      return this.getDefaultAnalysis();
    }
  }

  private buildAnalysisPrompt(context: MessageContext): string {
    const intentionContext = context.intention 
      ? `The user marked this message as "${context.intention}".` 
      : '';

    const historyContext = context.userHistory?.length 
      ? `User's recent stress levels: ${context.userHistory.slice(-3).map(h => h.stressLevel).join(', ')}` 
      : '';

    return `
You are a mental health AI assistant analyzing student messages for stress indicators. 
Analyze the following message and provide a JSON response:

MESSAGE: "${context.text}"
CONTEXT: ${intentionContext} ${historyContext}

Analyze for:
1. Stress level (0-10): 0=very calm, 5=moderate stress, 10=extreme distress
2. Stress indicators: specific words/phrases showing stress
3. Emotions detected: primary emotions in the message
4. Risk level: low/medium/high/critical based on urgency and severity
5. Suggestions: helpful coping strategies (max 3, brief)

Respond with valid JSON only:
{
  "stressLevel": number,
  "stressIndicators": ["indicator1", "indicator2"],
  "emotions": ["emotion1", "emotion2"],
  "riskLevel": "low|medium|high|critical",
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}

Consider:
- Academic stress: "overwhelmed", "can't handle", "failing", "deadline", "exam anxiety"
- ALL CAPS or excessive punctuation (!!! ???) may indicate high stress
- Personal stress: "anxious", "depressed", "worried", "scared", "hopeless"
- Social stress: "alone", "nobody understands", "everyone hates me"
- Urgency markers: "help", "emergency", "crisis", "can't take it anymore"
- Positive indicators: "happy", "excited", "grateful", "calm", "confident"
`;
  }

  private parseResponse(responseText: string): Partial<StressAnalysis> {
    try {
      // Strip markdown fences if present
      let cleaned = responseText.trim();
      cleaned = cleaned.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();

      // Extract first JSON object
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            stressLevel: Math.max(0, Math.min(10, parsed.stressLevel ?? 0)),
            stressIndicators: Array.isArray(parsed.stressIndicators) ? parsed.stressIndicators : [],
            emotions: Array.isArray(parsed.emotions) ? parsed.emotions : [],
            riskLevel: ['low', 'medium', 'high', 'critical'].includes(parsed.riskLevel) 
              ? parsed.riskLevel : 'low',
            suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : []
          };
        } catch (e) {
          console.warn('Primary JSON parse failed, attempting heuristic extraction:', e);
        }
      }

      // Heuristic extraction for stress level if JSON failed
      const levelRegex = /stress\s*level[^0-9]{0,10}(\d{1,2})/i;
      const levelMatch = cleaned.match(levelRegex);
      const stressLevel = levelMatch ? Math.min(10, parseInt(levelMatch[1], 10)) : 3;
      const indicators: string[] = [];
      const emotions: string[] = [];
      const suggestions: string[] = [];
      return {
        stressLevel,
        stressIndicators: indicators,
        emotions: emotions.length ? emotions : ['neutral'],
        riskLevel: stressLevel >= 8 ? 'high' : stressLevel >= 6 ? 'medium' : 'low',
        suggestions: suggestions.length ? suggestions : ['Take a short break', 'Hydrate and breathe deeply']
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return this.getDefaultAnalysis();
    }
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
      stressIndicators: [],
      emotions: ['neutral'],
      suggestions: ['Take deep breaths', 'Consider talking to someone'],
      riskLevel: 'low',
      confidence: 0.3
    };
  }

  // Quick stress check for real-time typing
  quickStressCheck(text: string): { level: number; shouldWarn: boolean } {
    const stressWords = [
      'overwhelmed', 'anxious', 'stressed', 'panic', 'crisis', 'help', 
      'can\'t handle', 'breaking down', 'hopeless', 'desperate', 'emergency'
    ];
    
    const allCapsCount = (text.match(/[A-Z]{2,}/g) || []).length;
    const exclamationCount = (text.match(/!/g) || []).length;
    const questionCount = (text.match(/\?{2,}/g) || []).length;
    
    let level = 0;
    
    // Check for stress words
    stressWords.forEach(word => {
      if (text.toLowerCase().includes(word)) level += 2;
    });
    
    // Check for excessive punctuation/caps
    if (allCapsCount > 2) level += 1;
    if (exclamationCount > 3) level += 1;
    if (questionCount > 0) level += 1;
    
    return {
      level: Math.min(10, level),
      shouldWarn: level >= 5
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