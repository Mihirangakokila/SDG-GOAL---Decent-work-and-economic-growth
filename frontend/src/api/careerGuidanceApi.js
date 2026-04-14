import client from './client.js';

export const careerGuidanceStatusApi = () => client.get('/career-guidance/status');

const CHAT_TIMEOUT_MS = 180_000;

export const careerGuidanceChatApi = (messages, internships) =>
  client.post('/career-guidance/chat', { messages, internships }, { timeout: CHAT_TIMEOUT_MS });
