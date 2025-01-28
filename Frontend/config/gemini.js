const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const geminiConfig = {
  apiKey: GEMINI_API_KEY,
  maxTokens: 150,
  temperature: 0.7,
}; 