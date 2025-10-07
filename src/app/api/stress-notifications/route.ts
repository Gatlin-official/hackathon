import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { userId, notification, timestamp } = await req.json()

    // Here you would typically store in Firebase
    // For now, we'll just acknowledge receipt
    console.log('Stress notification stored for user:', userId)

    return NextResponse.json({ 
      success: true, 
      message: 'Notification stored successfully' 
    })
  } catch (error) {
    console.error('Error storing stress notification:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to store notification' }, 
      { status: 500 }
    )
  }
}