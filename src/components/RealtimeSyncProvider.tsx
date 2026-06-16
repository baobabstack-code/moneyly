'use client';

import { useRealtimeSync } from '@/hooks/useRealtimeSync';

export default function RealtimeSyncProvider({ userId }: { userId: string | undefined }) {
  useRealtimeSync(userId);
  return null;
}
