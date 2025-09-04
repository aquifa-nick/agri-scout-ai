const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.'));

// Configure multer for handling image uploads
const upload = multer({
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        geminiConfigured: !!process.env.GEMINI_API_KEY
    });
});

// Gemini AI Analysis endpoint
app.post('/api/analyze', async (req, res) => {
    try {
        const { imageData, context } = req.body;

        if (!imageData || !context) {
            return res.status(400).json({
                error: 'Missing required fields: imageData and context'
            });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                error: 'Gemini API key not configured'
            });
        }

        // Extract base64 data from data URL
        const base64Data = imageData.split(',')[1];
        if (!base64Data) {
            return res.status(400).json({
                error: 'Invalid image data format'
            });
        }

        const prompt = `You are an expert agronomist specializing in the U.S. Corn Belt. Analyze the provided image and context to identify weeds, pests, or diseases. 

CRITICAL: You must respond with ONLY a valid JSON object. No additional text, explanations, or formatting outside the JSON.

Required JSON structure:
{
    "identification": {
        "commonName": "string",
        "scientificName": "string",
        "confidence": number (0-100)
    },
    "description": "string (one paragraph describing characteristics and crop impact)",
    "recommendations": {
        "nonChemical": ["string", "string", "string"],
        "chemical": ["string", "string", "string"]
    }
}

Context Information: ${context}

Analyze the image and provide identification with management recommendations. Focus on common agricultural issues in corn and soybean fields.`;

        // Call Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`, {
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
                                data: base64Data 
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
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Gemini API Error:', response.status, errorData);
            
            return res.status(500).json({
                error: 'AI analysis failed',
                details: `API returned ${response.status}`,
                fallback: getFallbackResponse()
            });
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error('Unexpected API response structure:', data);
            return res.status(500).json({
                error: 'Invalid API response structure',
                fallback: getFallbackResponse()
            });
        }

        const resultText = data.candidates[0].content.parts[0].text;
        
        // Clean up the response text and parse JSON
        let cleanedText = resultText.trim();
        
        // Remove any markdown code blocks
        cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        
        // Try to parse the JSON
        let result;
        try {
            result = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Raw AI Response:', resultText);
            
            return res.status(500).json({
                error: 'Failed to parse AI response',
                details: 'AI returned invalid JSON format',
                fallback: getFallbackResponse()
            });
        }

        // Validate the response structure
        if (!isValidAnalysisResult(result)) {
            console.error('Invalid result structure:', result);
            return res.status(500).json({
                error: 'AI returned incomplete analysis',
                fallback: getFallbackResponse()
            });
        }

        // Log successful analysis (without image data for privacy)
        console.log('Successful analysis:', {
            identification: result.identification,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            result: result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Analysis endpoint error:', error);
        
        res.status(500).json({
            error: 'Internal server error during analysis',
            details: error.message,
            fallback: getFallbackResponse()
        });
    }
});

// Fallback response for when AI fails
function getFallbackResponse() {
    return {
        identification: {
            commonName: "Unknown Agricultural Issue",
            scientificName: "Analysis unavailable",
            confidence: 0
        },
        description: "Unable to complete AI analysis at this time. Please try again later or consult with a local agricultural extension office for identification assistance.",
        recommendations: {
            nonChemical: [
                "Document the issue with additional photos from different angles",
                "Consult with local agricultural extension services",
                "Monitor the affected area for changes or spread"
            ],
            chemical: [
                "Consult with a certified crop advisor before applying treatments",
                "Consider soil testing if the issue appears to be nutrient-related",
                "Follow all label instructions for any approved treatments"
            ]
        }
    };
}

// Validate analysis result structure
function isValidAnalysisResult(result) {
    return result &&
           result.identification &&
           typeof result.identification.commonName === 'string' &&
           typeof result.identification.scientificName === 'string' &&
           typeof result.identification.confidence === 'number' &&
           typeof result.description === 'string' &&
           result.recommendations &&
           Array.isArray(result.recommendations.nonChemical) &&
           Array.isArray(result.recommendations.chemical) &&
           result.recommendations.nonChemical.length >= 3 &&
           result.recommendations.chemical.length >= 3;
}

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                error: 'File too large. Maximum size is 10MB.'
            });
        }
    }
    
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🌾 Agri-Scout AI Server running on port ${PORT}`);
    console.log(`📍 Local access: http://localhost:${PORT}`);
    console.log(`🔑 Gemini API configured: ${!!process.env.GEMINI_API_KEY}`);
    
    if (!process.env.GEMINI_API_KEY) {
        console.warn('⚠️  WARNING: GEMINI_API_KEY not set. AI analysis will not work.');
        console.warn('   Create a .env file with your API key to enable AI features.');
    }
});

module.exports = app;
