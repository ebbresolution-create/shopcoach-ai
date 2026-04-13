'use client';

import { useState, useRef, useEffect } from 'react';
import { MODE_LABELS, QUICK_PROMPTS } from './lib/prompts';
import { MessageCircle, Send, ShoppingBag, Zap } from 'lucide-react';

const MODES = [
  'viral-breakdown',
  'script-feedback',
  'trend-intel',
  'product-discovery',
  'content-ideas',
  'five-video-plan',
];

export default function HomePage() {
  const [currentMode, setCurrentMode] = useState('viral-breakdown');
  const [messages, setMessages] = useState({});
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionCount, setSessionCount] = useState(12);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);

  // Initialize messages object for each mode
  useEffect(() => {
    const newMessages = {};
    MODES.forEach((mode) => {
      newMessages[mode] = messages[mode] || [];
    });
    setMessages(newMessages);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages[currentMode]]);

  // Simple markdown renderer
  const renderMarkdown = (text) => {
    return text
      .split('\n')
      .map((line, idx) => {
        // Headers
        if (line.startsWith('###')) {
          return (
            <h3 key={idx} className="text-base font-semibold text-[#e2e8f0] mt-3 mb-2">
              {line.replace(/^#+\s/, '')}
            </h3>
          );
        }
        if (line.startsWith('##')) {
          return (
            <h2 key={idx} className="text-lg font-bold text-[#e2e8f0] mt-4 mb-2">
              {line.replace(/^#+\s/, '')}
            </h2>
          );
        }
        if (line.startsWith('#')) {
          return (
            <h1 key={idx} className="text-xl font-bold text-[#e2e8f0] mt-4 mb-2">
              {line.replace(/^#+\s/, '')}
            </h1>
          );
        }

        // Bold and italic
        let content = line
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/`(.+?)`/g, '<code>$1</code>');

        // Lists
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <li key={idx} className="ml-4 text-[#e2e8f0]">
              <span dangerouslySetInnerHTML={{ __html: content.substring(2) }} />
            </li>
          );
        }

        if (line.trim() === '') {
          return <div key={idx} className="h-2" />;
        }

        return (
          <p key={idx} className="text-[#e2e8f0] leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </p>
        );
      });
  };

  // Handle sending message
  const handleSendMessage = async (promptText = '') => {
    const messageText = promptText || inputValue.trim();
    if (!messageText) return;

    // Add user message
    const newMessage = {
      id: Date.now(),
      role: 'user',
      content: messageText,
    };

    setMessages((prev) => ({
      ...prev,
      [currentMode]: [...(prev[currentMode] || []), newMessage],
    }));

    setInputValue('');
    setIsLoading(true);

    try {
      // Get current conversation history
      const conversationHistory = messages[currentMode] || [];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: currentMode,
          message: messageText,
          conversationHistory: conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      // Add placeholder AI message
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '',
      };

      setMessages((prev) => ({
        ...prev,
        [currentMode]: [...(prev[currentMode] || []), aiMessage],
      }));

      // Stream in the response
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullContent += chunk;

        // Update the last message (AI response) with streamed content
        setMessages((prev) => ({
          ...prev,
          [currentMode]: prev[currentMode].map((msg, idx) =>
            idx === prev[currentMode].length - 1
              ? { ...msg, content: fullContent }
              : msg
          ),
        }));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
      };
      setMessages((prev) => ({
        ...prev,
        [currentMode]: [...(prev[currentMode] || []), errorMessage],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle mode change
  const handleModeChange = (mode) => {
    setCurrentMode(mode);
    setIsMobileMenuOpen(false);
  };

  const currentMessages = messages[currentMode] || [];
  const isEmptyState = currentMessages.length === 0;
  const modeData = MODE_LABELS[currentMode];
  const quickPrompts = QUICK_PROMPTS[currentMode] || [];

  // Typing indicator component
  const TypingIndicator = () => (
    <div className="flex gap-1">
      <div className="w-2 h-2 rounded-full bg-[#00f5d4] animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 rounded-full bg-[#00f5d4] animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 rounded-full bg-[#00f5d4] animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );

  return (
    <div className="flex h-screen bg-[#080b10]">
      {/* SIDEBAR - DESKTOP */}
      <aside className="hidden md:flex flex-col w-[280px] bg-[#0d1117] border-r border-[#1e2a3a] p-4">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <ShoppingBag className="w-6 h-6 text-white" />
          <span className="text-lg font-bold text-white">
            Shop<span className="text-[#00f5d4]">Coach</span>
          </span>
          <span className="text-sm font-semibold text-[#00f5d4]">AI</span>
        </div>

        {/* Mode Selector */}
        <div className="space-y-2 flex-1">
          {MODES.map((mode) => {
            const modeLabel = MODE_LABELS[mode];
            const isActive = currentMode === mode;
            return (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-[#1e2a3a] border-l-2 border-[#00f5d4]'
                    : 'bg-transparent border-l-2 border-transparent hover:bg-[#1a2332]'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xl mt-0.5">{modeLabel.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#e2e8f0]">{modeLabel.name}</div>
                    <div className="text-xs text-[#64748b] line-clamp-2">{modeLabel.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Session Counter & Upgrade */}
        <div className="pt-4 border-t border-[#1e2a3a] space-y-3">
          <div className="text-xs text-[#64748b]">
            <span className="font-semibold text-[#e2e8f0]">{sessionCount}</span>/50 sessions
          </div>
          <button className="w-full py-2 px-3 rounded-full bg-gradient-to-r from-[#00f5d4] to-[#0ea5e9] text-[#080b10] font-semibold text-sm hover:shadow-lg hover:shadow-[#00f5d4]/20 transition-all duration-200">
            Upgrade to Pro
          </button>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col bg-[#080b10]">
        {/* TOP BAR */}
        <header className="border-b border-[#1e2a3a] bg-[#0d1117] px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-[#e2e8f0] hover:bg-[#1e2a3a] p-2 rounded-lg transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-white" />
              <span className="font-bold text-white hidden sm:inline">
                Shop<span className="text-[#00f5d4]">Coach</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[#64748b] hidden sm:block">
              <span className="font-semibold text-[#e2e8f0]">{sessionCount}</span>/50
            </span>
            <button className="hidden sm:block py-1.5 px-3 rounded-full bg-gradient-to-r from-[#00f5d4] to-[#0ea5e9] text-[#080b10] font-semibold text-xs hover:shadow-lg hover:shadow-[#00f5d4]/20 transition-all duration-200">
              Upgrade
            </button>
          </div>
        </header>

        {/* MOBILE MODE SELECTOR */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#0d1117] border-b border-[#1e2a3a] overflow-x-auto">
            <div className="flex gap-2 p-3 w-full overflow-x-auto scrollbar-hide">
              {MODES.map((mode) => {
                const modeLabel = MODE_LABELS[mode];
                const isActive = currentMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => handleModeChange(mode)}
                    className={`flex-shrink-0 px-3 py-2 rounded-lg transition-all duration-200 whitespace-nowrap text-sm font-medium ${
                      isActive
                        ? 'bg-[#00f5d4] text-[#080b10]'
                        : 'bg-[#1e2a3a] text-[#e2e8f0] hover:bg-[#2a3a4a]'
                    }`}
                  >
                    {modeLabel.icon} {modeLabel.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* CHAT MESSAGES AREA */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-4"
        >
          {isEmptyState ? (
            // Empty State
            <div className="h-full flex flex-col items-center justify-center py-12 text-center">
              <div className="text-6xl mb-6">{modeData.icon}</div>
              <h2 className="text-2xl font-bold text-[#e2e8f0] mb-2">{modeData.name}</h2>
              <p className="text-[#64748b] mb-8 max-w-sm">{modeData.description}</p>
              <p className="text-[#64748b] text-sm mb-8">What can I help you with?</p>

              {/* Quick Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="p-3 bg-[#0d1117] border border-[#1e2a3a] rounded-lg text-left text-sm text-[#e2e8f0] hover:bg-[#1e2a3a] hover:border-[#00f5d4] transition-all duration-200"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {currentMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div
                    className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-[#1e2a3a] text-[#e2e8f0]'
                        : 'bg-[#0d1117] border-l-2 border-[#00f5d4] text-[#e2e8f0]'
                    }`}
                  >
                    <div className="text-sm leading-relaxed">
                      {renderMarkdown(message.content)}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#0d1117] border-l-2 border-[#00f5d4] px-4 py-3 rounded-lg">
                    <TypingIndicator />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* QUICK PROMPTS AREA - shown when messages exist */}
        {!isEmptyState && !isLoading && (
          <div className="px-4 md:px-6 py-3 flex gap-2 overflow-x-auto scrollbar-hide bg-[#080b10]">
            {quickPrompts.slice(0, 3).map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="flex-shrink-0 px-3 py-1.5 bg-[#0d1117] border border-[#1e2a3a] rounded-full text-xs text-[#e2e8f0] hover:bg-[#1e2a3a] hover:border-[#00f5d4] transition-all duration-200 whitespace-nowrap"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* INPUT AREA */}
        <div className="border-t border-[#1e2a3a] bg-[#0d1117] px-4 md:px-6 py-4">
          <div className="flex gap-3">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask your coach..."
              rows="1"
              className="flex-1 bg-[#1e2a3a] border border-[#2a3a4a] rounded-lg px-4 py-3 text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-[#00f5d4] focus:ring-1 focus:ring-[#00f5d4] resize-none transition-all duration-200"
              style={{
                minHeight: '44px',
                maxHeight: '120px',
              }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-r from-[#00f5d4] to-[#0ea5e9] text-[#080b10] font-semibold hover:shadow-lg hover:shadow-[#00f5d4]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
