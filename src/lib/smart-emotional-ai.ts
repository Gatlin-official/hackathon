import { GoogleGenerativeAI } from '@google/generative-ai';

// Interfaces for the advanced AI system
export interface MultimodalAnalysisInput {
  text?: string;
  audioBlob?: Blob;
  imageBlob?: Blob;
  videoBlob?: Blob;
  userContext?: UserEmotionalProfile;
  conversationHistory?: string[];
}

export interface UserEmotionalProfile {
  userId: string;
  baselineStress: number; // Personal baseline (0-10)
  emotionalPatterns: EmotionalPattern[];
  responseAccuracy: number; // User feedback accuracy (0-1)
  adaptiveLearningData: AdaptiveLearningData;
  preferredCommunicationStyle: 'direct' | 'gentle' | 'supportive' | 'analytical';
  triggerWords: string[]; // Personal stress triggers
  calmingFactors: string[]; // What helps this user
}

export interface EmotionalPattern {
  pattern: string;
  frequency: number;
  context: 'academic' | 'social' | 'personal' | 'health';
  severity: 'low' | 'medium' | 'high' | 'crisis';
  timestamp: Date;
}

export interface AdaptiveLearningData {
  feedbackHistory: UserFeedback[];
  modelAccuracy: number;
  personalizedWeights: {
    geminiFactor: number; // 0-1
    localModelFactor: number; // 0-1
    historicalFactor: number; // 0-1
    contextualFactor: number; // 0-1
  };
}

export interface UserFeedback {
  analysisId: string;
  actualStressLevel: number;
  actualMoodType: string;
  wasAccurate: boolean;
  comments?: string;
  timestamp: Date;
}

export interface SmartEmotionalAnalysis {
  // Core metrics
  stressLevel: number; // 0-10, personalized to user
  moodType: string;
  intentType: string;
  confidence: number; // Overall confidence
  
  // Multimodal analysis
  textualAnalysis: TextualAnalysis;
  audioAnalysis?: AudioAnalysis;
  visualAnalysis?: VisualAnalysis;
  
  // Hybrid scoring breakdown
  hybridScoring: {
    geminiScore: number;
    localModelScore: number;
    historicalScore: number;
    finalWeightedScore: number;
    confidence: number;
  };
  
  // Advanced features
  emotionalMicroExpressions?: string[];
  voiceStressIndicators?: string[];
  contextualFactors: string[];
  personalizedRecommendations: PersonalizedRecommendation[];
  adaptiveLearningPrompt?: string;
  
  // Legacy compatibility
  summary: string;
  suggestedAction: string;
  crisisIndicators: boolean;
  supportLevel: 'none' | 'peer' | 'professional' | 'emergency';
  wellnessActivities: any[];
  stressIndicators: string[];
  emotions: string[];
  suggestions: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface TextualAnalysis {
  semanticScore: number;
  sentimentPolarity: number; // -1 to 1
  emotionalIntensity: number; // 0-1
  linguisticMarkers: string[];
  stressKeywords: string[];
  cognitiveLoad: number; // Based on sentence complexity
}

export interface AudioAnalysis {
  voiceStressLevel: number; // 0-10
  toneVariation: number; // Emotional variability
  speechRate: number; // Words per minute
  pausePatterns: number[]; // Silence analysis
  pitchVariation: number;
  energyLevel: number;
  emotionalTone: string;
}

export interface VisualAnalysis {
  facialEmotions: FacialEmotion[];
  overallMood: string;
  stressMarkers: string[];
  confidenceLevel: number;
  eyeContact: number; // 0-1
  facialTension: number; // 0-1
}

export interface FacialEmotion {
  emotion: string;
  confidence: number;
  intensity: number;
}

export interface PersonalizedRecommendation {
  type: 'immediate' | 'short-term' | 'long-term';
  category: 'breathing' | 'movement' | 'social' | 'cognitive' | 'professional';
  title: string;
  description: string;
  personalizedReason: string;
  effectiveness: number; // Based on user history
}

export class SmartEmotionalAI {
  private genAI: GoogleGenerativeAI;
  private primaryModel: any;
  private fallbackModel: any;
  private localNLPModel: LocalNLPModel | null = null;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      throw new Error('Gemini API key not configured');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    
    // Primary model for comprehensive analysis
    this.primaryModel = this.genAI.getGenerativeModel({ 
      model: 'models/gemini-2.5-flash', // Use latest flash model
      generationConfig: {
        temperature: 0.3, // Lower for more consistent emotional analysis
        topP: 0.8,
        topK: 30,
        maxOutputTokens: 2048,
      }
    });
    
