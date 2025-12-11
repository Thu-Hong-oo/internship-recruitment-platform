"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mic, Search, Loader2, Sparkles, MicOff } from "lucide-react";
import { useAINavigation } from "@/hooks/useAINavigation";
import { cn } from "@/lib/utils";

// Type definitions for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
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
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
    | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any)
    | null;
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
  frontend?: "fe" | "fe-employer";
  onNavigate?: (url: string) => void;
  className?: string;
  showSuggestions?: boolean;
  variant?: "default" | "banner";
}

export function AINavigationInput({
  placeholder = "Nói hoặc nhập điều bạn muốn làm... (ví dụ: tìm việc IT ở Sài Gòn)",
  frontend = "fe",
  onNavigate,
  className,
  showSuggestions = true,
  variant = "default",
}: AINavigationInputProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const { navigate, loading, error, lastResult, clearError } = useAINavigation({
    frontend,
    onSuccess: (result) => {
      if (result.url && onNavigate) {
        onNavigate(result.url);
      }
      setInput("");
    },
    onError: () => {
      if (lastResult?.suggestions) {
        setSuggestions(lastResult.suggestions);
      }
    },
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // Check if Speech Recognition is supported
  useEffect(() => {
    const SpeechRecognitionConstructor =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionConstructor) {
      setIsSpeechSupported(true);
      const recognition = new SpeechRecognitionConstructor();
      recognition.continuous = false;
      recognition.interimResults = true; // Enable real-time transcription
      recognition.lang = "vi-VN"; // Vietnamese

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";
        let finalTranscript = "";

        // Process all results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Update input with both interim and final results
        setInput(finalTranscript + interimTranscript);

        // If we have final result, submit after a short delay
        if (finalTranscript) {
          setIsListening(false);
          setTimeout(() => {
            navigate(finalTranscript.trim());
          }, 500);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);

        let errorMessage = "";
        switch (event.error) {
          case "no-speech":
            errorMessage = "Không phát hiện giọng nói. Vui lòng thử lại.";
            break;
          case "audio-capture":
            errorMessage =
              "Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.";
            break;
          case "not-allowed":
            errorMessage =
              "Microphone bị chặn. Vui lòng cho phép truy cập microphone trong cài đặt trình duyệt.";
            break;
          case "network":
            errorMessage =
              "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.";
            break;
          case "aborted":
            errorMessage = "Nhận diện giọng nói đã bị hủy.";
            break;
          case "service-not-allowed":
            errorMessage = "Dịch vụ nhận diện giọng nói không khả dụng.";
            break;
          default:
            errorMessage = `Lỗi nhận diện giọng nói: ${event.error}. Vui lòng thử lại.`;
        }

        setSpeechError(errorMessage);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [navigate]);

  const startListening = () => {
    if (!isSpeechSupported) {
      setSpeechError(
        "Trình duyệt của bạn không hỗ trợ nhận diện giọng nói. Vui lòng sử dụng Chrome, Edge hoặc Safari."
      );
      return;
    }

    if (recognitionRef.current && !isListening) {
      try {
        setSpeechError(null);
        recognitionRef.current.start();
      } catch (error: any) {
        console.error("Error starting speech recognition:", error);
        setSpeechError(
          `Không thể bắt đầu nhận diện giọng nói: ${
            error.message || "Lỗi không xác định"
          }`
        );
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
        setSpeechError(null);
      } catch (error: any) {
        console.error("Error stopping speech recognition:", error);
      }
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;

    await navigate(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      setInput("");
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

  const isBanner = variant === "banner";

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
                error && "border-red-500 focus:border-red-500",
                isBanner && [
                  "bg-white/90 backdrop-blur-sm border-white/30 text-slate-900",
                  "placeholder:text-slate-500",
                  "focus:bg-white focus:border-white/50",
                  "hover:bg-white/95",
                ]
              )}
              disabled={loading}
            />
            <Search
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none",
                isBanner ? "text-slate-400" : "text-gray-400"
              )}
            />
          </div>

          {/* Loading indicator */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-end pr-12 pointer-events-none">
              <Loader2
                className={cn(
                  "w-4 h-4 animate-spin",
                  isBanner ? "text-[oklch(0.60_0.12_195)]" : "text-primary"
                )}
              />
            </div>
          )}
        </div>

        {/* Voice Input Button */}
        <Button
          onClick={isListening ? stopListening : startListening}
          disabled={loading || !isSpeechSupported}
          variant={
            isListening ? "destructive" : isBanner ? "secondary" : "outline"
          }
          className={cn(
            "px-3 shrink-0",
            isBanner &&
              !isListening &&
              "bg-white/90 hover:bg-white border-white/30 text-[oklch(0.60_0.12_195)]"
          )}
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
          className={cn(
            "px-4 shrink-0",
            isBanner &&
              "bg-white text-[oklch(0.60_0.12_195)] hover:bg-white/95 font-semibold shadow-lg"
          )}
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
        <div
          className={cn(
            "mt-2 p-3 rounded-lg",
            isBanner
              ? "bg-white/20 backdrop-blur-sm border border-white/30"
              : "bg-blue-50 border border-blue-200"
          )}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <p
              className={cn(
                "text-sm",
                isBanner ? "text-white" : "text-blue-600"
              )}
            >
              {input
                ? `Đang nghe: "${input}"`
                : "Đang nghe... Hãy nói điều bạn muốn làm"}
            </p>
          </div>
        </div>
      )}

      {/* Speech recognition error */}
      {speechError && (
        <div
          className={cn(
            "mt-2 p-3 rounded-lg",
            isBanner
              ? "bg-white/20 backdrop-blur-sm border border-white/30"
              : "bg-orange-50 border border-orange-200"
          )}
        >
          <div className="flex items-start gap-2">
            <MicOff
              className={cn(
                "w-4 h-4 mt-0.5 flex-shrink-0",
                isBanner ? "text-white" : "text-orange-600"
              )}
            />
            <p
              className={cn(
                "text-sm",
                isBanner ? "text-white" : "text-orange-600"
              )}
            >
              {speechError}
            </p>
          </div>
          <button
            onClick={() => {
              setSpeechError(null);
              if (isSpeechSupported) {
                startListening();
              }
            }}
            className={cn(
              "mt-2 text-xs underline",
              isBanner
                ? "text-white/90 hover:text-white"
                : "text-orange-700 hover:text-orange-900"
            )}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          className={cn(
            "mt-2 p-3 rounded-lg",
            isBanner
              ? "bg-white/20 backdrop-blur-sm border border-white/30"
              : "bg-red-50 border border-red-200"
          )}
        >
          <p
            className={cn("text-sm", isBanner ? "text-white" : "text-red-600")}
          >
            {error}
          </p>
        </div>
      )}

      {/* Success message with intent info */}
      {lastResult?.success && lastResult.intent && (
        <div
          className={cn(
            "mt-2 flex items-center gap-2 text-sm",
            isBanner ? "text-white" : "text-green-600"
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span>
            Đã nhận diện: <strong>{lastResult.intent}</strong>
            {lastResult.confidence && (
              <span
                className={cn(
                  "ml-2",
                  isBanner ? "text-white/80" : "text-gray-500"
                )}
              >
                ({Math.round(lastResult.confidence * 100)}% chắc chắn)
              </span>
            )}
          </span>
        </div>
      )}

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="mt-3 space-y-1">
          <p
            className={cn(
              "text-sm font-medium mb-2",
              isBanner ? "text-white" : "text-gray-700"
            )}
          >
            Gợi ý:
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md transition-colors",
                  isBanner
                    ? "bg-white/20 hover:bg-white/30 border border-white/30 text-white"
                    : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Example queries */}
      {!loading && !error && input.length === 0 && (
        <div
          className={cn(
            "mt-2 text-xs",
            isBanner ? "text-white/80" : "text-gray-500"
          )}
        >
          <p className="mb-1">Ví dụ:</p>
          <div className="flex flex-wrap gap-2">
            {[
              "Tìm việc IT ở Sài Gòn",
              "Tạo CV online",
              "Xem hồ sơ của tôi",
              "Về trang chủ",
            ].map((example, idx) => (
              <button
                key={idx}
                onClick={() => setInput(example)}
                className={cn(
                  "px-2 py-1 text-xs rounded border transition-colors",
                  isBanner
                    ? "bg-white/20 hover:bg-white/30 border-white/30 text-white"
                    : "bg-gray-50 hover:bg-gray-100 border-gray-200"
                )}
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
