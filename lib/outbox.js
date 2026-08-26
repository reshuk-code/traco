'use client';

/**
 * Expenses logged while offline live here until the server accepts them.
 *
 * localStorage is deliberate: it survives a reload, a closed tab, and a dead
 * battery, which a pending Server Action does not. Each entry carries a
 * client-generated uuid that becomes the row's primary key, so replaying the
 * queue can never create duplicates.
 */

const KEY = 'traco.outbox.v1';
const EMPTY = [];

const listeners = new Set();
let cachedRaw = null;
let cached = EMPTY;

function parse(raw) {
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  try {
    const value = JSON.parse(raw ?? '[]');
    cached = Array.isArray(value) ? value : EMPTY;
  } catch {
    cached = EMPTY;
  }
  return cached;
}

export function getOutbox() {
  if (typeof window === 'undefined') return EMPTY;
  try {
    return parse(window.localStorage.getItem(KEY));
  } catch {
    return EMPTY;
  }
}

export function getServerOutbox() {
  return EMPTY;
}

function save(entries) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // A full or blocked store should not take the form down with it.
  }
  listeners.forEach((fn) => fn());
}

export function addToOutbox(entry) {
  save([...getOutbox(), entry]);
  return entry;
}

export function removeFromOutbox(ids) {
  const drop = new Set(ids);
  save(getOutbox().filter((entry) => !drop.has(entry.id)));
}

export function subscribeToOutbox(callback) {
  listeners.add(callback);
  // Another tab writing to the same key counts as a change here too.
  const onStorage = (event) => {
    if (event.key === KEY) callback();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', onStorage);
  };
}

/** Must be a real uuid: it becomes the expenses row's primary key. */
export function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