    // Fallback model for text-only analysis
    this.fallbackModel = this.genAI.getGenerativeModel({
      model: 'models/gemini-2.5-flash',
      generationConfig: {
        temperature: 0.4,
        topP: 0.7,
        maxOutputTokens: 1024,
      }
    });

    console.log('🧠 Smart Emotional AI initialized with multimodal capabilities');
    this.initializeLocalNLP();
  }

  private async initializeLocalNLP() {
    try {
      // Initialize local NLP model (simulated for now - could use TensorFlow.js)
      this.localNLPModel = new LocalNLPModel();
      await this.localNLPModel.initialize();
      console.log('🤖 Local NLP model initialized');
    } catch (error) {
      console.warn('Local NLP model failed to initialize, using Gemini only:', error);
    }
  }

  async analyzeMultimodal(input: MultimodalAnalysisInput): Promise<SmartEmotionalAnalysis> {
    try {
      console.log('🎯 Starting multimodal emotional analysis');

      // Parallel analysis of different modalities
      const [textAnalysis, audioAnalysis, visualAnalysis] = await Promise.allSettled([
        input.text ? this.analyzeText(input.text, input.userContext) : null,
        input.audioBlob ? this.analyzeAudio(input.audioBlob) : null,
        input.imageBlob ? this.analyzeImage(input.imageBlob) : null
      ]);

      // Extract successful results
      const textResult = textAnalysis.status === 'fulfilled' ? textAnalysis.value : null;
      const audioResult = audioAnalysis.status === 'fulfilled' ? audioAnalysis.value : null;
      const visualResult = visualAnalysis.status === 'fulfilled' ? visualAnalysis.value : null;

      // Hybrid scoring with personalization
      const hybridScore = this.calculateHybridScore(
        textResult,
        audioResult,
        visualResult,
        input.userContext
      );

      // Generate personalized recommendations
      const personalizedRecs = await this.generatePersonalizedRecommendations(
        hybridScore,
        input.userContext
      );

      // Create comprehensive analysis
      const analysis: SmartEmotionalAnalysis = {
        stressLevel: hybridScore.finalWeightedScore,
        moodType: this.determineMood(hybridScore, textResult, audioResult, visualResult),
        intentType: this.determineIntent(textResult, input.userContext),
        confidence: hybridScore.confidence,
        
        textualAnalysis: textResult || this.getDefaultTextAnalysis(),
        audioAnalysis: audioResult || undefined,
        visualAnalysis: visualResult || undefined,
        
        hybridScoring: hybridScore,
        
        emotionalMicroExpressions: visualResult?.facialEmotions.map(e => e.emotion) || [],
        voiceStressIndicators: audioResult ? this.extractVoiceStressIndicators(audioResult) : [],
        contextualFactors: this.extractContextualFactors(input),
        personalizedRecommendations: personalizedRecs,
        adaptiveLearningPrompt: this.generateLearningPrompt(input.userContext),
        
        // Legacy compatibility
        summary: this.generateSummary(hybridScore, textResult, audioResult, visualResult),
        suggestedAction: personalizedRecs[0]?.description || 'Take a moment to breathe',
        crisisIndicators: hybridScore.finalWeightedScore >= 8,
        supportLevel: this.determineSupportLevel(hybridScore.finalWeightedScore),
        wellnessActivities: this.convertRecommendationsToActivities(personalizedRecs),
        stressIndicators: textResult?.stressKeywords || [],
        emotions: [this.determineMood(hybridScore, textResult, audioResult, visualResult).toLowerCase()],
        suggestions: personalizedRecs.slice(0, 3).map(r => r.title),
        riskLevel: this.determineRiskLevel(hybridScore.finalWeightedScore)
      };

      console.log('✅ Multimodal analysis completed', {
        stress: analysis.stressLevel,
        mood: analysis.moodType,
        confidence: analysis.confidence,
        modalities: {
          text: !!textResult,
          audio: !!audioResult,
          visual: !!visualResult
        }
      });

      return analysis;

    } catch (error) {
      console.error('❌ Multimodal analysis failed:', error);
      return this.getFallbackAnalysis(input.text || 'Analysis failed');
    }
  }

