/**
 * Configuration file for application settings
 */

// Language options available in the application
export const languages = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'German' },
  // Add more languages as needed
  // { code: 'fr', name: 'French' },
  // { code: 'es', name: 'Spanish' },
];

// LLM models available in the application
export const llms = [
  { id: 'gemma-3', name: 'Gemma 3' },
  { id: 'quen-2.5', name: 'Quen 2.5' },
  // Add more LLMs as needed
  // { id: 'llama-3', name: 'Llama 3' },
  // { id: 'claude-3', name: 'Claude 3' },
];

// System prompts available in the application
export const systemPrompts = [
  { name: 'Screen Sharing', prompt: 'If the question is related to the image, describe precisely what you see on the image. Focus on the most important details.' },
  { name: 'Text Chat', prompt: 'You are a helpful assistant.' },
];

// Default configuration
export const defaultConfig = {
  llm: 'gemma-3',
  lang: 'de',
  audioOutput: true,  
  systemPrompt: 'If the question is related to the image, describe precisely what you see on the image. Focus on the most important details.',
  processVideoInput: false,};