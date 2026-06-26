import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Get Gemini model instance
 * @param {string} modelName - Model name (default: gemini-2.5-flash)
 */
export const getGeminiModel = (modelName = 'gemini-2.5-flash') => {
  return genAI.getGenerativeModel({ model: modelName });
};

/**
 * Generate chat response using Gemini
 * @param {string} systemPrompt - System prompt/instructions
 * @param {Array} conversationHistory - Array of {role: 'user'|'model', parts: [{text: string}]}
 * @param {Object} context - Additional context data
 * @returns {Promise<Object>} Response from Gemini
 */
export const generateChatResponse = async (systemPrompt, conversationHistory = [], context = {}) => {
  try {
    const model = getGeminiModel('gemini-2.5-flash');
    
    // Build the full prompt with system instructions and context
    const contextText = Object.keys(context).length > 0 
      ? `\n\nContext:\n${JSON.stringify(context, null, 2)}`
      : '';
    
    const fullPrompt = `${systemPrompt}${contextText}`;
    
    // Start chat with system prompt
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: fullPrompt }]
        },
        {
          role: 'model',
          parts: [{ text: 'Tôi hiểu rồi. Tôi sẽ giúp bạn tìm cơ sở, gợi ý sân giá rẻ và hỗ trợ đặt sân. Bạn cần hỗ trợ gì hôm nay?' }]
        },
        ...conversationHistory
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    // Get the last user message
    const lastMessage = conversationHistory[conversationHistory.length - 1];
    const userMessage = lastMessage?.parts?.[0]?.text || '';

    // Send message
    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    const text = response.text();

    return {
      success: true,
      message: text,
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        completionTokens: response.usageMetadata?.completionTokenCount || 0,
        totalTokens: response.usageMetadata?.totalTokenCount || 0,
      }
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    return {
      success: false,
      message: 'Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.',
      error: error.message
    };
  }
};

export default { getGeminiModel, generateChatResponse };