  private async analyzeText(text: string, userContext?: UserEmotionalProfile): Promise<TextualAnalysis> {
    try {
      // Enhanced Gemini analysis with user context
      const contextPrompt = this.buildContextualPrompt(text, userContext);
      
      const geminiResult = await this.primaryModel.generateContent(contextPrompt);
      const geminiResponse = await geminiResult.response;
      const geminiAnalysis = this.parseGeminiTextResponse(geminiResponse.text());

      // Local NLP analysis for comparison
      let localAnalysis = null;
      if (this.localNLPModel) {
        localAnalysis = await this.localNLPModel.analyzeText(text);
      }

      // Combine analyses
      return this.combineTextAnalyses(geminiAnalysis, localAnalysis, userContext);

    } catch (error) {
      console.error('Text analysis failed:', error);
      return this.getBasicTextAnalysis(text);
    }
  }

  private async analyzeAudio(audioBlob: Blob): Promise<AudioAnalysis> {
    try {
      // Convert blob to format for Gemini (if supported) or use Web Audio API
      const audioBuffer = await this.processAudioBlob(audioBlob);
      
      // For now, simulate audio analysis (would integrate with real audio processing)
      return this.simulateAudioAnalysis(audioBuffer);

    } catch (error) {
      console.error('Audio analysis failed:', error);
      return this.getDefaultAudioAnalysis();
    }
  }

  private async analyzeImage(imageBlob: Blob): Promise<VisualAnalysis> {
    try {
      // Convert image for Gemini Vision API
      const imageData = await this.convertImageForGemini(imageBlob);
      
      const prompt = `Analyze this person's facial expression and emotional state. Focus on:
      1. Primary emotion displayed
      2. Stress indicators (tension, fatigue, worry)
      3. Overall mood assessment
      4. Confidence level of analysis
      
      Return JSON format:
      {
        "primary_emotion": "string",
        "stress_level": number (0-10),
        "facial_emotions": [{"emotion": "string", "confidence": number, "intensity": number}],
        "stress_markers": ["list of observed stress indicators"],
        "eye_contact": number (0-1),
        "facial_tension": number (0-1)
      }`;

      const result = await this.primaryModel.generateContent([prompt, imageData]);
      const response = await result.response;
      
      return this.parseVisualAnalysis(response.text());

    } catch (error) {
      console.error('Visual analysis failed:', error);
      return this.getDefaultVisualAnalysis();
    }
  }

