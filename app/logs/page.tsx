"use client";

import { useState, useEffect, useRef } from "react";

export default function LogsPage() {
  const [logs, setLogs] = useState<Array<{ timestamp: string; type: string; message: string }>>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Intercept console.log
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args: any[]) => {
      const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      setLogs(prev => [...prev, { timestamp, type: 'log', message }]);
      originalLog(...args);
    };

    console.error = (...args: any[]) => {
      const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      setLogs(prev => [...prev, { timestamp, type: 'error', message }]);
      originalError(...args);
    };

    console.warn = (...args: any[]) => {
      const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      setLogs(prev => [...prev, { timestamp, type: 'warn', message }]);
      originalWarn(...args);
    };

    // Clean up on unmount
    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-green-800">
          <h1 className="text-xl font-bold">Console Logs</h1>
          <div className="flex gap-4">
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-green-900 hover:bg-green-800 transition-colors text-sm"
            >
              Clear Logs
            </button>
            <a
              href="/closet"
              className="px-4 py-2 bg-green-900 hover:bg-green-800 transition-colors text-sm"
            >
              Back to Closet
            </a>
          </div>
        </div>

        {/* Logs Container */}
        <div className="bg-gray-900 p-4 rounded-lg max-h-[calc(100vh-200px)] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No logs yet. Console output will appear here in real-time.
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={`mb-2 pb-2 border-b border-gray-800 ${
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'warn' ? 'text-yellow-400' :
                  'text-green-400'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-gray-500 text-xs flex-shrink-0">
                    [{log.timestamp}]
                  </span>
                  <span className={`text-xs font-bold flex-shrink-0 uppercase ${
                    log.type === 'error' ? 'text-red-500' :
                    log.type === 'warn' ? 'text-yellow-500' :
                    'text-blue-400'
                  }`}>
                    {log.type}
                  </span>
                  <pre className="text-sm flex-1 whitespace-pre-wrap break-words">
                    {log.message}
                  </pre>
                </div>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>

        {/* Stats */}
        <div className="mt-4 text-sm text-gray-500">
          Total logs: {logs.length} |
          Errors: {logs.filter(l => l.type === 'error').length} |
          Warnings: {logs.filter(l => l.type === 'warn').length}
        </div>
      </div>
    </div>
  );
}
