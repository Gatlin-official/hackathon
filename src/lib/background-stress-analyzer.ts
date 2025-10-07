'use client'

import { geminiStressAnalyzer } from './gemini-stress-analyzer'

interface BackgroundAnalysisRequest {
  messageId: string
  text: string
  userId: string
  userEmail: string
  timestamp: Date
  groupId: string
  conversationContext?: string[]
}

interface AnalysisResult {
  messageId: string
  stressScore: number
  stressLevel: 'low' | 'moderate' | 'high' | 'severe'
  emotions: string[]
  remedies: string[]
  needsNotification: boolean
  timestamp?: string
  userId?: string
}

export class BackgroundStressAnalyzer {
  private analysisQueue: BackgroundAnalysisRequest[] = []
  private processing = false
  private onNotificationCallback?: (userId: string, notification: any) => void

  setNotificationCallback(callback: (userId: string, notification: any) => void) {
    this.onNotificationCallback = callback
  }

  // Add message to analysis queue
  queueMessage(request: BackgroundAnalysisRequest) {
    this.analysisQueue.push(request)
    this.processQueue()
  }

  private async processQueue() {
    if (this.processing || this.analysisQueue.length === 0) return

    this.processing = true

    while (this.analysisQueue.length > 0) {
      const request = this.analysisQueue.shift()!
      
      try {
        await this.analyzeMessage(request)
      } catch (error) {
        console.error('Background analysis failed for message:', request.messageId, error)
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    this.processing = false
  }

  private async analyzeMessage(request: BackgroundAnalysisRequest) {
    try {
      // Perform Gemini AI analysis
      const analysis = await geminiStressAnalyzer.analyzeStress({
        message: request.text,
        userEmail: request.userEmail,
        timeOfDay: request.timestamp.toLocaleTimeString(),
        conversationContext: 'background_analysis',
        previousMessages: request.conversationContext || []
      })

      // Store analysis result in localStorage for persistence
      this.storeAnalysisResult({
        messageId: request.messageId,
        stressScore: analysis.stressScore,
        stressLevel: analysis.stressLevel,
        emotions: analysis.emotions,
        remedies: analysis.remedies,
        needsNotification: analysis.stressScore > 5
      })

      // If stress score > 5, create notification
      if (analysis.stressScore > 5) {
        const personalizedRemedies = geminiStressAnalyzer.generatePersonalizedRemedies(
          analysis, 
          { backgroundAnalysis: true, messageId: request.messageId }
        )

        const notification = {
          userId: request.userEmail,
          message: this.generateNotificationMessage(analysis.stressScore, analysis.stressLevel),
          stressScore: analysis.stressScore,
          stressLevel: analysis.stressLevel,
          remedies: personalizedRemedies,
          originalMessage: request.text,
          emotions: analysis.emotions,
          urgency: analysis.urgency
        }

        // Send notification through callback
        if (this.onNotificationCallback) {
          this.onNotificationCallback(request.userEmail, notification)
        }

        // Also store in Firebase for persistence
        await this.storeNotificationInFirebase(request.userEmail, notification)
      }

    } catch (error) {
      console.error('Failed to analyze message:', error)
    }
  }

  private generateNotificationMessage(stressScore: number, stressLevel: string): string {
    if (stressScore >= 8) {
      return "We noticed signs of significant stress in your recent message. Your wellbeing matters - here are some immediate steps that might help."
    } else if (stressScore >= 7) {
      return "Your recent message suggests you might be experiencing some stress. Here are personalized suggestions to support you."
    } else {
      return "We detected some stress indicators in your message. Here are some gentle strategies that might be helpful."
    }
  }

  private storeAnalysisResult(result: AnalysisResult) {
    try {
      const stored = localStorage.getItem('stress_analysis_results') || '[]'
      const results = JSON.parse(stored)
      results.push({
        ...result,
        timestamp: new Date().toISOString()
      })
      
      // Keep only last 100 results
      if (results.length > 100) {
        results.splice(0, results.length - 100)
      }
      
      localStorage.setItem('stress_analysis_results', JSON.stringify(results))
    } catch (error) {
      console.error('Failed to store analysis result:', error)
    }
  }

  private async storeNotificationInFirebase(userId: string, notification: any) {
    try {
      // This would integrate with your Firebase setup
      const response = await fetch('/api/stress-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          notification,
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to store notification in Firebase')
      }
    } catch (error) {
      console.error('Failed to store notification in Firebase:', error)
      // Fallback to localStorage if Firebase fails
      this.storeNotificationLocally(userId, notification)
    }
  }

  private storeNotificationLocally(userId: string, notification: any) {
    try {
      const key = `stress_notifications_${userId}`
      const stored = localStorage.getItem(key) || '[]'
      const notifications = JSON.parse(stored)
      
      notifications.unshift({
        ...notification,
        id: `stress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        isRead: false
      })

      // Keep only last 50 notifications per user
      if (notifications.length > 50) {
        notifications.splice(50)
      }

      localStorage.setItem(key, JSON.stringify(notifications))
    } catch (error) {
      console.error('Failed to store notification locally:', error)
    }
  }

  // Get analysis history for a user
  getAnalysisHistory(userId: string): AnalysisResult[] {
    try {
      const stored = localStorage.getItem('stress_analysis_results') || '[]'
      const results = JSON.parse(stored)
      return results.filter((result: any) => result.userId === userId)
    } catch (error) {
      console.error('Failed to get analysis history:', error)
      return []
    }
  }

  // Get stress trends for analytics
  getStressTrends(userId: string, days: number = 7): any {
    const history = this.getAnalysisHistory(userId)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    const recentResults = history.filter(result => 
      new Date(result.timestamp || 0) > cutoff
    )

    return {
      totalMessages: recentResults.length,
      averageStress: recentResults.reduce((sum, r) => sum + r.stressScore, 0) / recentResults.length || 0,
      highStressCount: recentResults.filter(r => r.stressScore >= 7).length,
      commonEmotions: this.getTopEmotions(recentResults),
      dailyTrends: this.getDailyTrends(recentResults)
    }
  }

  private getTopEmotions(results: AnalysisResult[]): string[] {
    const emotionCount: Record<string, number> = {}
    
    results.forEach(result => {
      result.emotions.forEach(emotion => {
        emotionCount[emotion] = (emotionCount[emotion] || 0) + 1
      })
    })

    return Object.entries(emotionCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([emotion]) => emotion)
  }

  private getDailyTrends(results: AnalysisResult[]): any[] {
    const dailyData: Record<string, { count: number, totalStress: number }> = {}

    results.forEach(result => {
      const date = new Date(result.timestamp || 0).toDateString()
      if (!dailyData[date]) {
        dailyData[date] = { count: 0, totalStress: 0 }
      }
      dailyData[date].count++
      dailyData[date].totalStress += result.stressScore
    })

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      averageStress: data.totalStress / data.count,
      messageCount: data.count
    }))
  }
}

export const backgroundStressAnalyzer = new BackgroundStressAnalyzer()