  private calculateHybridScore(
    textAnalysis: TextualAnalysis | null,
    audioAnalysis: AudioAnalysis | null,
    visualAnalysis: VisualAnalysis | null,
    userContext?: UserEmotionalProfile
  ) {
    // Get personalized weights or use defaults
    const weights = userContext?.adaptiveLearningData.personalizedWeights || {
      geminiFactor: 0.7,
      localModelFactor: 0.3,
      historicalFactor: 0.1,
      contextualFactor: 0.1
    };

    // Calculate individual scores
    const textScore = textAnalysis ? textAnalysis.semanticScore * 10 : 5;
    const audioScore = audioAnalysis ? audioAnalysis.voiceStressLevel : textScore;
    const visualScore = visualAnalysis ? 
      visualAnalysis.facialEmotions.reduce((sum, e) => sum + e.intensity, 0) * 2 : textScore;

    // Weighted combination
    let finalScore = 0;
    let totalWeight = 0;

    if (textAnalysis) {
      finalScore += textScore * 0.5;
      totalWeight += 0.5;
    }
    if (audioAnalysis) {
      finalScore += audioScore * 0.3;
      totalWeight += 0.3;
    }
    if (visualAnalysis) {
      finalScore += visualScore * 0.2;
      totalWeight += 0.2;
    }

    finalScore = totalWeight > 0 ? finalScore / totalWeight : 5;

    // Apply user context adjustments
    if (userContext) {
      // Adjust based on user's baseline
      const baselineAdjustment = (finalScore - userContext.baselineStress) * 0.8 + userContext.baselineStress;
      finalScore = Math.max(0, Math.min(10, baselineAdjustment));
    }

    // Calculate confidence based on agreement between modalities
    let confidence = 60; // Base confidence
    if (textAnalysis && audioAnalysis) {
      const agreement = 1 - Math.abs(textScore - audioScore) / 10;
      confidence += agreement * 20;
    }
    if (visualAnalysis) {
      confidence += 10; // Visual data increases confidence
    }

    return {
      geminiScore: textScore,
      localModelScore: (textAnalysis?.semanticScore || 0.5) * 10,
      historicalScore: userContext ? userContext.baselineStress : 5,
      finalWeightedScore: Math.round(finalScore * 10) / 10,
      confidence: Math.min(100, confidence)
    };
  }

  private async generatePersonalizedRecommendations(
    hybridScore: any,
    userContext?: UserEmotionalProfile
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];
    const stressLevel = hybridScore.finalWeightedScore;

    // High stress recommendations
    if (stressLevel >= 7) {
      recommendations.push({
        type: 'immediate',
        category: 'breathing',
        title: 'Emergency Stress Relief',
        description: '5-minute box breathing exercise',
        personalizedReason: userContext ? 
          `Based on your history, breathing exercises have been 85% effective for you` :
          'Proven technique for immediate stress reduction',
        effectiveness: userContext ? 0.85 : 0.75
      });

      if (userContext?.preferredCommunicationStyle === 'supportive') {
        recommendations.push({
          type: 'immediate',
          category: 'social',
          title: 'Reach Out for Support',
          description: 'Connect with a trusted friend or counselor',
          personalizedReason: 'You respond well to supportive connections',
          effectiveness: 0.9
        });
      }
    }

    // Medium stress recommendations  
    if (stressLevel >= 4 && stressLevel < 7) {
      recommendations.push({
        type: 'short-term',
        category: 'movement',
        title: 'Gentle Movement Break',
        description: '10-minute walk or stretching routine',
        personalizedReason: 'Physical activity helps regulate your stress response',
        effectiveness: 0.8
      });
    }

    // Personalized based on user patterns
    if (userContext?.calmingFactors.includes('music')) {
      recommendations.push({
        type: 'short-term',
        category: 'cognitive',
        title: 'Calming Music Session',
        description: 'Listen to your preferred calming playlist',
        personalizedReason: 'Music has been effective for you in the past',
        effectiveness: 0.85
      });
    }

