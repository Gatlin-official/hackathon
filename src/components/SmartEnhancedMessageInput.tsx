import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SmartEmotionalAnalysis, getSmartEmotionalAI, MultimodalAnalysisInput } from '@/lib/smart-emotional-ai';
import MultimodalInput from './MultimodalInput';
import MoodTrackingDashboard from './MoodTrackingDashboard';
import AIConversationCoach from './AIConversationCoach';

interface SmartEnhancedMessageInputProps {
  onSendMessage: (message: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export default function SmartEnhancedMessageInput({
  onSendMessage,
  className = '',
  placeholder = 'Type your message...',
  disabled = false
}: SmartEnhancedMessageInputProps) {
  const [message, setMessage] = useState('');
  const [currentAnalysis, setCurrentAnalysis] = useState<SmartEmotionalAnalysis | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<SmartEmotionalAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showMultimodal, setShowMultimodal] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showCoaching, setShowCoaching] = useState(false);
  const [realTimeInsights, setRealTimeInsights] = useState<string[]>([]);
  const [adaptiveMode, setAdaptiveMode] = useState<'text' | 'multimodal' | 'adaptive'>('text');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const smartAI = useMemo(() => getSmartEmotionalAI(), []);

  // Real-time text analysis with debouncing
  useEffect(() => {
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    if (message.trim().length > 10) {
      analysisTimeoutRef.current = setTimeout(async () => {
        try {
          setIsAnalyzing(true);
          const input: MultimodalAnalysisInput = {
            text: message,
            conversationHistory: analysisHistory.slice(-5).map(a => a.summary)
          };

          const analysis = await smartAI.analyzeMultimodal(input);
          setCurrentAnalysis(analysis);

          // Generate real-time insights
          const insights = generateRealTimeInsights(analysis);
          setRealTimeInsights(insights);

          // Auto-enable coaching for high stress
          if (analysis.stressLevel > 7) {
            setShowCoaching(true);
          }

        } catch (error) {
          console.error('Real-time analysis failed:', error);
        } finally {
          setIsAnalyzing(false);
        }
      }, 800);
    } else {
      setCurrentAnalysis(null);
      setRealTimeInsights([]);
    }

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [message, smartAI, analysisHistory]);

  const generateRealTimeInsights = (analysis: SmartEmotionalAnalysis): string[] => {
    const insights: string[] = [];
    
    if (analysis.stressLevel > 8) {
      insights.push('🚨 High stress detected - consider taking a break');
    } else if (analysis.stressLevel > 6) {
      insights.push('⚠️ Elevated stress - breathing exercises may help');
    } else if (analysis.stressLevel < 3) {
      insights.push('😌 Low stress detected - great emotional state');
    }

    if (analysis.confidence < 50) {
      insights.push('🤔 Consider voice/expression analysis for better accuracy');
    }

    if (analysis.crisisIndicators) {
      insights.push('🆘 Crisis indicators detected - support resources available');
    }

    if (analysis.textualAnalysis.cognitiveLoad > 0.8) {
      insights.push('🧠 High cognitive load - try simpler phrasing');
    }

    return insights;
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      // Final analysis before sending
      const finalInput: MultimodalAnalysisInput = {
        text: message,
        conversationHistory: analysisHistory.slice(-10).map(a => a.summary)
      };

      const finalAnalysis = await smartAI.analyzeMultimodal(finalInput);
      
      // Store in history
      setAnalysisHistory(prev => [...prev, finalAnalysis].slice(-20));
      
      // Send message
      onSendMessage(message);
      
      // Reset state
      setMessage('');
      setCurrentAnalysis(null);
      setRealTimeInsights([]);
      
    } catch (error) {
      console.error('Failed to analyze message before sending:', error);
      onSendMessage(message); // Send anyway
      setMessage('');
    }
  };

  const handleMultimodalAnalysis = (analysis: SmartEmotionalAnalysis) => {
    setCurrentAnalysis(analysis);
    setAnalysisHistory(prev => [...prev, analysis].slice(-20));
    
    const insights = generateRealTimeInsights(analysis);
    setRealTimeInsights(insights);
  };

  const handlePartialAnalysis = (partial: Partial<SmartEmotionalAnalysis>) => {
    if (partial.stressLevel) {
      setRealTimeInsights([`🔄 Processing... Stress Level: ${partial.stressLevel.toFixed(1)}/10`]);
    }
  };

