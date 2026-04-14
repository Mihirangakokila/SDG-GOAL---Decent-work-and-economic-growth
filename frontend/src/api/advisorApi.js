import client from './client.js';

/** Long timeout: server retries OpenAI 429s with backoff before responding. */
const CHAT_TIMEOUT_MS = 180_000;

/** Course advisor — uses the canonical route registered on the API (see server.js). */
export const advisorChatApi = (messages) =>
  client.post('/advisor/chat', { messages }, { timeout: CHAT_TIMEOUT_MS });
