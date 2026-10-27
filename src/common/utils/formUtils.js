// common/utils/formUtils.js
import { useState, useRef, useCallback } from 'react';

export const useFormDirtyTracker = (initialData) => {
  const [isDirty, setIsDirty] = useState(false);
  const initialDataRef = useRef(initialData);

  const checkDirty = useCallback((currentData) => {
    const dirty = JSON.stringify(currentData) !== JSON.stringify(initialDataRef.current);
    setIsDirty(dirty);
    return dirty;
  }, []);

  const resetDirty = useCallback(() => {
    setIsDirty(false);
    // Reset to original initial data
    initialDataRef.current = JSON.parse(JSON.stringify(initialData));
  }, [initialData]);

  const markAsClean = useCallback((currentData) => {
    // Update initial data to current data
    initialDataRef.current = JSON.parse(JSON.stringify(currentData));
    setIsDirty(false);
  }, []);

  const updateInitialData = useCallback((newData) => {
    initialDataRef.current = newData;
    // Re-check dirty state after updating initial data
    setIsDirty(false);
  }, []);

  return { 
    isDirty, 
    checkDirty, 
    resetDirty, 
    markAsClean, 
    updateInitialData 
  };
};