import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jobsAPI } from '../services/api';
import { useToast } from '../components/Toast';

const JobContext = createContext(null);

export function JobProvider({ children }) {
  const [activeJobId, setActiveJobId] = useState(() => {
    return localStorage.getItem('activeProcessingJobId') || null;
  });
  const [jobStatus, setJobStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const toast = useToast();

  // Persist activeJobId to localStorage
  useEffect(() => {
    if (activeJobId) {
      localStorage.setItem('activeProcessingJobId', activeJobId);
      setIsProcessing(true);
    } else {
      localStorage.removeItem('activeProcessingJobId');
      setIsProcessing(false);
    }
  }, [activeJobId]);

  // Global polling - runs regardless of which page you're on
  useEffect(() => {
    if (!activeJobId) return;

    let cancelled = false;
    const pollInterval = setInterval(async () => {
      if (cancelled) return;

      try {
        const response = await jobsAPI.getStatus(activeJobId);
        const status = response.data;

        if (!cancelled) {
          setJobStatus(status);

          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(pollInterval);
            setActiveJobId(null);
            setIsProcessing(false);

            if (status.status === 'completed') {
              toast.success(`Processed ${status.completed_items} session(s)`, 'Complete');
            } else {
              toast.error(status.error_message || 'Processing failed', 'Error');
            }

            // Dispatch event so pages can refresh their data
            window.dispatchEvent(new CustomEvent('jobCompleted', { detail: status }));
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Polling error:', err);
          if (err.response?.status === 404) {
            setActiveJobId(null);
            setIsProcessing(false);
          }
        }
      }
    }, 500);

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
  }, [activeJobId, toast]);

  const submitJob = useCallback(async (memoryIds, policyIds = null, refreshVariants = true) => {
    try {
      setIsProcessing(true);
      setJobStatus(null);
      const response = await jobsAPI.submit(memoryIds, policyIds, refreshVariants);
      setActiveJobId(response.data.job_id);
      return response.data;
    } catch (err) {
      setIsProcessing(false);
      throw err;
    }
  }, []);

  const clearJob = useCallback(() => {
    setActiveJobId(null);
    setJobStatus(null);
    setIsProcessing(false);
  }, []);

  return (
    <JobContext.Provider value={{
      activeJobId,
      jobStatus,
      isProcessing,
      submitJob,
      clearJob
    }}>
      {children}
    </JobContext.Provider>
  );
}

export function useJob() {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJob must be used within a JobProvider');
  }
  return context;
}
