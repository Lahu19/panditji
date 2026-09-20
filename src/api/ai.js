/**
 * PanditJi AI — frontend helper
 *
 * All calls go to /api/panditji-ai on OUR server.
 * The browser never knows Gemini is involved.
 */
import api from './client';

/**
 * Send a message to PanditJi AI.
 *
 * @param {string}   prompt   - The user's message
 * @param {Array}    history  - Optional prior turns: [{role:'user'|'assistant', text:'...'}]
 * @returns {Promise<{answer:string, model:string, finishReason:string}>}
 */
export function askPanditjiAI(prompt, history = []) {
  return api.post('/panditji-ai/chat', { prompt, history });
}

/**
 * Fetch branding / capability info for PanditJi AI.
 * Useful to display "Powered by PanditJi AI" without leaking provider.
 *
 * @returns {Promise<{name:string, version:string, description:string, model:string}>}
 */
export function getPanditjiAIInfo() {
  return api.get('/panditji-ai/info');
}

export default { askPanditjiAI, getPanditjiAIInfo };
