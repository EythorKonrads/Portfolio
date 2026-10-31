import { shallowRef } from 'vue';

// Lets other parts of the page start the game the way Mini Earth does.
// Mini Earth watches for a request and runs its Launch from the photo.
const request = shallowRef(null);

export function useGameLaunch() {
  // `from` is the button to focus again when the game closes
  const requestLaunch = (from) => (request.value = { from });
  return { request, requestLaunch };
}
