'use client';

import React, { useState } from 'react';

interface BulkRemediationBarProps {
  totalFindings: number;
  onComplete?: () => void;
}

export function BulkRemediationBar({ totalFindings, onComplete }: BulkRemediationBarProps) {
  const [progress, setProgress] = useState(0);
  const [processed, setProcessed] = useState(0);
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const startBulkRemediation = () => {
    setStatus('processing');
    setProgress(0);
    setProcessed(0);
    setMessage('Initializing bulk patch generation...');

    const eventSource = new EventSource(`/api/bulk-remediation/progress?total=${totalFindings}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setProcessed(data.processed);
        setProgress(data.progress);
        setMessage(data.message);

        if (data.status === 'completed') {
          setStatus('completed');
          eventSource.close();
          if (onComplete) onComplete();
        } else if (data.status === 'error') {
          setStatus('error');
          eventSource.close();
        }
      } catch (err) {
        console.error('Failed to parse SSE event data', err);
      }
    };

    eventSource.onerror = () => {
      setStatus('error');
      setMessage('SSE connection lost or terminated.');
      eventSource.close();
    };
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg text-slate-100">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="font-semibold text-lg">Bulk Remediation Progress (#1145)</h3>
          <p className="text-xs text-slate-400">{message || 'Ready to remediate findings in bulk via Server-Sent Events.'}</p>
        </div>
        {status === 'idle' && (
          <button
            onClick={startBulkRemediation}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 font-medium text-sm rounded-lg transition"
          >
            Start Bulk Patch ({totalFindings})
          </button>
        )}
      </div>

      {status !== 'idle' && (
        <div className="space-y-2">
          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                status === 'completed' ? 'bg-emerald-500' : status === 'error' ? 'bg-rose-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>Processed: {processed} / {totalFindings}</span>
            <span>{progress}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
