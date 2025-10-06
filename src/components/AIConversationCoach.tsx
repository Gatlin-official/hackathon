import React, { useState, useEffect } from 'react';
import { getEnhancedStressAnalyzer, EnhancedStressAnalysis } from '../lib/enhanced-stress-analyzer';

interface AIConversationCoachProps {
  currentMessage: string;
  recentMessages: string[];
  onSuggestionAccept: (suggestion: string) => void;
  className?: string;
}

interface CoachSuggestion {
  type: 'tone' | 'response' | 'wellness' | 'crisis';
  message: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  icon: string;
}

export default function AIConversationCoach({ 
  currentMessage, 
  recentMessages, 
  onSuggestionAccept,
  className = '' 
}: AIConversationCoachProps) {
  const [suggestions, setSuggestions] = useState<CoachSuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCoach, setShowCoach] = useState(false);

  useEffect(() => {
    if (currentMessage.length > 10) {
      analyzeToneAndSuggest();
    } else {
      setSuggestions([]);
      setShowCoach(false);
    }
  }, [currentMessage, recentMessages]);

  const analyzeToneAndSuggest = async () => {
    if (isAnalyzing) return;
    
    setIsAnalyzing(true);
    
    try {
      const analyzer = getEnhancedStressAnalyzer();
      
      // Analyze current message
      const analysis = await analyzer.analyzeStress({
        text: currentMessage,
        timestamp: new Date(),
        conversationContext: recentMessages
      });

      const newSuggestions = generateSuggestions(analysis, currentMessage);
      setSuggestions(newSuggestions);
      setShowCoach(newSuggestions.length > 0);
      
    } catch (error) {
      console.error('AI Coach analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateSuggestions = (analysis: EnhancedStressAnalysis, message: string): CoachSuggestion[] => {
    const suggestions: CoachSuggestion[] = [];
    
    // Crisis detection
    if (analysis.crisisIndicators) {
      suggestions.push({
        type: 'crisis',
        message: '🚨 This message indicates distress. Consider: "I hear you\'re going through something really difficult. Would you like to talk about it?"',
        urgency: 'critical',
        icon: '🚨'
      });
      return suggestions; // Crisis overrides other suggestions
    }

    // High stress response coaching
    if (analysis.stressLevel >= 7) {
      suggestions.push({
        type: 'response',
        message: 'Suggested response: "That sounds really overwhelming. I\'m here to listen if you want to share more."',
        urgency: 'high',
        icon: '🤝'
      });
    }

    // Tone suggestions based on mood
    switch (analysis.moodType) {
      case 'Anxious':
        suggestions.push({
          type: 'tone',
          message: 'Consider a calming tone: "Take your time. There\'s no pressure to figure everything out right now."',
          urgency: 'medium',
          icon: '🌸'
        });
        break;
        
      case 'Angry':
      case 'Frustrated':
        suggestions.push({
          type: 'tone',
          message: 'Validation approach: "Your frustration makes complete sense. That would be really hard to deal with."',
          urgency: 'medium',
          icon: '💙'
        });
        break;
        
      case 'Sad':
      case 'Lonely':
        suggestions.push({
          type: 'response',
          message: 'Supportive response: "I\'m really glad you shared this with us. You\'re not alone in feeling this way."',
          urgency: 'medium',
          icon: '🤗'
        });
        break;
        
      case 'Overwhelmed':
        suggestions.push({
          type: 'response',
          message: 'Helpful response: "That\'s a lot to handle. Would it help to break this down into smaller pieces?"',
          urgency: 'high',
          icon: '🧩'
        });
        break;
    }

    // Wellness activity suggestions for high stress
    if (analysis.stressLevel >= 6) {
      const wellnessActivity = selectWellnessActivity(analysis);
      if (wellnessActivity) {
        suggestions.push({
          type: 'wellness',
          message: `Suggest: "${wellnessActivity}"`,
          urgency: 'medium',
          icon: '🌱'
        });
      }
    }

    // Intent-based suggestions
    if (analysis.intentType === 'Seeking Help') {
      suggestions.push({
        type: 'response',
        message: 'Helper response: "What kind of support would be most helpful right now? I\'m here to listen or help brainstorm."',
        urgency: 'high',
        icon: '🎯'
      });
    }

    return suggestions;
  };

  const selectWellnessActivity = (analysis: EnhancedStressAnalysis): string | null => {
    const activities = [
      'Maybe try a quick 2-minute breathing exercise? Inhale for 4, hold for 4, exhale for 6.',
      'Sometimes a short walk can help clear your head. Even 5 minutes outside can make a difference.',
      'Would it help to write down what you\'re feeling? Sometimes getting it out of your head helps.',
      'Have you tried the 5-4-3-2-1 grounding technique? It can help when feeling overwhelmed.'
    ];

    if (analysis.moodType === 'Anxious') {
      return 'Try the 5-4-3-2-1 technique: Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.';
    }
    
    if (analysis.moodType === 'Overwhelmed') {
      return 'Consider breaking your tasks into tiny steps. What\'s one small thing you could do right now?';
    }

    return activities[Math.floor(Math.random() * activities.length)];
  };

  const getSuggestionColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'border-red-500 bg-red-50 text-red-800';
      case 'high': return 'border-orange-500 bg-orange-50 text-orange-800';
      case 'medium': return 'border-blue-500 bg-blue-50 text-blue-800';
      default: return 'border-green-500 bg-green-50 text-green-800';
    }
  };

  const handleSuggestionClick = (suggestion: CoachSuggestion) => {
    // Extract the actual message part (remove prefixes like "Suggested response:")
    const cleanMessage = suggestion.message.replace(/^(Suggested response: |Suggest: |Helper response: |Consider a calming tone: |Validation approach: |Supportive response: |Helpful response: )"(.+)"$/, '$2');
    onSuggestionAccept(cleanMessage);
  };

  if (!showCoach || suggestions.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">🤖</span>
          <h3 className="text-sm font-semibold text-gray-900">AI Conversation Coach</h3>
        </div>
        <button
          onClick={() => setShowCoach(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Loading State */}
      {isAnalyzing && (
        <div className="flex items-center space-x-2 text-gray-600 mb-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm">Analyzing tone...</span>
        </div>
      )}

      {/* Suggestions */}
      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-shadow ${getSuggestionColor(suggestion.urgency)}`}
            onClick={() => handleSuggestionClick(suggestion)}
          >
            <div className="flex items-start space-x-2">
              <span className="text-lg flex-shrink-0">{suggestion.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">
                  {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)} Suggestion
                </p>
                <p className="text-sm">
                  {suggestion.message}
                </p>
                {suggestion.urgency === 'critical' && (
                  <p className="text-xs mt-1 font-medium">
                    ⚡ High Priority - Consider immediate response
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Usage tip */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          💡 Click any suggestion to use it, or let it guide your response tone
        </p>
      </div>
    </div>
  );
}