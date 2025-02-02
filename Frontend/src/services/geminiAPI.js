import axios from 'axios';

const geminiInstance = axios.create({
  baseURL: 'https://generativelanguage.googleapis.com/v1beta',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false
});

const cleanAndParseJSON = (text) => {
  try {
    // Remove markdown code block syntax if present
    let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Remove any markdown formatting
    cleanText = cleanText.replace(/\*\*/g, '');
    
    // Try to find JSON content between curly braces
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanText = jsonMatch[0];
    }
    
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('JSON parsing error:', error);
    // Return a structured error response
    return {
      error: true,
      message: 'Failed to parse response',
      rawText: text
    };
  }
};

export const generateContent = async (prompt, apiKey) => {
  try {
    const response = await geminiInstance.post(
      '/models/gemini-pro:generateContent',
      {
        contents: [{
          parts: [{
            text: prompt + "\nPlease ensure the response is in valid JSON format."
          }]
        }]
      },
      {
        headers: {
          'x-goog-api-key': apiKey
        }
      }
    );
    
    const rawText = response.data.candidates[0].content.parts[0].text;
    return cleanAndParseJSON(rawText);
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
};

export default geminiInstance; 