import React, { useEffect, useRef } from 'react'
import { QueryClient } from '@tanstack/react-query'
import { SyncEngine } from '../services/syncEngine'
import { useSyncStore } from '../store/useSyncStore'

export function SyncProvider({
  queryClient,
  children,
}: {
  queryClient: QueryClient
  children: React.ReactNode
}) {
  const engineRef = useRef<SyncEngine | null>(null)
  const refreshCount = useSyncStore((s) => s.refreshCount)

  useEffect(() => {
    // Initialize the pending count from storage on mount.
    refreshCount()

    // Create + start the engine.
    engineRef.current = new SyncEngine(queryClient)
    engineRef.current.start()

    return () => {
      engineRef.current?.stop()
    }
  }, [queryClient, refreshCount])

  return <>{children}</>
}
