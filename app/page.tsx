'use client';

import { useChat, Message } from 'ai/react';
import { useState } from 'react';
import Image from 'next/image';

interface SearchResult {
  title: string;
  url: string;
  text: string;
  author?: string;
  publishedDate?: string;
}

export default function Page() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [previousQueries, setPreviousQueries] = useState<string[]>([]);

  const { messages, input, handleInputChange, handleSubmit: handleChatSubmit, setMessages } = useChat({
    api: '/api/chat',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Reset states
    setIsSearching(true);
    setSearchResults([]);
    setSearchError(null);

    try {
      // First, get web search results
      const searchResponse = await fetch('/api/exawebsearch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: input,
          previousQueries: previousQueries.slice(-3)
        }),
      });

      if (!searchResponse.ok) {
        throw new Error('Search failed');
      }

      const { results } = await searchResponse.json();
      setSearchResults(results);

      // Format search context
      const searchContext = results.length > 0
        ? `Web Search Results:\n\n${results.map((r: SearchResult, i: number) => 
            `Source [${i + 1}]:\nTitle: ${r.title}\nURL: ${r.url}\n${r.author ? `Author: ${r.author}\n` : ''}${r.publishedDate ? `Date: ${r.publishedDate}\n` : ''}Content: ${r.text}\n---`
          ).join('\n\n')}\n\nInstructions: Based on the above search results, please provide a comprehensive answer to the user's query. When referencing information, cite the source number in brackets like [1], [2], etc.`
        : '';

      // Send both system context and user message in one request
      if (searchContext) {
        // First, update the messages state with both messages
        const newMessages: Message[] = [
          ...messages,
          {
            id: Date.now().toString(),
            role: 'system',
            content: searchContext
          }
        ];
        setMessages(newMessages);
        
        // Then trigger the API call
        handleChatSubmit(e);
      } else {
        handleChatSubmit(e);
      }

      // Update previous queries after successful search
      setPreviousQueries(prev => [...prev, input].slice(-3));

    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed');
      console.error('Error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 bg-[var(--secondary-default)]">
      <div className="space-y-6">
        {messages.filter(m => m.role !== 'system').map((message, index, filteredMessages) => (
          <div key={message.id}>
            <div
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`rounded px-4 py-3 max-w-[85%] ${
                  message.role === 'user'
                    ? 'bg-[var(--secondary-darker)] text-black'
                    : 'text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap text-[15px]">{message.content}</div>
              </div>
            </div>
            
            {/* Show sources after user message and before AI response */}
            {message.role === 'user' && !isSearching && searchResults.length > 0 && 
             index < filteredMessages.length - 1 && filteredMessages[index + 1].role === 'assistant' && (
              <div className="my-6 space-y-3">
                {/* Header with logo */}
                <div className="flex items-center gap-2">
                  <Image src="/exa_logo.png" alt="Exa" width={40} height={40} />
                  <h3 className="text-sm font-medium">Search Results</h3>
                </div>

                {/* Results with vertical line */}
                <div className="pl-4 relative">
                  {/* Vertical line */}
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  {/* Content */}
                  <div className="space-y-2">
                    {searchResults.map((result, idx) => (
                      <div key={idx} className="text-sm">
                        <a href={result.url} target="_blank" rel="noopener noreferrer" 
                           className="text-gray-600 hover:text-[var(--brand-default)]">
                          [{idx + 1}] {result.title}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {isSearching && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-600">
            <Image src="/exa_logo.png" alt="Exa Logo" width={20} height={20} />
            <span className="text-sm">is searching: {input}</span>
          </div>
          <div className="bg-[var(--secondary-darker)] rounded p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium">Searching on Exa</span>
            </div>
            {searchResults.map((result, index) => (
              <div key={index} className="py-2">
                <a href={result.url} target="_blank" rel="noopener noreferrer" 
                   className="text-sm text-gray-700 hover:text-[var(--brand-default)]">
                  {result.title}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {searchError && (
        <div className="p-4 bg-red-50 rounded border border-red-100">
          <p className="text-sm text-red-800">⚠️ {searchError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="sticky bottom-6">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask something..."
            className="flex-1 p-3 bg-white border-0 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand-default)] text-[15px]"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isSearching}
            className="px-5 py-3 bg-[var(--brand-default)] text-white rounded hover:bg-[var(--brand-muted)] disabled:opacity-50 font-medium"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>
    </div>
  );
}