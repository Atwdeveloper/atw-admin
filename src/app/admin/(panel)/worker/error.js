"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

// Shows the actual error for the worker pages instead of the generic
// "This page couldn't load" screen, so crashes can be diagnosed.
export default function WorkerError({ error, retry }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : "";

  return (
    <div className="flex-1 bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white border border-red-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-red-700 mb-2">Something went wrong on this page</h2>
        <p className="text-sm text-gray-700 mb-4">
          <span className="font-medium">Error:</span> {message}
        </p>
        {stack && (
          <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-auto max-h-64 whitespace-pre-wrap">
            {stack}
          </pre>
        )}
        <button
          onClick={() => retry()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
