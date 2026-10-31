// The game's shared top 10, in Netlify Blobs. The API itself is in
// handler.mjs.
import { getStore } from '@netlify/blobs';
import { handleScores } from './handler.mjs';

export const config = { path: '/api/scores' };

// Blobs are shared by every deploy of the site, so Deploy Previews and
// branch deploys get a store of their own, keeping test scores off the
// real board
const storeName = (context) =>
  (context?.deploy?.context ?? 'production') === 'production'
    ? 'scores'
    : 'scores-preview';

export default (request, context) =>
  handleScores(request, getStore(storeName(context)));
