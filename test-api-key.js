// Script to test Gemini API key directly
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function testApiKey() {
  console.log('🔍 Testing Gemini API key...');
  
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.log('❌ No API key found!');
    return;
  }
  
  console.log('🔑 API Key found:', apiKey.substring(0, 10) + '...');
  
  try {
    // Test API key by listing models
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API key is valid!');
      console.log('🤖 Available models:');
      
      if (data.models && data.models.length > 0) {
        data.models.forEach(model => {
          console.log(`  - ${model.name} (${model.displayName || 'No display name'})`);
        });
        
        // Find a working model
        const textModels = data.models.filter(model => 
          model.supportedGenerationMethods && 
          model.supportedGenerationMethods.includes('generateContent')
        );
        
        if (textModels.length > 0) {
          console.log('\n🎯 Recommended model:', textModels[0].name);
          return textModels[0].name;
        }
      } else {
        console.log('⚠️ No models found in response');
      }
    } else {
      console.log('❌ API key test failed:', data.error?.message || 'Unknown error');
    }
    
  } catch (error) {
    console.error('❌ Error testing API key:', error.message);
  }
}

testApiKey().catch(console.error);