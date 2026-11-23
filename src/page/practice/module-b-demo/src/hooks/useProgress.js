import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEY, sanitizeProgress, startNode, completeNode } from '../lib/progress.js';
function loadProgress() {
  try { return sanitizeProgress(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')); }
  catch { return {}; }
}
export function useProgress() {
  const [progress, setProgress] = useState(loadProgress);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); setStorageError(false); }
    catch { setStorageError(true); }
  }, [progress]);
  const start = useCallback(id => setProgress(previous => startNode(previous, id)), []);
  const complete = useCallback(id => setProgress(previous => completeNode(previous, id)), []);
  const reset = useCallback(() => setProgress({}), []);
  return { progress, storageError, start, complete, reset };
}
