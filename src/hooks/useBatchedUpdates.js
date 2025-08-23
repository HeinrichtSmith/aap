import { useCallback } from 'react';
import { unstable_batchedUpdates } from 'react-dom';

export function useBatchedUpdates() {
  const batchUpdates = useCallback((callback) => {
    unstable_batchedUpdates(callback);
  }, []);

  return batchUpdates;
}