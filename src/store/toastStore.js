import { atom } from 'nanostores';

export const toastsStore = atom([]);

let nextId = 0;

export function addToast(message, type = 'info') {
  const id = nextId++;
  const toast = { id, message, type };
  
  toastsStore.set([...toastsStore.get(), toast]);

  setTimeout(() => {
    removeToast(id);
  }, 4000);
}

export function removeToast(id) {
  toastsStore.set(toastsStore.get().filter(t => t.id !== id));
}