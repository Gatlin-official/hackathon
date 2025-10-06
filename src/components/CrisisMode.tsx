import React, { useState, useEffect } from 'react';
import { EnhancedStressAnalysis } from '../lib/enhanced-stress-analyzer';

interface CrisisModeProps {
  analysis: EnhancedStressAnalysis;
  onDismiss: () => void;
  onGetHelp: () => void;
  className?: string;
}

interface CrisisResource {
  type: 'hotline' | 'text' | 'chat' | 'emergency' | 'campus';
  name: string;
  contact: string;
  description: string;
  availability: string;
  urgent?: boolean;
}

export default function CrisisMode({ analysis, onDismiss, onGetHelp, className = '' }: CrisisModeProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedResource, setSelectedResource] = useState<CrisisResource | null>(null);

  useEffect(() => {
    if (analysis.crisisIndicators || analysis.stressLevel >= 8) {
      setIsVisible(true);
    }
  }, [analysis]);

  const crisisResources: CrisisResource[] = [
    {
      type: 'hotline',
      name: 'National Suicide Prevention Lifeline',
      contact: '988',
      description: 'Free and confidential emotional support 24/7',
      availability: '24/7',
      urgent: true
    },
    {
      type: 'text',
      name: 'Crisis Text Line',
      contact: 'Text HOME to 741741',
      description: 'Free, 24/7 crisis counseling via text message',
      availability: '24/7',
      urgent: true
    },
    {
      type: 'chat',
      name: 'National Suicide Prevention Chat',
      contact: 'suicidepreventionlifeline.org/chat',
      description: 'Online chat with trained crisis counselors',
      availability: '24/7'
    },
    {
      type: 'emergency',
      name: 'Emergency Services',
      contact: '911',
      description: 'For immediate medical or safety emergencies',
      availability: '24/7',
      urgent: true
    },
    {
      type: 'campus',
      name: 'Campus Counseling Center',
      contact: '(Campus Number)',
      description: 'Professional counseling services for students',
      availability: 'Business Hours'
    }
  ];

  const getSeverityMessage = () => {
    if (analysis.crisisIndicators) {
      return {
        title: '🚨 Crisis Support Needed',
        message: 'Your message indicates you may be in distress. Please reach out for immediate support.',
        color: 'red'
      };
    } else if (analysis.stressLevel >= 8) {
      return {
        title: '⚠️ High Stress Alert',
        message: 'Your stress level is very high. Consider speaking with someone who can help.',
        color: 'orange'
      };
    }
    return null;
  };

  const handleResourceClick = (resource: CrisisResource) => {
    if (resource.type === 'hotline' || resource.type === 'emergency') {
      // For phone numbers, try to open tel: link
      window.open(`tel:${resource.contact.replace(/[^\d]/g, '')}`);
    } else if (resource.type === 'chat') {
      // For websites, open in new tab
      window.open(`https://${resource.contact}`, '_blank');
    } else if (resource.type === 'text') {
      // For text services, show instructions
      setSelectedResource(resource);
    } else {
      setSelectedResource(resource);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  const severityInfo = getSeverityMessage();

  if (!isVisible || !severityInfo) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
        {/* Crisis Modal */}
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl mx-4">
          <div className={`bg-white rounded-lg shadow-2xl ${className}`}>
            {/* Header */}
            <div className={`p-6 rounded-t-lg ${
              severityInfo.color === 'red' ? 'bg-red-50 border-b border-red-200' : 'bg-orange-50 border-b border-orange-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-2xl font-bold ${
                    severityInfo.color === 'red' ? 'text-red-800' : 'text-orange-800'
                  }`}>
                    {severityInfo.title}
                  </h2>
                  <p className={`mt-2 ${
                    severityInfo.color === 'red' ? 'text-red-700' : 'text-orange-700'
                  }`}>
                    {severityInfo.message}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Immediate Support Resources
                </h3>
                <p className="text-gray-700 text-sm mb-4">
                  You don't have to face this alone. These resources are available to help you right now:
                </p>
              </div>

              {/* Crisis Resources */}
              <div className="space-y-3 mb-6">
                {crisisResources.map((resource, index) => (
                  <div
                    key={index}
                    onClick={() => handleResourceClick(resource)}
                    className={`p-4 border rounded-lg cursor-pointer hover:shadow-md transition-all ${
                      resource.urgent 
                        ? 'border-red-300 bg-red-50 hover:bg-red-100' 
                        : 'border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className={`font-semibold ${
                            resource.urgent ? 'text-red-800' : 'text-gray-900'
                          }`}>
                            {resource.name}
                          </h4>
                          {resource.urgent && (
                            <span className="px-2 py-1 bg-red-200 text-red-800 text-xs rounded-full font-medium">
                              PRIORITY
                            </span>
                          )}
                        </div>
                        <p className={`text-sm ${
                          resource.urgent ? 'text-red-700' : 'text-gray-600'
                        }`}>
                          {resource.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className={`font-mono text-sm ${
                            resource.urgent ? 'text-red-800' : 'text-gray-800'
                          }`}>
                            {resource.contact}
                          </p>
                          <span className="text-xs text-gray-500">
                            {resource.availability}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <span className="text-gray-400">→</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Safety Planning */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">🛡️ Safety First</h4>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Your safety and well-being are the top priority</li>
                  <li>• These feelings are temporary and will pass</li>
                  <li>• Professional help is available and effective</li>
                  <li>• You are not alone in this experience</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => handleResourceClick(crisisResources[0])} // Call lifeline
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-red-700 transition-colors"
                >
                  📞 Call 988 Now
                </button>
                <button
                  onClick={onGetHelp}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-blue-700 transition-colors"
                >
                  🤝 Find Support
                </button>
              </div>

              {/* Dismissal Option */}
              <div className="mt-4 text-center">
                <button
                  onClick={handleDismiss}
                  className="text-gray-500 hover:text-gray-700 text-sm underline"
                >
                  I'm safe right now, dismiss this alert
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resource Detail Modal */}
      {selectedResource && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-60">
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4">
            <div className="bg-white rounded-lg shadow-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedResource.name}
                </h3>
                <button
                  onClick={() => setSelectedResource(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4">
                <p className="text-gray-700 mb-3">{selectedResource.description}</p>
                
                {selectedResource.type === 'text' && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-semibold mb-2">How to use:</p>
                    <ol className="text-sm space-y-1">
                      <li>1. Open your text messaging app</li>
                      <li>2. Create a new message to: <strong>741741</strong></li>
                      <li>3. Type: <strong>HOME</strong></li>
                      <li>4. Send the message</li>
                      <li>5. A trained counselor will respond shortly</li>
                    </ol>
                  </div>
                )}

                {selectedResource.type === 'campus' && (
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> Please contact your specific campus counseling center. 
                      The general number provided should be replaced with your institution's direct line.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleResourceClick(selectedResource)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Use This Resource
                </button>
                <button
                  onClick={() => setSelectedResource(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
