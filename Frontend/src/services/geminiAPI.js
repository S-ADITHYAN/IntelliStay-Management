import { GoogleGenerativeAI } from "@google/generative-ai";

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
    return {
      error: true,
      message: 'Failed to parse response',
      rawText: text
    };
  }
};

export const generateContent = async (prompt, apiKey) => {
  try {
    // Initialize the API
    const genAI = new GoogleGenerativeAI(apiKey);
    
    try {
      // Try with gemini-1.5-pro-latest first
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro-latest",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      });

      const result = await model.generateContent({
        contents: [{ parts: [{ text: prompt + "\nPlease ensure the response is in valid JSON format." }] }],
      });

      const response = await result.response;
      const text = response.text();
      return cleanAndParseJSON(text);
      
    } catch (error) {
      // If 1.5 fails, fallback to gemini-pro
      console.log('Falling back to gemini-pro');
      const fallbackModel = genAI.getGenerativeModel({ 
        model: "gemini-pro",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      });

      const result = await fallbackModel.generateContent({
        contents: [{ parts: [{ text: prompt + "\nPlease ensure the response is in valid JSON format." }] }],
      });

      const response = await result.response;
      const text = response.text();
      return cleanAndParseJSON(text);
    }
  } catch (error) {
    console.error('Generation error:', error);
    throw error;
  }
};

export const generateContentWithImage = async (prompt, imageData, apiKey) => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    try {
      // Try with gemini-1.5-pro-vision-latest first
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro-vision-latest",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      });

      const result = await model.generateContent({
        contents: [{
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageData
              }
            }
          ]
        }]
      });

      const response = await result.response;
      const text = response.text();
      return cleanAndParseJSON(text);
      
    } catch (error) {
      // If 1.5 fails, fallback to gemini-pro-vision
      console.log('Falling back to gemini-pro-vision');
      const fallbackModel = genAI.getGenerativeModel({ 
        model: "gemini-pro-vision",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      });

      const result = await fallbackModel.generateContent({
        contents: [{
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageData
              }
            }
          ]
        }]
      });

      const response = await result.response;
      const text = response.text();
      return cleanAndParseJSON(text);
    }
  } catch (error) {
    console.error('Image generation error:', error);
    throw error;
  }
}; 