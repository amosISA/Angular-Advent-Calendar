/**
 * Chat models for AI assistant UI
 */

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  action?: any;
  isStreaming?: boolean;
}

export interface ChatConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface GeminiResponse {
  message: string;
  action?: any;
  confidence?: number;
}