  const getStressColor = (level: number): string => {
    if (level <= 3) return 'text-green-600';
    if (level <= 6) return 'text-yellow-600';
    if (level <= 8) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStressEmoji = (level: number): string => {
    if (level <= 3) return '😊';
    if (level <= 6) return '😐';
    if (level <= 8) return '😰';
    return '😨';
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-4 ${className}`}>
      {/* Header with Mode Selection */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-xl">🧠</span>
          <div>
            <h3 className="font-semibold text-gray-900">Smart Message Input</h3>
            <p className="text-xs text-gray-600">AI-powered emotional intelligence</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={adaptiveMode}
            onChange={(e) => setAdaptiveMode(e.target.value as 'text' | 'multimodal' | 'adaptive')}
            className="text-xs border rounded-md px-2 py-1"
          >
            <option value="text">Text Only</option>
            <option value="multimodal">Multimodal</option>
            <option value="adaptive">Adaptive AI</option>
          </select>

          <button
            onClick={() => setShowDashboard(!showDashboard)}
            className={`p-2 rounded-md ${showDashboard ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            title="Mood Dashboard"
          >
            📊
          </button>

          <button
            onClick={() => setShowCoaching(!showCoaching)}
            className={`p-2 rounded-md ${showCoaching ? 'bg-green-100 text-green-600' : 'text-gray-500 hover:bg-gray-100'}`}
            title="AI Coaching"
          >
            💬
          </button>
        </div>
      </div>

      {/* Real-time Analysis Display */}
      {currentAnalysis && (
        <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-l-4 border-blue-400">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getStressEmoji(currentAnalysis.stressLevel)}</span>
              <span className={`font-semibold ${getStressColor(currentAnalysis.stressLevel)}`}>
                Stress Level: {currentAnalysis.stressLevel.toFixed(1)}/10
              </span>
              <span className="text-sm text-gray-600">
                ({currentAnalysis.moodType})
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {currentAnalysis.confidence}% confidence
            </div>
          </div>

          {currentAnalysis.crisisIndicators && (
            <div className="mb-2 p-2 bg-red-100 border border-red-200 rounded-md">
              <span className="text-red-800 text-sm font-medium">
                🆘 Crisis indicators detected - Support resources are available
              </span>
            </div>
          )}

          <div className="text-sm text-gray-700">
            <strong>AI Summary:</strong> {currentAnalysis.summary}
          </div>

          {currentAnalysis.personalizedRecommendations.length > 0 && (
            <div className="mt-2">
              <strong className="text-sm text-gray-700">Suggestions:</strong>
              <ul className="text-xs text-gray-600 mt-1 space-y-1">
                {currentAnalysis.personalizedRecommendations.slice(0, 2).map((rec, index) => (
                  <li key={index}>• {rec.title}: {rec.description}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Real-time Insights */}
      {realTimeInsights.length > 0 && (
        <div className="mb-3 space-y-1">
          {realTimeInsights.map((insight, index) => (
            <div key={index} className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
              {insight}
            </div>
          ))}
        </div>
      )}

      {/* Message Input */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          style={{ 
            minHeight: '80px',
            maxHeight: '200px',
            color: '#000',
            backgroundColor: '#fff'
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        
        {isAnalyzing && (
          <div className="absolute top-2 right-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex space-x-2">
          <button
            onClick={() => setShowMultimodal(!showMultimodal)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              showMultimodal 
                ? 'bg-purple-100 text-purple-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🎭 Multimodal
          </button>
          
          <span className="text-xs text-gray-500 self-center">
            {message.length > 0 && `${message.length} chars`}
          </span>
        </div>

        <button
          onClick={handleSendMessage}
          disabled={!message.trim() || disabled}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-300 transition-colors"
        >
          Send Message
        </button>
      </div>

      {/* Multimodal Input Panel */}
      {showMultimodal && (
        <div className="mt-4 border-t pt-4">
          <MultimodalInput
            onAnalysisComplete={handleMultimodalAnalysis}
            onAnalysisUpdate={handlePartialAnalysis}
            className="shadow-none border border-gray-200"
          />
        </div>
      )}

      {/* Dashboard Panel */}
      {showDashboard && (
        <div className="mt-4 border-t pt-4">
          <MoodTrackingDashboard 
            moodHistory={analysisHistory.map(a => ({
              timestamp: new Date(),
              stressLevel: a.stressLevel,
              moodType: a.moodType
            }))}
            className="shadow-none border border-gray-200"
          />
        </div>
      )}

      {/* AI Coaching Panel */}
      {showCoaching && (
        <div className="mt-4 border-t pt-4">
          <AIConversationCoach
            currentMessage={message}
            recentMessages={analysisHistory.slice(-5).map(a => a.summary)}
            onSuggestionAccept={(suggestion) => setMessage(suggestion)}
            className="shadow-none border border-gray-200"
          />
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex justify-between text-xs text-gray-500">
          <span>📈 {analysisHistory.length} messages analyzed</span>
          {analysisHistory.length > 0 && (
            <span>
              🧠 Avg Stress: {(analysisHistory.reduce((sum, a) => sum + a.stressLevel, 0) / analysisHistory.length).toFixed(1)}/10
            </span>
          )}
          <span>🤖 {adaptiveMode.charAt(0).toUpperCase() + adaptiveMode.slice(1)} Mode</span>
        </div>
      </div>
    </div>
  );
}