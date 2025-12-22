import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  X, 
  MessageSquare, 
  Sparkles,
  Check,
  Copy,
  RefreshCw
} from "lucide-react";
import type { ChatMessage } from "@shared/schema";

interface MaestraChatProps {
  messages: ChatMessage[];
  selectedText: string | null;
  onSendMessage: (message: string) => void;
  onClearContext: () => void;
  onApplySuggestion: (suggestionId: string, text: string) => void;
  isLoading: boolean;
}

function MessageBubble({ 
  message, 
  onApplySuggestion 
}: { 
  message: ChatMessage;
  onApplySuggestion: (id: string, text: string) => void;
}) {
  const isUser = message.role === "user";
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div 
        className={`max-w-[85%] rounded-lg px-4 py-3 ${
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted"
        }`}
      >
        {message.context && !isUser && (
          <div className="mb-2 pb-2 border-b border-border/50">
            <Badge variant="outline" className="text-xs gap-1">
              <Sparkles className="h-3 w-3" />
              Context
            </Badge>
          </div>
        )}
        
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.suggestions.map((suggestion) => (
              <div 
                key={suggestion.id}
                className="bg-background/80 rounded-md p-3 space-y-2"
              >
                <p className="text-sm">{suggestion.text}</p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => handleCopy(suggestion.id, suggestion.text)}
                    data-testid={`button-copy-${suggestion.id}`}
                  >
                    {copiedId === suggestion.id ? (
                      <>
                        <Check className="h-3 w-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => onApplySuggestion(suggestion.id, suggestion.text)}
                    disabled={suggestion.applied}
                    data-testid={`button-apply-${suggestion.id}`}
                  >
                    {suggestion.applied ? (
                      <>
                        <Check className="h-3 w-3" />
                        Applied
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3" />
                        Apply
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <p className="text-xs opacity-60 mt-2">
          {new Date(message.timestamp).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

export function MaestraChat({
  messages,
  selectedText,
  onSendMessage,
  onClearContext,
  onApplySuggestion,
  isLoading,
}: MaestraChatProps) {
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = () => {
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Maestra</h3>
            <p className="text-xs text-muted-foreground">AI Assistant</p>
          </div>
        </div>
      </div>

      {selectedText && (
        <div className="flex-shrink-0 px-4 py-2 bg-accent/50 border-b">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Badge variant="secondary" className="text-xs shrink-0">
                Selected
              </Badge>
              <span className="text-xs text-muted-foreground truncate">
                "{selectedText.slice(0, 60)}{selectedText.length > 60 ? "..." : ""}"
              </span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 shrink-0"
              onClick={onClearContext}
              data-testid="button-clear-context"
              aria-label="Clear selection"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Start a conversation</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                Select text in the PDF or ask Maestra to help you edit
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={message}
                onApplySuggestion={onApplySuggestion}
              />
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Maestra is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex-shrink-0 p-4 border-t bg-background">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedText ? "How would you like to rewrite this?" : "Ask Maestra anything..."}
            className="min-h-[2.5rem] max-h-32 resize-none"
            rows={1}
            data-testid="input-chat-message"
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isLoading}
            data-testid="button-send-message"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
