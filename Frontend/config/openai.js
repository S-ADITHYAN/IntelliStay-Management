const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;// Replace with your actual OpenAI API key

export const openaiConfig = {
  apiKey: OPENAI_API_KEY,
  model: "gpt-3.5-turbo",
  maxTokens: 150,
  temperature: 0.7,
}; 