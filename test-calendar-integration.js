// Test the full calendar integration flow
async function testCalendarIntegration() {
  console.log('🧪 Testing Calendar Integration Flow...')
  
  // Test 1: Wellness API with calendar detection
  console.log('\n1️⃣ Testing wellness API with study plan request...')
  try {
    const response = await fetch('http://localhost:3000/api/wellness-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "I'm stressed about my chemistry exam next Friday. Can you help me create a study plan?",
        conversationHistory: [],
        userProfile: { name: "Test User" }
      })
    })
    
    const data = await response.json()
    console.log('✅ Wellness API Response:')
    console.log('- Message:', data.response.message.substring(0, 100) + '...')
    console.log('- Calendar Suggestion:', data.response.calendarSuggestion)
    
    if (data.response.calendarSuggestion && data.response.calendarSuggestion.needed) {
      console.log('🎉 Calendar suggestion detected successfully!')
      
      // Test 2: Calendar API to generate events
      console.log('\n2️⃣ Testing calendar API to generate study plan...')
      const calendarResponse = await fetch('http://localhost:3000/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_study_plan',
          subject: data.response.calendarSuggestion.subject,
          examDate: data.response.calendarSuggestion.examDate || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          stressLevel: data.response.calendarSuggestion.stressLevel || 7
        })
      })
      
      const calendarData = await calendarResponse.json()
      console.log('✅ Calendar API Response:')
      console.log('- Success:', calendarData.success)
      console.log('- Events Generated:', calendarData.events?.length || 0)
      console.log('- Sample Event:', calendarData.events?.[0]?.title || 'None')
      
      if (calendarData.success && calendarData.events?.length > 0) {
        console.log('🎉 Calendar events generated successfully!')
        
        // Test 3: Calendar creation simulation
        console.log('\n3️⃣ Testing calendar creation...')
        const createResponse = await fetch('http://localhost:3000/api/calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_events',
            events: calendarData.events.slice(0, 5)
          })
        })
        
        const createData = await createResponse.json()
        console.log('✅ Calendar Creation Response:')
        console.log('- Success:', createData.success)
        console.log('- Created Events:', createData.createdEvents)
        console.log('- Message:', createData.message)
        
        if (createData.success) {
          console.log('\n🌟 FULL INTEGRATION TEST PASSED! 🌟')
          console.log('✅ Wellness chat detects calendar needs')
          console.log('✅ Calendar API generates study plans')
          console.log('✅ Calendar creation works properly')
          console.log('\n🎯 Ready for UI testing!')
        }
      }
    } else {
      console.log('❌ Calendar suggestion not detected')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testCalendarIntegration()