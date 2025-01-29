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
      <h1 className="text-6xl pb-5 font-medium opacity-0 animate-fade-up [animation-delay:200ms] leading-[1.4]">
        An opensource chat app powered by
        <span className="text-brand-default"> Exa API </span> <br/>
        and DeepSeek R1
      </h1>
    </div>
  );
}