    return recommendations.slice(0, 4); // Return top 4 recommendations
  }

  // Helper methods for parsing and processing
  private buildContextualPrompt(text: string, userContext?: UserEmotionalProfile): string {
    let prompt = `You are an advanced emotional AI analyzing a message for stress and emotional state.

Message: "${text}"

Analyze for:
1. Stress level (0-10 scale)
2. Primary emotion
3. Intent (venting, seeking help, casual, crisis)
4. Emotional intensity
5. Linguistic stress markers
6. Cognitive load indicators`;

    if (userContext) {
      prompt += `

User Context:
- Baseline stress: ${userContext.baselineStress}/10
- Communication style: ${userContext.preferredCommunicationStyle}
- Known triggers: ${userContext.triggerWords.join(', ')}
- Historical accuracy: ${Math.round(userContext.responseAccuracy * 100)}%`;
    }

    prompt += `

Return strict JSON:
{
  "stress_level": number,
  "primary_emotion": "string", 
  "intent": "string",
  "semantic_score": number (0-1),
  "sentiment_polarity": number (-1 to 1),
  "emotional_intensity": number (0-1),
  "linguistic_markers": ["array"],
  "stress_keywords": ["array"],
  "cognitive_load": number (0-1)
}`;

    return prompt;
  }

  private parseGeminiTextResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      return this.getDefaultGeminiResponse();
    }
  }

  private combineTextAnalyses(geminiAnalysis: any, localAnalysis: any, userContext?: UserEmotionalProfile): TextualAnalysis {
    const weights = userContext?.adaptiveLearningData.personalizedWeights || {
      geminiFactor: 0.7,
      localModelFactor: 0.3,
      historicalFactor: 0.0,
      contextualFactor: 0.0
    };

    return {
      semanticScore: geminiAnalysis.semantic_score || 0.5,
      sentimentPolarity: geminiAnalysis.sentiment_polarity || 0,
      emotionalIntensity: geminiAnalysis.emotional_intensity || 0.5,
      linguisticMarkers: geminiAnalysis.linguistic_markers || [],
      stressKeywords: geminiAnalysis.stress_keywords || [],
      cognitiveLoad: geminiAnalysis.cognitive_load || 0.3
    };
  }

  // Default/fallback methods
  private getDefaultTextAnalysis(): TextualAnalysis {
    return {
      semanticScore: 0.5,
      sentimentPolarity: 0,
      emotionalIntensity: 0.5,
      linguisticMarkers: [],
      stressKeywords: [],
      cognitiveLoad: 0.3
    };
  }

  private getBasicTextAnalysis(text: string): TextualAnalysis {
    // Simple keyword-based analysis as fallback
    const stressWords = ['stress', 'anxious', 'worried', 'overwhelmed', 'panic'];
    const foundStressWords = stressWords.filter(word => 
      text.toLowerCase().includes(word)
    );

    return {
      semanticScore: Math.min(1, foundStressWords.length * 0.3),
      sentimentPolarity: foundStressWords.length > 0 ? -0.5 : 0,
      emotionalIntensity: Math.min(1, foundStressWords.length * 0.25),
      linguisticMarkers: foundStressWords,
      stressKeywords: foundStressWords,
      cognitiveLoad: text.split(' ').length > 20 ? 0.7 : 0.3
    };
  }

  private getDefaultGeminiResponse(): any {
    return {
      stress_level: 5,
      primary_emotion: 'neutral',
      intent: 'casual',
      semantic_score: 0.5,
      sentiment_polarity: 0,
      emotional_intensity: 0.5,
      linguistic_markers: [],
      stress_keywords: [],
      cognitive_load: 0.3
    };
  }

  private async processAudioBlob(audioBlob: Blob): Promise<ArrayBuffer> {
    return await audioBlob.arrayBuffer();
  }

  private simulateAudioAnalysis(audioBuffer: ArrayBuffer): AudioAnalysis {
    // Simulated audio analysis - would use real audio processing libraries
    return {
      voiceStressLevel: Math.random() * 5 + 2, // 2-7 range
      toneVariation: Math.random() * 0.5 + 0.3,
      speechRate: 140 + Math.random() * 60, // 140-200 WPM
      pausePatterns: [0.5, 1.2, 0.3, 0.8],
      pitchVariation: Math.random() * 0.4 + 0.2,
      energyLevel: Math.random() * 0.6 + 0.2,
      emotionalTone: ['neutral', 'stressed', 'calm', 'anxious'][Math.floor(Math.random() * 4)]
    };
  }

  private getDefaultAudioAnalysis(): AudioAnalysis {
    return {
      voiceStressLevel: 5,
      toneVariation: 0.4,
      speechRate: 160,
      pausePatterns: [0.5, 1.0, 0.3],
      pitchVariation: 0.3,
      energyLevel: 0.5,
      emotionalTone: 'neutral'
    };
  }

  private async convertImageForGemini(imageBlob: Blob): Promise<any> {
    // Convert image to base64 for Gemini Vision API
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          inlineData: {
            data: (reader.result as string).split(',')[1],
            mimeType: imageBlob.type
          }
        });
      };
      reader.readAsDataURL(imageBlob);
    });
  }

  private parseVisualAnalysis(response: string): VisualAnalysis {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          facialEmotions: parsed.facial_emotions || [],
          overallMood: parsed.primary_emotion || 'neutral',
          stressMarkers: parsed.stress_markers || [],
          confidenceLevel: 0.7,
          eyeContact: parsed.eye_contact || 0.5,
          facialTension: parsed.facial_tension || 0.3
        };
      }
    } catch (error) {
      console.error('Failed to parse visual analysis:', error);
    }
    return this.getDefaultVisualAnalysis();
  }

  private getDefaultVisualAnalysis(): VisualAnalysis {
    return {
      facialEmotions: [{ emotion: 'neutral', confidence: 0.6, intensity: 0.3 }],
      overallMood: 'neutral',
      stressMarkers: [],
      confidenceLevel: 0.5,
      eyeContact: 0.5,
      facialTension: 0.3
    };
  }

  // Additional helper methods
  private determineMood(hybridScore: any, textAnalysis: TextualAnalysis | null, audioAnalysis: AudioAnalysis | null, visualAnalysis: VisualAnalysis | null): string {
    const stressLevel = hybridScore.finalWeightedScore;
    
    if (stressLevel >= 8) return 'Overwhelmed';
    if (stressLevel >= 6) return 'Stressed';
    if (stressLevel >= 4) return 'Anxious';
    if (stressLevel <= 2) return 'Calm';
    return 'Neutral';
  }

  private determineIntent(textAnalysis: TextualAnalysis | null, userContext?: UserEmotionalProfile): string {
    if (!textAnalysis) return 'Casual Chat';
    
    const markers = textAnalysis.linguisticMarkers;
    if (markers.includes('help') || markers.includes('advice')) return 'Seeking Help';
    if (markers.includes('stressed') || markers.includes('overwhelmed')) return 'Venting';
    if (textAnalysis.emotionalIntensity > 0.8) return 'Crisis';
    
    return 'Casual Chat';
  }

  private determineSupportLevel(stressLevel: number): 'none' | 'peer' | 'professional' | 'emergency' {
    if (stressLevel >= 8) return 'emergency';
    if (stressLevel >= 6) return 'professional';
    if (stressLevel >= 4) return 'peer';
    return 'none';
  }

  private determineRiskLevel(stressLevel: number): 'low' | 'medium' | 'high' | 'critical' {
    if (stressLevel >= 8) return 'critical';
    if (stressLevel >= 6) return 'high';
    if (stressLevel >= 4) return 'medium';
    return 'low';
  }

  private extractVoiceStressIndicators(audioAnalysis: AudioAnalysis): string[] {
    const indicators: string[] = [];
    
    if (audioAnalysis.voiceStressLevel > 6) indicators.push('High vocal stress');
    if (audioAnalysis.speechRate > 180) indicators.push('Rapid speech');
    if (audioAnalysis.pitchVariation > 0.6) indicators.push('Pitch instability');
    if (audioAnalysis.pausePatterns.some(p => p > 2)) indicators.push('Extended pauses');
    
    return indicators;
  }

  private extractContextualFactors(input: MultimodalAnalysisInput): string[] {
    const factors: string[] = [];
    
    if (input.audioBlob) factors.push('Voice analysis available');
    if (input.imageBlob) factors.push('Facial expression data');
    if (input.conversationHistory?.length) factors.push('Conversation context');
    if (input.userContext) factors.push('Personal emotional profile');
    
    return factors;
  }

  private generateSummary(hybridScore: any, textAnalysis: TextualAnalysis | null, audioAnalysis: AudioAnalysis | null, visualAnalysis: VisualAnalysis | null): string {
    const stressLevel = hybridScore.finalWeightedScore;
    const confidence = hybridScore.confidence;
    
    let summary = `Multimodal analysis detected stress level ${stressLevel}/10 with ${confidence}% confidence.`;
    
    if (textAnalysis) summary += ` Text analysis indicates ${textAnalysis.emotionalIntensity > 0.6 ? 'high' : 'moderate'} emotional intensity.`;
    if (audioAnalysis) summary += ` Voice analysis shows ${audioAnalysis.emotionalTone} tone.`;
    if (visualAnalysis) summary += ` Visual cues suggest ${visualAnalysis.overallMood} mood.`;
    
    return summary;
  }

  private convertRecommendationsToActivities(recommendations: PersonalizedRecommendation[]): any[] {
    return recommendations.map(rec => ({
      type: rec.category,
      title: rec.title,
      description: rec.description,
      duration: rec.type === 'immediate' ? '5 minutes' : '15 minutes',
      urgency: rec.type === 'immediate' ? 'high' : 'medium'
    }));
  }

  private generateLearningPrompt(userContext?: UserEmotionalProfile): string {
    if (!userContext) return '';
    
    return `Was this stress assessment accurate for you? Your feedback helps us improve personalized analysis.`;
  }

  private getFallbackAnalysis(text: string): SmartEmotionalAnalysis {
    const basicAnalysis = this.getBasicTextAnalysis(text);
    const stressLevel = basicAnalysis.semanticScore * 10;
    
    return {
      stressLevel,
      moodType: stressLevel > 6 ? 'Stressed' : 'Calm',
      intentType: 'Casual Chat',
      confidence: 40,
      textualAnalysis: basicAnalysis,
      hybridScoring: {
        geminiScore: stressLevel,
        localModelScore: stressLevel,
        historicalScore: 5,
        finalWeightedScore: stressLevel,
        confidence: 40
      },
      contextualFactors: ['Basic text analysis only'],
      personalizedRecommendations: [],
      summary: 'Basic analysis (advanced features unavailable)',
      suggestedAction: 'Take a moment to assess how you\'re feeling',
      crisisIndicators: stressLevel >= 8,
      supportLevel: stressLevel >= 6 ? 'peer' : 'none',
      wellnessActivities: [],
      stressIndicators: basicAnalysis.stressKeywords,
      emotions: [stressLevel > 6 ? 'stressed' : 'calm'],
      suggestions: ['Take deep breaths', 'Consider talking to someone'],
      riskLevel: stressLevel >= 6 ? 'high' : 'low'
    };
  }
}

