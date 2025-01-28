// components/LandingPage.tsx

"use client";

import { useState, FormEvent } from "react";

export default function TwitterWrapped() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [twitterRecap, setTwitterRecap] = useState('');
  const [twitterUsername, setTwitterUsername] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault(); // Prevent form submission refresh
    console.log("Twitter Wrapped generation initiated.");

    if (!twitterUsername) {
      setError("Please enter your Twitter username to get the recap.");
      return;
    }
    
    setIsGenerating(true);
    setError(null);

    try {
      console.log("Making API request to /api/twitter-wrapped");
      const response = await fetch('/api/twitter-wrapped', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: twitterUsername }),
      });

      console.log("API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch Twitter Wrapped data.');
      }

      const data = await response.json();
      console.log("Received data:", data);

      if (data.twitterRecap) {
        setTwitterRecap(data.twitterRecap);
      } else {
        setError("No recap data found.");
      }
    } catch (error) {
      console.error('Error in handleGenerate:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred.');
      setTwitterRecap('');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full border-6 md:max-w-4xl p-2 md:p-6">
      <h1 className="md:text-6xl text-4xl pb-5 font-medium opacity-0 animate-fade-up [animation-delay:200ms]">
        Your
        <span className="text-brand-default"> Twitter </span>
        Wrapped
      </h1>

      <p className="text-black mb-12 opacity-0 animate-fade-up [animation-delay:400ms]">
        AI analyzes your Twitter profile and gives you your 2024 recap
      </p>

      <form onSubmit={handleGenerate} className="space-y-6">
        <input
          value={twitterUsername}
          onChange={(e) => setTwitterUsername(e.target.value)}
          placeholder="Enter Your Twitter Username"
          className="w-full bg-white p-3 border box-border outline-none rounded-none-sm ring-2 ring-brand-default resize-none opacity-0 animate-fade-up [animation-delay:600ms]"
        />
        <button
          type="submit"
          className={`w-full bg-brand-default text-white font-semibold px-2 py-2 rounded-none-sm transition-opacity opacity-0 animate-fade-up [animation-delay:800ms] min-h-[50px] ring-2 ring-brand-default ${
            isGenerating ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={isGenerating}
        >
          {isGenerating ? 'Creating...' : 'Create My Twitter Recap'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-none">
          {error}
        </div>
      )}

      {twitterRecap && (
        <div className="mt-20 w-full bg-white p-4 border outline-none resize-none min-h-[200px] overflow-auto rounded-none opacity-0 animate-fade-up [animation-delay:200ms]">
          {twitterRecap}
        </div>
      )}
    </div>
  );
}