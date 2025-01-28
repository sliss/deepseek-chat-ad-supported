'use client';

import { useChat, Message } from 'ai/react';
import { useState } from 'react';

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
        body: JSON.stringify({ query: input }),
      });

      if (!searchResponse.ok) {
        throw new Error('Search failed');
      }

      const { results } = await searchResponse.json();
      setSearchResults(results);

      // Format search context
      const searchContext = results.length > 0
        ? `Web Search Results:\n\n${results
            .map((r: SearchResult, i: number) => 
              `Source [${i + 1}]:
Title: ${r.title}
URL: ${r.url}
${r.author ? `Author: ${r.author}\n` : ''}${r.publishedDate ? `Date: ${r.publishedDate}\n` : ''}
Content: ${r.text}
---`
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

    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed');
      console.error('Error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="space-y-6">
        {messages.filter(m => m.role !== 'system').map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`rounded-lg px-4 py-3 max-w-[85%] ${
                message.role === 'user'
                  ? 'bg-blue-100'
                  : 'bg-gray-100'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        ))}
      </div>

      {isSearching && (
        <div className="p-4 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">🔍 Searching the web...</p>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="p-4 bg-green-50 rounded-lg space-y-2">
          <h3 className="font-semibold text-green-800">Found {searchResults.length} relevant sources:</h3>
          {searchResults.map((result, index) => (
            <div key={index} className="text-sm">
              <a href={result.url} target="_blank" rel="noopener noreferrer" 
                 className="text-blue-600 hover:underline">
                [{index + 1}] {result.title}
              </a>
            </div>
          ))}
        </div>
      )}

      {searchError && (
        <div className="p-4 bg-red-50 rounded-lg">
          <p className="text-sm text-red-800">⚠️ {searchError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="sticky bottom-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask something..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isSearching}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}