import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ComprehensiveStressAnalysis {
  message_id: string;
  stress_score: number;
  ai_advice: string;
}

export interface MessageForAnalysis {
  id: string;
  text: string;
  userEmail: string;
  timestamp: Date;
}

export class ComprehensiveStressAnalyzer {
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

  async analyzeMessage(message: MessageForAnalysis): Promise<ComprehensiveStressAnalysis> {
    try {
      const systemPrompt = `You are an AI system tasked with analyzing student forum messages for stress levels and providing support.

For each message text you receive:
1. Analyze the text and assign a **stress score from 0 to 10** (0 = no stress, 10 = extremely stressed).
2. If the stress score is greater than 5:
   - Generate a **short, empathetic, and actionable advice message** that the student can follow to relieve stress.
   - Include practical suggestions, mental health tips, or resources relevant to students.
3. If the stress score is 5 or below:
   - Return only the stress score.

Format the output as JSON:
{
  "message_id": "<message_id>",
  "stress_score": <numeric_score>,
  "ai_advice": "<advice_or_empty_if_score_≤5>"
}

Be concise, supportive, and empathetic. Do not provide generic advice—make it student-friendly.

Message to analyze: "${message.text}"
Message ID: "${message.id}"`;

      const result = await this.model.generateContent(systemPrompt);
      const response = await result.response;
      const responseText = response.text();
      
      // Parse the JSON response
      const analysis = this.parseResponse(responseText, message.id);
      return analysis;
    } catch (error) {
      console.error('Comprehensive stress analysis failed:', error);
      return this.getDefaultAnalysis(message.id);
    }
  }

  private parseResponse(responseText: string, messageId: string): ComprehensiveStressAnalysis {
    try {
      // Clean the response text and try to extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          message_id: messageId,
          stress_score: Math.max(0, Math.min(10, parsed.stress_score || 0)),
          ai_advice: parsed.ai_advice || (parsed.stress_score > 5 ? "Take a moment to breathe deeply and consider reaching out to a counselor or trusted friend for support." : "")
        };
      }
      
      // Fallback parsing
      const stressMatch = responseText.match(/stress[_\s]*score[:\s]*(\d+(?:\.\d+)?)/i);
      const adviceMatch = responseText.match(/ai[_\s]*advice[:\s]*"([^"]+)"/i);
      
      const stressScore = stressMatch ? parseFloat(stressMatch[1]) : 0;
      const aiAdvice = adviceMatch ? adviceMatch[1] : (stressScore > 5 ? "Consider taking some time to relax and practice self-care." : "");
      
      return {
        message_id: messageId,
        stress_score: Math.max(0, Math.min(10, stressScore)),
        ai_advice: aiAdvice
      };
    } catch (error) {
      console.error('Failed to parse stress analysis response:', error);
      return this.getDefaultAnalysis(messageId);
    }
  }

  private getDefaultAnalysis(messageId: string): ComprehensiveStressAnalysis {
    return {
      message_id: messageId,
      stress_score: 0,
      ai_advice: ""
    };
  }
}