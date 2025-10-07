// Test Google Calendar Integration
const fetch = require('node-fetch');

async function testCalendarAPI() {
  try {
    console.log('🧪 Testing Calendar API...');
    
    // Test access check
    console.log('\n1️⃣ Testing access check...');
    const checkResponse = await fetch('http://localhost:3000/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check_access' })
    });
    
    const checkResult = await checkResponse.json();
    console.log('Access Check Result:', checkResult);
    
    // Test event creation
    console.log('\n2️⃣ Testing event creation...');
    const testEvents = [{
      title: 'Test Calendar Integration',
      start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      end: new Date(Date.now() + 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(), // Tomorrow + 90 min
      description: 'This is a test event to verify Google Calendar integration',
      type: 'study'
    }];
    
    const createResponse = await fetch('http://localhost:3000/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'create_events',
        events: testEvents
      })
    });
    
    const createResult = await createResponse.json();
    console.log('Create Events Result:', createResult);
    
    if (!createResult.simulationMode) {
      console.log('\n✅ SUCCESS: Real Google Calendar integration is working!');
      console.log('Events should appear in your Google Calendar now.');
    } else {
      console.log('\n⚠️  Currently in simulation mode.');
      console.log('To enable real integration, make sure you:');
      console.log('1. Sign in with Google Calendar permissions');
      console.log('2. Grant calendar access when prompted');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCalendarAPI();