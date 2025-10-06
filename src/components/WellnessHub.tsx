import React, { useState, useEffect } from 'react';
import { EnhancedStressAnalysis, WellnessActivity } from '../lib/enhanced-stress-analyzer';

interface WellnessHubProps {
  currentStressLevel: number;
  currentMood: string;
  recentAnalysis?: EnhancedStressAnalysis;
  className?: string;
}

interface WellnessResource {
  id: string;
  title: string;
  description: string;
  type: 'breathing' | 'meditation' | 'exercise' | 'mindfulness' | 'emergency';
  duration: string;
  difficulty: 'easy' | 'medium' | 'hard';
  icon: string;
  instructions: string[];
  urgency: 'low' | 'medium' | 'high';
}

export default function WellnessHub({ currentStressLevel, currentMood, recentAnalysis, className = '' }: WellnessHubProps) {
  const [selectedActivity, setSelectedActivity] = useState<WellnessResource | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  const wellnessResources: WellnessResource[] = [
    // Emergency Resources
    {
      id: 'crisis-support',
      title: 'Crisis Support',
      description: 'Immediate help and resources for crisis situations',
      type: 'emergency',
      duration: 'Immediate',
      difficulty: 'easy',
      icon: '🚨',
      urgency: 'high',
      instructions: [
        'National Suicide Prevention Lifeline: 988',
        'Crisis Text Line: Text HOME to 741741',
        'Campus Counseling Center: [Contact Info]',
        'Emergency Services: 911',
        'You are not alone. Professional help is available 24/7.'
      ]
    },
    
    // Breathing Exercises
    {
      id: 'box-breathing',
      title: '4-7-8 Breathing',
      description: 'Calming breath technique for immediate stress relief',
      type: 'breathing',
      duration: '5 minutes',
      difficulty: 'easy',
      icon: '💨',
      urgency: 'high',
      instructions: [
        'Sit comfortably with your back straight',
        'Exhale completely through your mouth',
        'Close your mouth and inhale through your nose for 4 counts',
        'Hold your breath for 7 counts',
        'Exhale through your mouth for 8 counts',
        'Repeat this cycle 3-4 times'
      ]
    },
    
    {
      id: 'belly-breathing',
      title: 'Belly Breathing',
      description: 'Deep diaphragmatic breathing for anxiety relief',
      type: 'breathing',
      duration: '10 minutes',
      difficulty: 'easy',
      icon: '🫁',
      urgency: 'medium',
      instructions: [
        'Lie down or sit comfortably',
        'Place one hand on your chest, one on your belly',
        'Breathe slowly through your nose',
        'Feel your belly rise more than your chest',
        'Exhale slowly through pursed lips',
        'Continue for 5-10 breaths'
      ]
    },

    // Mindfulness & Meditation
    {
      id: '5-4-3-2-1-grounding',
      title: '5-4-3-2-1 Grounding',
      description: 'Sensory grounding technique for anxiety and panic',
      type: 'mindfulness',
      duration: '5 minutes',
      difficulty: 'easy',
      icon: '🌟',
      urgency: 'high',
      instructions: [
        'Look around and name 5 things you can see',
        'Notice 4 things you can touch',
        'Listen for 3 things you can hear',
        'Find 2 things you can smell',
        'Identify 1 thing you can taste',
        'Take slow, deep breaths throughout'
      ]
    },

    {
      id: 'body-scan',
      title: 'Progressive Body Scan',
      description: 'Release tension by focusing on each body part',
      type: 'meditation',
      duration: '15 minutes',
      difficulty: 'medium',
      icon: '🧘',
      urgency: 'medium',
      instructions: [
        'Lie down comfortably and close your eyes',
        'Start with your toes, notice any tension',
        'Slowly move up: feet, calves, thighs',
        'Continue to hips, abdomen, chest',
        'Move to arms, shoulders, neck, face',
        'Release tension in each area as you go'
      ]
    },

    // Movement & Exercise
    {
      id: 'desk-stretches',
      title: 'Desk Stretches',
      description: 'Quick stretches to release physical tension',
      type: 'exercise',
      duration: '5 minutes',
      difficulty: 'easy',
      icon: '🤸',
      urgency: 'low',
      instructions: [
        'Neck rolls: Slowly roll your head in circles',
        'Shoulder shrugs: Lift shoulders to ears, release',
        'Arm circles: Extend arms, make small circles',
        'Wrist stretches: Extend arm, pull hand back gently',
        'Spinal twist: Sit tall, twist gently left and right',
        'Deep breathing between each stretch'
      ]
    },

    {
      id: 'walking-meditation',
      title: 'Mindful Walking',
      description: 'Combine movement with mindfulness',
      type: 'exercise',
      duration: '10 minutes',
      difficulty: 'easy',
      icon: '🚶',
      urgency: 'medium',
      instructions: [
        'Find a quiet path 10-20 steps long',
        'Walk slowly, focusing on each step',
        'Feel your feet touching the ground',
        'Notice your breathing and body movement',
        'Turn around mindfully at each end',
        'Continue for 5-10 minutes'
      ]
    }
  ];

  // Filter activities based on current state
  const getRecommendedActivities = (): WellnessResource[] => {
    let filtered = wellnessResources;

    // Crisis situations get emergency resources first
    if (currentStressLevel >= 8 || recentAnalysis?.crisisIndicators) {
      return wellnessResources.filter(r => r.type === 'emergency' || r.urgency === 'high');
    }

    // High stress gets immediate relief activities
    if (currentStressLevel >= 6) {
      filtered = wellnessResources.filter(r => 
        r.urgency === 'high' || r.type === 'breathing' || r.type === 'mindfulness'
      );
    }

    // Mood-specific recommendations
    if (currentMood === 'Anxious') {
      filtered = wellnessResources.filter(r => 
        r.type === 'breathing' || r.type === 'mindfulness' || r.id === '5-4-3-2-1-grounding'
      );
    } else if (currentMood === 'Overwhelmed') {
      filtered = wellnessResources.filter(r => 
        r.type === 'meditation' || r.type === 'breathing' || r.difficulty === 'easy'
      );
    }

    return filtered.sort((a, b) => {
      const urgencyOrder = { high: 3, medium: 2, low: 1 };
      return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    });
  };

  const startTimer = (duration: string) => {
    const minutes = parseInt(duration) || 5;
    setTimer(minutes * 60);
    setIsActive(true);
    
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          setIsActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setTimerInterval(interval);
  };

  const stopTimer = () => {
    setIsActive(false);
    setTimer(0);
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getActivityColor = (activity: WellnessResource) => {
    if (activity.type === 'emergency') return 'border-red-500 bg-red-50';
    if (activity.urgency === 'high') return 'border-orange-500 bg-orange-50';
    if (activity.urgency === 'medium') return 'border-blue-500 bg-blue-50';
    return 'border-green-500 bg-green-50';
  };

  const recommendedActivities = getRecommendedActivities();

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🌱</span>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Wellness Hub</h2>
            <p className="text-sm text-gray-600">
              Personalized activities for stress: {currentStressLevel}/10 • Mood: {currentMood}
            </p>
          </div>
        </div>
        
        {/* Timer Display */}
        {isActive && (
          <div className="flex items-center space-x-2 bg-blue-100 px-4 py-2 rounded-lg">
            <span className="text-blue-600 font-mono text-lg">{formatTime(timer)}</span>
            <button
              onClick={stopTimer}
              className="text-blue-600 hover:text-blue-800"
            >
              ⏹️
            </button>
          </div>
        )}
      </div>

      {/* Crisis Alert */}
      {currentStressLevel >= 8 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-red-600 text-xl">⚠️</span>
            <h3 className="text-red-800 font-semibold">High Stress Detected</h3>
          </div>
          <p className="text-red-700 text-sm mb-3">
            Your stress level is very high. Please consider immediate support or crisis resources.
          </p>
          <button
            onClick={() => setSelectedActivity(wellnessResources.find(r => r.id === 'crisis-support') || null)}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Get Crisis Support
          </button>
        </div>
      )}

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {recommendedActivities.slice(0, 6).map((activity) => (
          <div
            key={activity.id}
            className={`p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${getActivityColor(activity)}`}
            onClick={() => setSelectedActivity(activity)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{activity.icon}</span>
              <div className="flex items-center space-x-1">
                <span className="text-xs bg-white px-2 py-1 rounded-full text-gray-600">
                  {activity.duration}
                </span>
                {activity.urgency === 'high' && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                    Priority
                  </span>
                )}
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{activity.title}</h3>
            <p className="text-sm text-gray-600">{activity.description}</p>
          </div>
        ))}
      </div>

      {/* Activity Details Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{selectedActivity.icon}</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedActivity.title}</h3>
                    <p className="text-gray-600">{selectedActivity.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Activity Info */}
              <div className="flex items-center space-x-4 mb-6 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-gray-600">Duration</p>
                  <p className="font-semibold">{selectedActivity.duration}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Difficulty</p>
                  <p className="font-semibold capitalize">{selectedActivity.difficulty}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Type</p>
                  <p className="font-semibold capitalize">{selectedActivity.type}</p>
                </div>
              </div>

              {/* Instructions */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Instructions:</h4>
                <ol className="space-y-2">
                  {selectedActivity.instructions.map((instruction, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </span>
                      <p className="text-gray-700">{instruction}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                {selectedActivity.type !== 'emergency' && (
                  <button
                    onClick={() => startTimer(selectedActivity.duration)}
                    disabled={isActive}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    {isActive ? 'Timer Running...' : `Start ${selectedActivity.duration} Timer`}
                  </button>
                )}
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}