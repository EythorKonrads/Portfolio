// The game's shared top 10, in the Netlify Blobs store "scores".
// The API itself is in handler.mjs.
import { getStore } from '@netlify/blobs';
import { handleScores } from './handler.mjs';

export const config = { path: '/api/scores' };

export default (request) => handleScores(request, getStore('scores'));