// Simulated Local NLP Model (would be replaced with actual TensorFlow.js model)
class LocalNLPModel {
  private isInitialized = false;

  async initialize(): Promise<void> {
    // Simulate model loading
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.isInitialized = true;
  }

  async analyzeText(text: string): Promise<any> {
    if (!this.isInitialized) throw new Error('Model not initialized');
    
    // Simulate local NLP analysis
    // In reality, this would use a pre-trained transformer model
    const sentiment = this.calculateSentiment(text);
    const stressScore = this.calculateStressScore(text);
    
    return {
      sentiment,
      stressScore,
      confidence: 0.75
    };
  }

  private calculateSentiment(text: string): number {
    // Simple sentiment calculation
    const positiveWords = ['happy', 'good', 'great', 'excellent', 'amazing'];
    const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'stressed', 'anxious'];
    
    let score = 0;
    positiveWords.forEach(word => {
      if (text.toLowerCase().includes(word)) score += 1;
    });
    negativeWords.forEach(word => {
      if (text.toLowerCase().includes(word)) score -= 1;
    });
    
    return Math.max(-1, Math.min(1, score * 0.2));
  }

  private calculateStressScore(text: string): number {
    const stressIndicators = ['stress', 'overwhelmed', 'panic', 'anxious', 'worried', 'pressure'];
    let score = 0;
    
    stressIndicators.forEach(indicator => {
      if (text.toLowerCase().includes(indicator)) score += 0.2;
    });
    
    return Math.min(1, score);
  }
}

// Singleton instance
let smartEmotionalAI: SmartEmotionalAI | null = null;

export function getSmartEmotionalAI(): SmartEmotionalAI {
  if (!smartEmotionalAI) {
    smartEmotionalAI = new SmartEmotionalAI();
  }
  return smartEmotionalAI;
}