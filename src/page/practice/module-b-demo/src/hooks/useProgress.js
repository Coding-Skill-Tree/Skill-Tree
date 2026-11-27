import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEY, sanitizeProgress, startNode, completeNode } from '../lib/progress.js';
function loadProgress() {
  try { return sanitizeProgress(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')); }
  catch { return {}; }
}
export function useProgress({ readOnly = false } = {}) {
  const [progress, setProgress] = useState(readOnly ? () => ({}) : loadProgress);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    if (readOnly) return;
    let active = true;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); }
    catch { queueMicrotask(() => { if (active) setStorageError(true); }); }
    return () => { active = false; };
  }, [progress, readOnly]);
  const start = useCallback(id => {
    if (!readOnly) {
      setStorageError(false);
      setProgress(previous => startNode(previous, id));
    }
  }, [readOnly]);
  const complete = useCallback(id => {
    if (!readOnly) {
      setStorageError(false);
      setProgress(previous => completeNode(previous, id));
    }
  }, [readOnly]);
  const reset = useCallback(() => {
    if (!readOnly) {
      setStorageError(false);
      setProgress({});
    }
  }, [readOnly]);
  return { progress, storageError, start, complete, reset };
}
