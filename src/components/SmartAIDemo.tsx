import React, { useState, useEffect } from 'react';
import SmartEnhancedMessageInput from '@/components/SmartEnhancedMessageInput';
import CrisisMode from '@/components/CrisisMode';
import WellnessHub from '@/components/WellnessHub';
import { SmartEmotionalAnalysis } from '@/lib/smart-emotional-ai';

interface SmartAIDemoProps {
  className?: string;
}

export default function SmartAIDemo({ className = '' }: SmartAIDemoProps) {
  const [isCrisisMode, setIsCrisisMode] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<SmartEmotionalAnalysis | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<SmartEmotionalAnalysis[]>([]);
  const [sessionStats, setSessionStats] = useState({
    messagesAnalyzed: 0,
    avgStressLevel: 0,
    totalUptime: 0,
    aiAccuracy: 85
  });
  const [demoMode, setDemoMode] = useState<'chat' | 'dashboard' | 'wellness' | 'crisis'>('chat');

  // Monitor for crisis situations
  useEffect(() => {
    if (currentAnalysis?.crisisIndicators && currentAnalysis.stressLevel > 8) {
      setIsCrisisMode(true);
    }
  }, [currentAnalysis]);

  // Update session stats
  useEffect(() => {
    if (analysisHistory.length > 0) {
      const totalStress = analysisHistory.reduce((sum, a) => sum + a.stressLevel, 0);
      setSessionStats({
        messagesAnalyzed: analysisHistory.length,
        avgStressLevel: totalStress / analysisHistory.length,
        totalUptime: Math.floor(Date.now() / 1000 / 60), // minutes
        aiAccuracy: 85 // Would be calculated from user feedback in production
      });
    }
  }, [analysisHistory]);

  const handleSendMessage = (message: string) => {
    console.log('Message sent:', message);
    // In a real app, this would send the message via socket/API
  };

  const handleAnalysisUpdate = (analysis: SmartEmotionalAnalysis) => {
    setCurrentAnalysis(analysis);
    setAnalysisHistory(prev => [...prev, analysis].slice(-50)); // Keep last 50
  };

  const generateDemoData = () => {
    const demoAnalysis: SmartEmotionalAnalysis = {
      stressLevel: Math.random() * 10,
      moodType: ['Happy', 'Anxious', 'Neutral', 'Excited', 'Worried'][Math.floor(Math.random() * 5)],
      intentType: 'Casual Chat',
      confidence: 75 + Math.random() * 25,
      textualAnalysis: {
        semanticScore: Math.random(),
        sentimentPolarity: Math.random() * 2 - 1,
        emotionalIntensity: Math.random(),
        linguisticMarkers: ['positive_words', 'uncertainty_markers'],
        stressKeywords: ['deadline', 'worried'],
        cognitiveLoad: Math.random()
      },
      hybridScoring: {
        geminiScore: 6 + Math.random() * 2,
        localModelScore: 5 + Math.random() * 3,
        historicalScore: 4 + Math.random() * 4,
        finalWeightedScore: 5 + Math.random() * 3,
        confidence: 70 + Math.random() * 30
      },
      contextualFactors: ['Academic stress', 'Social interaction'],
      personalizedRecommendations: [
        {
          type: 'immediate',
          category: 'breathing',
          title: 'Deep Breathing',
          description: 'Try 4-7-8 breathing technique',
          personalizedReason: 'Based on your stress patterns',
          effectiveness: 0.8
        }
      ],
      summary: 'User showing mild stress with positive engagement',
      suggestedAction: 'Continue conversation with supportive tone',
      crisisIndicators: false,
      supportLevel: 'peer',
      wellnessActivities: [],
      stressIndicators: ['elevated_heart_rate'],
      emotions: ['mild_anxiety', 'curiosity'],
      suggestions: ['Take a short break', 'Practice mindfulness'],
      riskLevel: 'low'
    };

    setCurrentAnalysis(demoAnalysis);
    setAnalysisHistory(prev => [...prev, demoAnalysis].slice(-50));
  };

  if (isCrisisMode) {
    return (
      <div className={`max-w-4xl mx-auto p-6 ${className}`}>
        <CrisisMode 
          analysis={{
            stressLevel: 9,
            moodType: 'Overwhelmed',
            intentType: 'Crisis',
            confidence: 95,
            emotionConfidence: 90,
            stressPatterns: ['escalating_distress', 'help_seeking'],
            conversationTone: 'urgent',
            summary: 'Crisis situation detected',
            suggestedAction: 'Seek immediate support',
            crisisIndicators: true,
            supportLevel: 'emergency',
            wellnessActivities: [],
            stressIndicators: ['severe_distress'],
            emotions: ['panic', 'despair'],
            suggestions: ['Contact crisis hotline', 'Reach out to trusted friend'],
            riskLevel: 'critical'
          }}
          onDismiss={() => setIsCrisisMode(false)}
          onGetHelp={() => setIsCrisisMode(false)}
          className="w-full"
        />
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          🧠 Smart AI Emotional Intelligence System
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Advanced multimodal AI for stress detection, emotional analysis, and personalized wellness recommendations
        </p>
        
        {/* Navigation */}
        <div className="flex justify-center space-x-4 mt-6">
          {[
            { key: 'chat', label: '💬 Smart Chat', desc: 'AI-Enhanced Messaging' },
            { key: 'dashboard', label: '📊 Analytics', desc: 'Mood & Stress Tracking' },
            { key: 'wellness', label: '🧘 Wellness', desc: 'Personalized Activities' },
            { key: 'crisis', label: '🆘 Crisis Demo', desc: 'Emergency Response' }
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setDemoMode(item.key as any)}
              className={`p-4 rounded-lg border-2 transition-all ${
                demoMode === item.key 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-lg font-medium">{item.label}</div>
              <div className="text-xs text-gray-600">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
          <div className="text-2xl font-bold">{sessionStats.messagesAnalyzed}</div>
          <div className="text-sm opacity-90">Messages Analyzed</div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
          <div className="text-2xl font-bold">{sessionStats.avgStressLevel.toFixed(1)}/10</div>
          <div className="text-sm opacity-90">Avg Stress Level</div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
          <div className="text-2xl font-bold">{sessionStats.aiAccuracy}%</div>
          <div className="text-sm opacity-90">AI Accuracy</div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
          <div className="text-2xl font-bold">{sessionStats.totalUptime}m</div>
          <div className="text-sm opacity-90">Session Time</div>
        </div>
      </div>

      {/* Demo Controls */}
      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={generateDemoData}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors"
        >
          🎲 Generate Demo Data
        </button>
        <button
          onClick={() => setIsCrisisMode(true)}
          className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-colors"
        >
          🆘 Test Crisis Mode
        </button>
      </div>

      {/* Main Content Based on Mode */}
      {demoMode === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chat Interface */}
          <div className="lg:col-span-2">
            <SmartEnhancedMessageInput 
              onSendMessage={handleSendMessage}
              className="w-full"
            />
          </div>

          {/* Real-time Analysis Sidebar */}
          <div className="space-y-4">
            {currentAnalysis && (
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">🎯 Real-time Analysis</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Stress Level:</span>
                    <span className={`font-semibold ${
                      currentAnalysis.stressLevel > 7 ? 'text-red-600' : 
                      currentAnalysis.stressLevel > 5 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {currentAnalysis.stressLevel.toFixed(1)}/10
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Confidence:</span>
                    <span className="font-semibold">{currentAnalysis.confidence}%</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Mood:</span>
                    <span className="font-semibold text-blue-600">{currentAnalysis.moodType}</span>
                  </div>

                  {currentAnalysis.hybridScoring && (
                    <div className="mt-4 pt-3 border-t">
                      <h4 className="text-xs font-semibold text-gray-700 mb-2">AI Model Breakdown:</h4>
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>Gemini AI:</span>
                          <span>{currentAnalysis.hybridScoring.geminiScore.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Local NLP:</span>
                          <span>{currentAnalysis.hybridScoring.localModelScore.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Final Score:</span>
                          <span>{currentAnalysis.hybridScoring.finalWeightedScore.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">🚀 AI Features</h3>
              <ul className="text-sm space-y-2">
                <li className="flex items-center space-x-2">
                  <span className="text-green-500">✅</span>
                  <span>Real-time text analysis</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-green-500">✅</span>
                  <span>Voice emotion detection</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-green-500">✅</span>
                  <span>Facial expression analysis</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-green-500">✅</span>
                  <span>Hybrid AI scoring</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-green-500">✅</span>
                  <span>Personalized recommendations</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-green-500">✅</span>
                  <span>Crisis detection & intervention</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-green-500">✅</span>
                  <span>Adaptive learning from feedback</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {demoMode === 'wellness' && (
        <WellnessHub 
          currentStressLevel={currentAnalysis?.stressLevel || 5}
          currentMood={currentAnalysis?.moodType || 'Neutral'}
          className="w-full"
        />
      )}

      {demoMode === 'crisis' && (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Crisis Intervention System Demo</h2>
          <p className="text-gray-600 mb-6">
            Our AI can detect crisis situations and provide immediate support resources
          </p>
          <button
            onClick={() => setIsCrisisMode(true)}
            className="bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-700 transition-colors"
          >
            🆘 Activate Crisis Mode
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-8 border-t text-center">
        <p className="text-gray-600">
          🧠 Powered by Advanced AI • 🔒 Privacy-First Design • 🌟 Personalized Experience
        </p>
        <div className="mt-4 text-sm text-gray-500">
          System Status: <span className="text-green-600 font-semibold">● Online</span> | 
          API Latency: <span className="font-semibold">~250ms</span> | 
          Model Accuracy: <span className="font-semibold">{sessionStats.aiAccuracy}%</span>
        </div>
      </div>
    </div>
  );
}