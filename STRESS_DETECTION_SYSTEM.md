# 🧠 AI Stress Detection System

## Overview

The AI Stress Detection System is an advanced feature integrated into the Student Discussion Groups app that uses **Google's Gemini AI** to analyze messages in real-time for stress indicators. When users send messages, the system:

1. **Analyzes** each message for stress levels, emotions, and intentions
2. **Scores** stress on a scale of 1-10 
3. **Generates** personalized remedies and coping strategies
4. **Sends** private wellness notifications when stress levels are concerning (>5)

## 🌟 Key Features

### Real-Time Message Analysis
- **Gemini AI Integration**: Advanced natural language processing
- **Stress Scoring**: 1-10 scale with contextual understanding
- **Emotion Detection**: Identifies specific emotions (anxiety, overwhelm, etc.)
- **Intention Recognition**: Understands if user needs advice, is venting, or requires urgent help

### Smart Notifications System
- **Private Dashboard Alerts**: Stress notifications appear only in user's personal dashboard
- **Personalized Remedies**: AI-generated coping strategies based on detected stress triggers
- **Urgency Levels**: Normal, Attention, or Urgent categorization
- **Browser Notifications**: For high-priority stress alerts

### Privacy-First Design
- **Individual Privacy**: Stress analysis is private to each user
- **Secure Storage**: Notifications stored locally with optional cloud sync
- **No Stigma**: Stress indicators only visible to message sender

## 🚀 How It Works

### 1. Message Analysis Pipeline
```
User sends message → Gemini AI analysis → Stress scoring → Personalized remedies → Private notification
```

### 2. Stress Level Classification
- **1-3 (Low)**: Calm, positive, content - Green indicators
- **4-6 (Moderate)**: Some concern, minor stress - Yellow indicators  
- **7-8 (High)**: Significant stress, needs support - Orange indicators
- **9-10 (Severe)**: Crisis level, immediate attention - Red indicators

### 3. Intelligent Context Understanding
The system considers:
- **Academic pressure** (exams, deadlines, assignments)
- **Social issues** (relationships, peer pressure)
- **Personal struggles** (family, health, finances)
- **Time management** and workload
- **Conversation context** from recent messages

## 💡 Personalized Remedy Examples

### For Academic Stress:
- "Break large tasks into smaller, manageable chunks"
- "Use the Pomodoro Technique (25min work, 5min break)"
- "Create a realistic study schedule with buffer time"

### For Social Stress:
- "Join a study group or student organization"
- "Practice self-compassion and positive self-talk"
- "Reach out to one person you trust today"

### For High Stress/Crisis:
- "🚨 Consider contacting your campus counseling center"
- "Use grounding: name 5 things you see, 4 you hear, 3 you touch"
- "If thoughts of self-harm occur, contact emergency services immediately"

## 🛡️ Privacy & Security

### Data Protection
- **No Message Storage**: Original messages not stored long-term
- **Local Notifications**: Stored in browser localStorage by default
- **Encrypted Transit**: All AI communications encrypted
- **User Control**: Users can delete notifications anytime

### Ethical AI Use
- **Supportive Intent**: Focus on helping, not judging
- **Human Oversight**: Encourages professional help for serious concerns
- **Transparent Process**: Users understand when and how analysis occurs

## 🔧 Technical Implementation

### Core Components
1. **GeminiStressAnalyzer** (`/src/lib/gemini-stress-analyzer.ts`)
2. **StressNotifications Hook** (`/src/hooks/useStressNotifications.ts`)
3. **NotificationsPanel Component** (`/src/components/StressNotificationsPanel.tsx`)

### Integration Points
- **GroupChat**: Real-time message analysis during chat
- **PersonalDashboard**: Private notifications display
- **SmartMessageInput**: Optional stress-aware input features

### API Configuration
```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

## 🎯 Use Cases

### For Students
- **Exam Period Support**: Detects academic stress and provides study techniques
- **Social Anxiety**: Recognizes isolation patterns, suggests connection strategies
- **General Wellness**: Daily mood tracking and personalized wellness tips

### For Educators/Counselors
- **Early Intervention**: System helps identify students who might need support
- **Resource Distribution**: Automated delivery of appropriate coping strategies
- **Crisis Prevention**: Urgent alerts help prevent escalation

### For Institutions
- **Student Wellbeing**: Proactive mental health support
- **Resource Optimization**: Data-driven insights into student stress patterns
- **Crisis Response**: Early warning system for mental health concerns

## 📊 Dashboard Features

### Wellness Alerts Tab
- **Notification History**: View all stress alerts chronologically
- **Filter Options**: All, Unread, Urgent notifications
- **Detailed Analysis**: Full breakdown of stress factors and remedies
- **Action Tracking**: Mark as helpful, request more support

### Visual Indicators
- **Color-Coded Alerts**: Green (low) → Red (severe)
- **Emoji Status**: 🟢😌 → 🔴😰 stress level indicators
- **Priority Badges**: 🚨 for urgent, ⚠️ for attention needed

## 🚀 Getting Started

### 1. Setup Gemini API
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Generate a new API key
3. Add to your `.env.local`: `NEXT_PUBLIC_GEMINI_API_KEY=your_key`

### 2. Enable Notifications
1. Allow browser notifications when prompted
2. Check "Wellness Alerts" tab in Personal Dashboard
3. Send a test message with stress keywords

### 3. Customize Settings
1. Adjust notification preferences
2. Set stress threshold levels
3. Choose remedy categories

## 🔮 Future Enhancements

### Planned Features
- **Mood Trends**: Weekly/monthly stress pattern analysis
- **Peer Support**: Anonymous peer remedy sharing
- **Professional Integration**: Direct counselor referral system
- **Wellness Challenges**: Gamified stress management activities

### AI Improvements
- **Multi-language Support**: Analysis in multiple languages
- **Voice Analysis**: Stress detection from voice messages
- **Contextual Learning**: AI learns individual stress patterns
- **Predictive Wellness**: Proactive stress prevention suggestions

## 📝 License & Ethics

### Responsible AI Use
- **Student Consent**: Clear opt-in process for stress analysis
- **Data Minimization**: Only analyze what's necessary
- **Professional Boundaries**: AI supplements, doesn't replace human support
- **Crisis Protocols**: Clear escalation paths for serious concerns

This stress detection system represents a thoughtful integration of AI technology with student mental health support, prioritizing privacy, effectiveness, and genuine care for student wellbeing.