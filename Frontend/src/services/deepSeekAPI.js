import axios from 'axios';

const deepSeekInstance = axios.create({
  baseURL: 'https://api.deepseek.com/v1',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_DEEPSEEK_API_KEY}`
  }
});

const cleanAndParseJSON = (text) => {
  try {
    // Remove markdown code block syntax if present
    let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    cleanText = cleanText.replace(/\*\*/g, '');
    
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

export const generateContent = async (prompt) => {
  try {
    const response = await deepSeekInstance.post('/chat/completions', {
      model: "deepseek-chat",
      messages: [
        {
          role: "user",
          content: prompt + "\nPlease ensure the response is in valid JSON format."
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    if (!response.data.choices || !response.data.choices[0]) {
      throw new Error('No response generated');
    }

    const rawText = response.data.choices[0].message.content;
    return cleanAndParseJSON(rawText);
  } catch (error) {
    console.error('DeepSeek API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    if (error.response?.status === 401) {
      throw new Error('Invalid API key. Please check your DeepSeek API configuration.');
    } else if (error.response?.status === 429) {
      throw new Error('API rate limit exceeded. Please try again later.');
    } else if (error.response?.status === 500) {
      throw new Error('DeepSeek API service error. Please try again later.');
    }

    throw new Error(error.response?.data?.error?.message || 'Failed to generate content');
  }
};

// Test function to verify API connection
export const testApiConnection = async () => {
  try {
    const result = await generateContent('Test connection');
    return {
      success: true,
      message: 'API connection successful',
      data: result
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
};

export default deepSeekInstance; 