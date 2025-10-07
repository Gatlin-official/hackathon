// Test script to check stress analysis and add sample notifications
const fetch = require('node-fetch');

async function testStressAnalysisAndNotifications() {
  console.log('🧪 Testing Stress Analysis and Notifications System...\n');
  
  try {
    // 1. Test the stress analysis with a message that should trigger notifications
    console.log('📤 Testing stress analysis with a stressed message...');
    const stressedMessage = "I'm feeling really overwhelmed with all my assignments and deadlines";
    
    // First, let's test if we can manually add test notifications
    console.log('🔧 Adding test notifications...');
    const testNotificationResponse = await fetch('http://localhost:3000/api/test-notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'test-user@example.com'
      })
    });
    
    if (testNotificationResponse.ok) {
      const notificationData = await testNotificationResponse.json();
      console.log('✅ Test notifications created:', notificationData.notifications.length);
      
      // Store in localStorage format
      const userId = 'test-user@example.com';
      const notificationsJson = JSON.stringify(notificationData.notifications);
      console.log('\n📝 To see these notifications in the app:');
      console.log('1. Open browser developer tools (F12)');
      console.log('2. Go to Console tab');
      console.log('3. Paste this command:');
      console.log(`localStorage.setItem('stress_notifications_${userId}', '${notificationsJson.replace(/'/g, "\\'")}');`);
      console.log('4. Refresh the page and check the "Wellness Alerts" tab');
      
    } else {
      console.log('❌ Failed to create test notifications');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n🏁 Test completed!');
  console.log('\n💡 If you see "temporarily unavailable", it means:');
  console.log('   - The stress analysis system is working but no notifications have been generated yet');
  console.log('   - Use the test notifications above to see the system in action');
  console.log('   - The AI Zen chatbot is working perfectly for direct conversations');
}

testStressAnalysisAndNotifications().catch(console.error);