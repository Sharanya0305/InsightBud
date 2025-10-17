'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, Send, Loader2 } from 'lucide-react';
import { useAppContext } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { answerFinancialQuery } from '@/ai/flows/finance-chatbot-flow';
import { type Message } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';


export function FinanceChatbot() {
  const { state } = useAppContext();
  const { expenses, categories, budget, loading } = state;
  const { toast } = useToast();
  
  const [query, setQuery] = React.useState('');
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isThinking, setIsThinking] = React.useState(false);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Auto-scroll to the bottom when new messages are added
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages]);


  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isThinking) return;

    const userMessage: Message = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsThinking(true);

    try {
      const processedExpenses = expenses.map(e => ({
        ...e,
        date: e.date instanceof Timestamp ? e.date.toDate().toISOString() : new Date(e.date).toISOString(),
      }));

      const processedBudget = budget ? { ...budget, createdAt: budget.createdAt instanceof Timestamp ? budget.createdAt.toDate().toISOString() : new Date(budget.createdAt).toISOString() } : null;

      const result = await answerFinancialQuery({
        query: query,
        expenses: processedExpenses,
        categories: categories,
        budget: processedBudget,
        history: messages,
      });
      
      const assistantMessage: Message = { role: 'assistant', content: result.answer };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error answering financial query:', error);
      toast({
        variant: 'destructive',
        title: 'AI Chatbot Error',
        description: 'I had trouble coming up with an answer. Please try again.',
      });
       const errorMessage: Message = { role: 'assistant', content: "Sorry, I couldn't process that request." };
       setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader>
        <CardTitle>Your Financial Assistant</CardTitle>
        <CardDescription>Ask InsightBud anything about your spending.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
            <div className="space-y-4 pr-4">
            {messages.length === 0 && (
                <div className="flex h-full min-h-[250px] items-center justify-center text-center">
                    <p className="text-muted-foreground">
                        Ask a question to get started, like:
                        <br />
                        <em className='block mt-2'>"How much did I spend on food last month?"</em>
                    </p>
                </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-3 text-sm',
                  message.role === 'user' && 'justify-end'
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-xs rounded-lg p-3',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p>{message.content}</p>
                </div>
                 {message.role === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
             {isThinking && (
                <div className="flex items-start gap-3 text-sm">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
                    </Avatar>
                    <div className="max-w-xs rounded-lg p-3 bg-muted">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                </div>
            )}
            </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-4 border-t">
        <form onSubmit={handleQuerySubmit} className="flex w-full items-center space-x-2">
          <Input
            id="message"
            placeholder="e.g., How much did I spend on shopping?"
            value={query}
            onChange={e => setQuery(e.target.value)}
            disabled={isThinking}
          />
          <Button type="submit" disabled={isThinking || !query.trim()}>
            {isThinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
