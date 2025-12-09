"use client";

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mic, Search, Loader2, Sparkles, MicOff } from 'lucide-react';
import { useAINavigation } from '@/hooks/useAINavigation';
import { cn } from '@/lib/utils';

// Type definitions for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface AINavigationInputProps {
  placeholder?: string;
  frontend?: 'fe' | 'fe-employer';
  onNavigate?: (url: string) => void;
  className?: string;
  showSuggestions?: boolean;
}

export function AINavigationInput({ 
  placeholder = "Nói hoặc nhập điều bạn muốn làm... (ví dụ: tìm việc IT ở Sài Gòn)",
  frontend = 'fe',
  onNavigate,
  className,
  showSuggestions = true
}: AINavigationInputProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const { navigate, loading, error, lastResult, clearError } = useAINavigation({
    frontend,
    onSuccess: (result) => {
      if (result.url && onNavigate) {
        onNavigate(result.url);
      }
      setInput('');
    },
    onError: () => {
      if (lastResult?.suggestions) {
        setSuggestions(lastResult.suggestions);
      }
    }
  });
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Check if Speech Recognition is supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'vi-VN'; // Vietnamese
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        // Auto submit after getting result
        setTimeout(() => {
          navigate(transcript);
        }, 500);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'no-speech') {
          // User didn't speak, just stop listening
        } else if (event.error === 'not-allowed') {
          alert('Vui lòng cho phép truy cập microphone để sử dụng tính năng nhận diện giọng nói');
        } else {
          alert('Có lỗi xảy ra với nhận diện giọng nói. Vui lòng thử lại.');
        }
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
  }, [navigate]);
  
  const startListening = () => {
    if (!isSpeechSupported) {
      alert('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói. Vui lòng sử dụng Chrome, Edge hoặc Safari.');
      return;
    }
    
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  };
  
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };
  
  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    
    await navigate(input);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setInput('');
      clearError();
      setSuggestions([]);
    }
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => {
      navigate(suggestion);
    }, 100);
  };
  
  // Auto-focus on mount (optional)
  useEffect(() => {
    // Uncomment if you want auto-focus
    // inputRef.current?.focus();
  }, []);
  
  return (
    <div className={cn("relative w-full", className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                clearError();
                if (suggestions.length > 0) {
                  setSuggestions([]);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                "pr-10",
                error && "border-red-500 focus:border-red-500"
              )}
              disabled={loading}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          
          {/* Loading indicator */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-end pr-12 pointer-events-none">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          )}
        </div>
        
        {/* Voice Input Button */}
        <Button
          onClick={isListening ? stopListening : startListening}
          disabled={loading || !isSpeechSupported}
          variant={isListening ? "destructive" : "outline"}
          className="px-3 shrink-0"
          size="default"
          title={isListening ? "Dừng ghi âm" : "Bắt đầu ghi âm"}
        >
          {isListening ? (
            <MicOff className="w-4 h-4 animate-pulse" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </Button>
        
        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={loading || !input.trim()}
          className="px-4 shrink-0"
          size="default"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <span className="hidden sm:inline">Tìm</span>
          )}
        </Button>
      </div>
      
      {/* Listening indicator */}
      {isListening && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <p className="text-sm text-blue-600">Đang nghe... Hãy nói điều bạn muốn làm</p>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      {/* Success message with intent info */}
      {lastResult?.success && lastResult.intent && (
        <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
          <Sparkles className="w-4 h-4" />
          <span>
            Đã nhận diện: <strong>{lastResult.intent}</strong>
            {lastResult.confidence && (
              <span className="text-gray-500 ml-2">
                ({Math.round(lastResult.confidence * 100)}% chắc chắn)
              </span>
            )}
          </span>
        </div>
      )}
      
      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="mt-3 space-y-1">
          <p className="text-sm font-medium text-gray-700 mb-2">Gợi ý:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1.5 text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Example queries */}
      {!loading && !error && input.length === 0 && (
        <div className="mt-2 text-xs text-gray-500">
          <p className="mb-1">Ví dụ:</p>
          <div className="flex flex-wrap gap-2">
            {[
              'Tìm việc IT ở Sài Gòn',
              'Tạo CV online',
              'Xem hồ sơ của tôi',
              'Về trang chủ'
            ].map((example, idx) => (
              <button
                key={idx}
                onClick={() => setInput(example)}
                className="px-2 py-1 text-xs bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


