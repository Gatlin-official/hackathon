// Test script to verify the wellness chat API is working
// Run this with: node test-wellness-api.js

const fetch = require('node-fetch');

async function testWellnessAPI() {
  console.log('🧪 Testing Wellness Chat API...\n');
  
  const testMessages = [
    'hi',
    'hello there', 
    'I feel really stressed',
    'I am having a panic attack',
    'everything is great!'
  ];
  
  for (const message of testMessages) {
    console.log(`\n📤 Testing: "${message}"`);
    
    try {
      const response = await fetch('http://localhost:3000/api/wellness-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          conversationHistory: [],
          userProfile: { name: 'Test User' }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Response: "${data.response.message}"`);
        console.log(`🎯 Emotion: ${data.response.emotion || 'N/A'}`);
        console.log(`⚡ Crisis Level: ${data.response.crisisLevel || 'N/A'}`);
      } else {
        console.log(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🏁 Test completed!');
}

testWellnessAPI().catch(console.error);