import { NextRequest, NextResponse } from 'next/server'
import { SupportiveAICompanion } from '@/lib/supportive-ai-companion'

export async function POST(request: NextRequest) {
  try {
    const { message, stressScore, emotions, context } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const companion = new SupportiveAICompanion()
    
    const response = await companion.generateSupportiveResponse({
      content: message,
      stressScore: stressScore || undefined,
      emotions: emotions || [],
      context: context || 'chat'
    })

    return NextResponse.json({
      success: true,
      response: response
    })

  } catch (error) {
    console.error('Error generating supportive response:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate supportive response',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Also support GET requests for health checks
export async function GET() {
  return NextResponse.json({
    message: 'Supportive AI Companion endpoint is running',
    status: 'healthy'
  })
}