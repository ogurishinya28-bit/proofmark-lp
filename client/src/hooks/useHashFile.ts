import { useCallback, useEffect, useRef } from 'react';

type WorkerResponse = { id: string; sha256: string; size: number; name: string; type: string };

export function useHashFile() {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/hashWorker.ts', import.meta.url), { type: 'module' });
    return () => workerRef.current?.terminate();
  }, []);

  const hashFile = useCallback((file: File) => {
    if (!workerRef.current) {
      return Promise.reject(new Error('hash worker is not initialized'));
    }

    const id = crypto.randomUUID();

    return new Promise<WorkerResponse>((resolve, reject) => {
      const worker = workerRef.current as Worker;

      const handleMessage = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.id !== id) return;
        worker.removeEventListener('message', handleMessage);
        resolve(event.data);
      };

      const handleError = (error: ErrorEvent) => {
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
        reject(error.error ?? new Error('Failed to hash file'));
      };

      worker.addEventListener('message', handleMessage);
      worker.addEventListener('error', handleError, { once: true });
      worker.postMessage({ id, file });
    });
  }, []);

  return { hashFile };
}
