// Quick fix to add test stress notifications
// Paste this into browser console to test the notifications system

function addTestNotifications() {
  // Get current user email or use a test one
  const userEmail = 'roshanimmanuel24@karunya.edu.in'; // Replace with your actual email
  
  const testNotifications = [
    {
      id: `stress_${Date.now()}_1`,
      userId: userEmail,
      message: 'We noticed you mentioned feeling stressed about exams. Here are some personalized suggestions to help you feel better.',
      stressScore: 6,
      stressLevel: 'moderate',
      remedies: [
        '📚 Study Strategy: Create focused 2-hour study blocks with 15-min breaks',
        '🧘 Try a 5-minute breathing exercise before studying',
        '🚶 Take a gentle walk outside to clear your mind',
        '💧 Stay hydrated and have a healthy snack'
      ],
      originalMessage: 'i have exams tmr and i have many topics to complete im pretty stressed',
      emotions: ['anxiety', 'overwhelm', 'academic-stress'],
      urgency: 'attention',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      isRead: false
    },
    {
      id: `stress_${Date.now()}_2`,
      userId: userEmail,
      message: '🚨 High stress levels detected. Please consider taking a break and trying these coping strategies.',
      stressScore: 8,
      stressLevel: 'high',
      remedies: [
        '🌬️ Practice the 4-7-8 breathing technique (breathe in 4, hold 7, out 8)',
        '📞 Reach out to a friend, family member, or counselor',
        '🧘 Try a 5-minute guided meditation',
        '🆘 Remember: Campus counseling services are available if you need support'
      ],
      originalMessage: 'I cant handle this anymore everything is falling apart',
      emotions: ['panic', 'overwhelm', 'despair'],
      urgency: 'urgent',
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      isRead: false
    },
    {
      id: `stress_${Date.now()}_3`,
      userId: userEmail,
      message: '🌟 Great job managing your stress! Keep up the positive momentum.',
      stressScore: 3,
      stressLevel: 'low',
      remedies: [
        '✅ Maintain your current healthy habits',
        '💧 Stay hydrated throughout the day',
        '😴 Continue regular sleep schedule',
        '🏃 Keep up with physical activity'
      ],
      originalMessage: 'Feeling much better today, got good sleep and ready for the day',
      emotions: ['contentment', 'optimism', 'relief'],
      urgency: 'normal',
      timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
      isRead: false
    }
  ];

  // Store notifications in localStorage
  localStorage.setItem(`stress_notifications_${userEmail}`, JSON.stringify(testNotifications));
  
  console.log('✅ Added 3 test wellness notifications!');
  console.log('🔄 Refresh the page and go to Personal Dashboard > Wellness Alerts tab to see them');
  
  // Also show browser notification
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Wellness Check-in', {
      body: 'Test notifications added! Check your Personal Dashboard.',
      tag: 'test-wellness-notification'
    });
  }
  
  return testNotifications;
}

// Auto-run the function
const notifications = addTestNotifications();
console.log('Test notifications:', notifications);