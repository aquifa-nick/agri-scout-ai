# Agri-Scout AI 🌾

A mobile-first web application that empowers farmers to rapidly identify common weeds, pests, and diseases in their fields using smartphone cameras and AI analysis.

## Features

- **📍 Field Mapping**: Create and save field boundaries using GPS and satellite imagery
- **📸 Camera Capture**: Take photos with guided framing for optimal AI analysis  
- **🤖 AI Identification**: Powered by Google's Gemini AI for accurate pest/weed/disease identification
- **📊 Detailed Results**: Get confidence scores, descriptions, and management recommendations
- **💾 Local Storage**: Save field boundaries and preferences locally on device
- **📱 Mobile-First**: Optimized for smartphone use in bright outdoor conditions

## Quick Start

1. Open `index.html` in a web browser (preferably on a mobile device)
2. Allow location access when prompted
3. Create or select a field boundary
4. Take a photo of the issue you want to identify
5. Add context information (crop type, growth stage, recent treatments)
6. Get AI-powered identification and management recommendations

## Technical Stack

- **Frontend**: Single HTML file with embedded CSS (Tailwind) and JavaScript
- **Mapping**: Leaflet.js with Esri World Imagery satellite tiles
- **AI Backend**: Google Gemini 2.0 Flash API
- **Storage**: Browser localStorage for field boundaries and preferences
- **Mobile**: Responsive design optimized for smartphone use

## API Integration

### Setting up Gemini API

To enable real AI analysis, you'll need to:

1. Get a Google AI Studio API key from [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

2. Replace the `simulateAIAnalysis` function in `index.html` with this real implementation:

```javascript
async function callGeminiAPI(imageData, contextText) {
    const API_KEY = 'YOUR_GEMINI_API_KEY_HERE'; // Replace with your actual API key
    
    const prompt = `You are an expert agronomist specializing in the U.S. Corn Belt. Analyze the provided image and context. Identify the primary weed, pest, or disease. Provide the common name, scientific name, a confidence score from 0-100%, a brief one-paragraph description of its characteristics and potential crop impact, and suggest three non-chemical and three chemical management strategies. Format the response as a JSON object with the following structure:
    
    {
        "identification": {
            "commonName": "string",
            "scientificName": "string", 
            "confidence": number
        },
        "description": "string",
        "recommendations": {
            "nonChemical": ["string", "string", "string"],
            "chemical": ["string", "string", "string"]
        }
    }
    
    Context: ${contextText}`;
    
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { 
                            inline_data: { 
                                mime_type: 'image/jpeg', 
                                data: imageData.split(',')[1] 
                            } 
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.1,
                    topK: 32,
                    topP: 1,
                    maxOutputTokens: 2048,
                },
            })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        const resultText = data.candidates[0].content.parts[0].text;
        
        // Parse JSON response from AI
        const result = JSON.parse(resultText);
        return result;
        
    } catch (error) {
        console.error('Gemini API Error:', error);
        throw new Error('AI analysis failed. Please try again.');
    }
}

// Replace the simulateAIAnalysis function call in submitForAnalysis()
async function submitForAnalysis() {
    // ... existing validation code ...
    
    showScreen('loading-screen');
    
    try {
        const context = `
            Crop Type: ${cropType}
            Growth Stage: ${growthStage}
            Recent Applications: ${recentApplications || 'None specified'}
            Field Location: ${currentField ? currentField.name : 'Unknown'}
        `;
        
        // Call real API instead of simulation
        const result = await callGeminiAPI(capturedPhoto, context);
        
        displayResults(result);
        showScreen('results-screen');
        
    } catch (error) {
        console.error('Analysis error:', error);
        showError('Analysis failed. Please check your internet connection and try again.');
    }
}
```

### Security Note

For production deployment, the API key should be stored securely on a backend server, not in the frontend code. Consider creating a simple backend endpoint that proxies requests to the Gemini API.

## User Experience Features

### Mobile Optimization
- Large tap targets (minimum 60px height)
- High contrast colors for outdoor visibility
- Optimized for one-handed use
- Fast loading even on slow connections

### Field Management
- GPS-based location detection
- Satellite imagery for accurate field boundaries  
- Persistent storage of field data
- Support for multiple crops and fields

### Photo Guidance
- Clear instructions for optimal photo capture
- Preview and retake functionality
- Automatic camera access on mobile devices
- Photo compression for faster uploads

### AI Analysis
- Context-aware identification using crop and growth stage info
- Confidence scoring for reliability assessment
- Both chemical and non-chemical management recommendations
- User feedback collection for continuous improvement

## Browser Compatibility

- **Recommended**: Mobile Safari (iOS), Chrome Mobile (Android)
- **Desktop**: Chrome, Firefox, Safari, Edge
- **Requirements**: 
  - JavaScript enabled
  - Camera access permission
  - Location access permission (optional but recommended)

## File Structure

```
agri-scout-ai/
├── index.html          # Complete single-file application
├── README.md           # This documentation
└── (no other files needed for MVP)
```

## Development Notes

The application is intentionally built as a single HTML file to:
- Minimize loading time on slow rural internet connections
- Simplify deployment and hosting
- Reduce external dependencies
- Enable offline functionality after initial load

## Future Enhancements

- Offline mode with cached AI models
- Integration with weather APIs
- Historical tracking of field issues
- Export functionality for reports
- Integration with farm management systems

## License

Copyright © 2024 Agri-Scout AI. All rights reserved.

## Support

For technical support or feature requests, please contact the development team.
