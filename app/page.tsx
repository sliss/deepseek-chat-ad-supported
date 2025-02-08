'use client';

import { useChat, Message } from 'ai/react';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { getAssetPath } from './utils';

interface SearchResult {
  title: string;
  url: string;
  text: string;
  author?: string;
  publishedDate?: string;
  favicon?: string;
}

// Add this helper function before the Page component
const parseMessageContent = (content: string) => {
  // If we find a complete think tag
  if (content.includes('</think>')) {
    const [thinking, ...rest] = content.split('</think>');
    return {
      thinking: thinking.replace('<think>', '').trim(),
      finalResponse: rest.join('</think>').trim(),
      isComplete: true
    };
  }
  // If we only find opening think tag, everything after it is thinking
  if (content.includes('<think>')) {
    return {
      thinking: content.replace('<think>', '').trim(),
      finalResponse: '',
      isComplete: false
    };
  }
  // No think tags, everything is final response
  return {
    thinking: '',
    finalResponse: content,
    isComplete: true
  };
};

export default function Page() {
  const [isSearching, setIsSearching] = useState(false);
  const [isLLMLoading, setIsLLMLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [previousQueries, setPreviousQueries] = useState<string[]>([]);
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(true);
  const [isSourcesExpanded, setIsSourcesExpanded] = useState(true);
  const [loadingDots, setLoadingDots] = useState('');
  const [showModelNotice, setShowModelNotice] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearching) {
      let count = 0;
      interval = setInterval(() => {
        count = (count + 1) % 4;
        setLoadingDots('.'.repeat(count));
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSearching]);

  const { messages, input, handleInputChange, handleSubmit: handleChatSubmit, setMessages } = useChat({
    api: getAssetPath('/api/chat'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Reset states
    setIsSearching(true);
    setIsLLMLoading(false);
    setSearchResults([]);
    setSearchError(null);

    try {
      // First, get web search results
      const searchResponse = await fetch(getAssetPath('/api/exawebsearch'), {
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
      // Hide the notice when search results appear
      setShowModelNotice(false);
      setIsSearching(false);
      setIsLLMLoading(true);

      // Format search context
      const searchContext = results.length > 0
        ? `Web Search Results:\n\n${results.map((r: SearchResult, i: number) => 
            `Source [${i + 1}]:\nTitle: ${r.title}\nURL: ${r.url}\n${r.author ? `Author: ${r.author}\n` : ''}${r.publishedDate ? `Date: ${r.publishedDate}\n` : ''}Content: ${r.text}\n---`
          ).join('\n\n')}\n\nInstructions: Based on the above search results, please provide an answer to the user's query. When referencing information, cite the source number in brackets like [1], [2], etc. Use simple english and simple words. Most important: Before coming to the final answer, think out loud, and think step by step. Think deeply, and review your steps, do 3-5 steps of thinking. Wrap the thinking in <think> tags. Start with <think> and end with </think> and then the final answer.`
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
      }

      // Then trigger the API call
      handleChatSubmit(e);

      // Update previous queries after successful search
      setPreviousQueries(prev => [...prev, input].slice(-3));

    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed');
      console.error('Error:', err);
      setIsLLMLoading(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Add effect to watch for complete responses
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant') {
      const { isComplete } = parseMessageContent(lastMessage.content);
      if (isComplete) {
        setIsLLMLoading(false);
      }
    }
  }, [messages]);

  return (
    <>
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-[#69c4ea] border-b border-[#5ab3d9] z-50">
        <div className="md:max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-white text-2xl font-bold">Mr. DeepSeeks</h1>
            <span className="text-[#e6f4fa] text-lg">Look at me!</span>
          </div>
          <a
            href="https://github.com/exa-labs/exa-deepseek-chat"
            target="_blank"
            className="flex items-center gap-1.5 text-md text-white/90 hover:text-white transition-colors"
          >
            <span className="underline">GitHub</span>
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>

      {/* Main content */}
      <div className="min-h-screen bg-[#69c4ea] bg-opacity-10">
        <div className="md:max-w-4xl mx-auto p-6 pt-20 pb-24 space-y-6">
          <div className="space-y-6">
            {messages.filter(m => m.role !== 'system').map((message) => (
              <div key={message.id}>
                <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-2xl py-3 max-w-[85%] ${
                    message.role === 'user'
                      ? 'bg-white text-black px-4 shadow-sm'
                      : 'bg-[#69c4ea] text-white px-4 shadow-sm'
                  }`}>
                    {message.role === 'assistant' ? (
                      <>
                        {(() => {
                          const { thinking, finalResponse, isComplete } = parseMessageContent(message.content);
                          return (
                            <>
                              {(thinking || !isComplete) && (
                                <div className="mb-10 space-y-4">
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
                                      className="flex items-center gap-2"
                                    >
                                      <svg 
                                        className={`w-5 h-5 transform hover:text-[var(--brand-default)] transition-colors transition-transform ${isThinkingExpanded ? 'rotate-0' : '-rotate-180'}`} 
                                        fill="none" 
                                        viewBox="0 0 24 24" 
                                        stroke="currentColor"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                      </svg>
                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                      </svg>
                                      <h3 className="text-md font-medium">Thinking</h3>
                                    </button>
                                  </div>
                                  {isThinkingExpanded && (
                                    <div className="pl-4 relative">
                                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                                        <div className="text-sm text-gray-600 whitespace-pre-wrap">{thinking}</div>
                                    </div>
                                  )}
                                </div>
                              )}
                              {isComplete && finalResponse && (
                                <div className="prose prose-base max-w-none px-4 text-gray-800 text-base">
                                  <ReactMarkdown>{finalResponse}</ReactMarkdown>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </>
                    ) : (
                      <div className="whitespace-pre-wrap text-[15px]">{message.content}</div>
                    )}
                  </div>
                </div>
                
                {/* Search results section */}
                {message.role === 'user' && !isSearching && searchResults.length > 0 && (
                  <div className="my-10 space-y-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setIsSourcesExpanded(!isSourcesExpanded)}
                        className="flex items-center gap-2 text-[#69c4ea] hover:text-[#5ab3d9] transition-colors"
                      >
                        <svg 
                          className={`w-5 h-5 transform transition-transform ${isSourcesExpanded ? 'rotate-0' : '-rotate-180'}`} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        <div className="bounce-hover font-bold text-lg">Caaan do!</div>
                      </button>
                    </div>

                    {/* Search results with vertical line */}
                    {isSourcesExpanded && (
                      <div className="pl-4 relative">
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                        <div className="space-y-2">
                          {searchResults.map((result, idx) => (
                            <div key={idx} className="text-sm group relative">
                              <a href={result.url} 
                                 target="_blank" 
                                 className="text-gray-600 hover:text-[var(--brand-default)] flex items-center gap-2">
                                [{idx + 1}] {result.title}
                                {result.favicon && (
                                  <img 
                                    src={result.favicon} 
                                    alt=""
                                    className="w-4 h-4 object-contain"
                                  />
                                )}
                              </a>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute left-0 -bottom-6 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                                {result.url}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {isLLMLoading && (
                      <div className="pt-6 flex items-center gap-2 text-[var(--brand-default)]">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm">Ooooh yeah! Can do!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className={`fixed bottom-0 left-0 right-0 bg-[#69c4ea] border-t border-[#5ab3d9] z-40`}>
        <div className="w-full max-w-4xl mx-auto px-6 py-4">
          <form onSubmit={handleSubmit} className="flex flex-col items-center">
            <div className="flex gap-4 w-full max-w-4xl items-center">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Oooooh yeah! What do you need help with?"
                autoFocus
                className="flex-1 p-4 bg-white border-2 border-[#5ab3d9] rounded-xl focus:outline-none focus:ring-2 focus:ring-white text-base shadow-sm"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isSearching}
                className={`
                  px-8
                  h-[50px]
                  bg-white
                  text-[#69c4ea]
                  rounded-xl
                  hover:bg-[#e6f4fa]
                  font-bold 
                  text-lg
                  flex
                  items-center
                  justify-center
                  shadow-sm
                  transition-colors
                  border-2
                  border-[#5ab3d9]
                  ${isSearching ? 'opacity-75' : ''}
                `}
              >
                {isSearching ? (
                  <span className="inline-flex justify-center items-center">
                    <span>Ooooh!</span>
                    <span className="w-[24px] text-left">{loadingDots}</span>
                  </span>
                ) : (
                  'Can do!'
                )}
              </button>
            </div>
            
            {showModelNotice && (
              <p className="text-white text-center text-lg mt-8 font-medium">
                Hi! I&apos;m Mr. DeepSeeks! I&apos;ll help you find what you need, then POOF! I cease to exist!
              </p>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
