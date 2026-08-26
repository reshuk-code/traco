'use client';

import { useSyncExternalStore } from 'react';
import { getOutbox, getServerOutbox, subscribeToOutbox } from '@/lib/outbox';

export function useOutbox() {
  return useSyncExternalStore(subscribeToOutbox, getOutbox, getServerOutbox);
}
