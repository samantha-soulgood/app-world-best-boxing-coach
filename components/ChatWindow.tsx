
import React, { useRef, useEffect, useState, useMemo } from 'react';
import type { Message, WorkoutPlan, User, Video } from '../types';
import { LoadingIcon, PlayIcon } from './Icons';
import WorkoutDisplay from './WorkoutDisplay';
import NutritionPlanDisplay from './NutritionPlanDisplay';
import DayReviewDisplay from './DayReviewDisplay';
import VideoPlayer from './VideoPlayer';
import Avatar from './Avatar';
import UserAvatar from './UserAvatar';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  isGeneratingWorkout?: boolean;
  onStartWorkout: (plan: WorkoutPlan, messageId: string) => void;
  currentUser: User | null;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, isGeneratingWorkout, onStartWorkout, currentUser }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const isNearBottom = () => {
    const el = containerRef.current;
    if (!el) return true;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distanceFromBottom < 200; // only autoscroll if user is near bottom
  };

  useEffect(() => {
    if (isNearBottom()) {
      scrollRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages.length, isLoading]);

  const useParsedMarkdown = (text: string) => {
    return useMemo(() => {
      const rawMarkup = window.marked.parse(text);
      return { __html: rawMarkup };
    }, [text]);
  };

  // Helper function to detect if a message contains a nutrition plan
  const isNutritionPlan = (text: string): boolean => {
    // Skip if it contains Python code snippets
    if (text.includes('print(createNutritionPlan') || text.includes('```python') || text.includes('```')) {
      return false;
    }
    
    const nutritionKeywords = [
      'breakfast', 'lunch', 'dinner', 'meal plan', 'nutrition plan',
      '### breakfast', '### lunch', '### dinner', '## monday', '## tuesday',
      '## wednesday', '## thursday', '## friday', '## saturday', '## sunday'
    ];
    
    const lowerText = text.toLowerCase();
    return nutritionKeywords.some(keyword => lowerText.includes(keyword)) && 
           (lowerText.includes('###') || lowerText.includes('##'));
  };

  // Helper function to detect if a message contains a day review
  const isDayReview = (text: string): boolean => {
    const reviewKeywords = [
      'day\'s activities', 'what you did well', 'fired up for tomorrow',
      'review of my day', 'today\'s progress', 'daily review',
      'great job today', 'tomorrow\'s plan', 'keep it up',
      'last 24 hours', 'your day\'s activities'
    ];
    
    const lowerText = text.toLowerCase();
    return reviewKeywords.some(keyword => lowerText.includes(keyword));
  };

  // Helper function to extract nutrition plan content from text
  const extractNutritionPlan = (text: string): string => {
    // If the text contains a Python code snippet, try to extract the plan content
    if (text.includes('print(createNutritionPlan')) {
      // Look for the plan content after the opening triple quotes
      const planRegex = /plan='''\s*([\s\S]*?)'''/;
      const planMatch = planRegex.exec(text);
      if (planMatch?.[1]) {
        return planMatch[1].trim();
      }
    }
    
    // If it's already a clean nutrition plan, return as is
    return text;
  };

  // Helper function to render message content
  const renderMessageContent = (message: Message) => {
    if (message.sender === 'sammi' && message.workoutPlan) {
      const summaryHtml = useParsedMarkdown(message.workoutPlan.summary);
      return (
        <>
          <div className="prose" dangerouslySetInnerHTML={summaryHtml} />
          <WorkoutDisplay plan={message.workoutPlan} />
        </>
      );
    }
    
    // Handle video messages
    if (message.sender === 'sammi' && message.video) {
      const textHtml = useParsedMarkdown(message.text);
      return (
        <div className="space-y-3">
          <div className="prose" dangerouslySetInnerHTML={textHtml} />
          <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">Video Tutorial</h3>
              <button
                onClick={() => setSelectedVideo(message.video)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors flex items-center gap-2"
              >
                <PlayIcon className="w-4 h-4" />
                Watch Video
              </button>
            </div>
            <p className="text-gray-300 text-sm">{message.video.title}</p>
          </div>
        </div>
      );
    }
    
    // Check if this contains a day review
    if (message.sender === 'sammi' && isDayReview(message.text)) {
      return (
        <DayReviewDisplay reviewText={message.text} />
      );
    }
    
    // Check if this contains a nutrition plan (either clean format or Python code snippet)
    if (message.sender === 'sammi' && (isNutritionPlan(message.text) || message.text.includes('print(createNutritionPlan'))) {
      const extractedPlan = extractNutritionPlan(message.text);
      
      // If we extracted a plan from Python code, show intro text + formatted plan
      if (message.text.includes('print(createNutritionPlan') && extractedPlan !== message.text) {
        // Extract the intro text before the Python code
        const introRegex = /^(.*?)(?=print\(createNutritionPlan)/s;
        const introMatch = introRegex.exec(message.text);
        const introText = introMatch?.[1]?.trim() ?? "Here's your nutrition plan:";
        
        const introHtml = useParsedMarkdown(introText);
        return (
          <>
            <div className="prose" dangerouslySetInnerHTML={introHtml} />
            <NutritionPlanDisplay planText={extractedPlan} />
          </>
        );
      }
      
      // For clean nutrition plans, show only the formatted version
      return (
        <NutritionPlanDisplay planText={message.text} />
      );
    }
    
    const textHtml = useParsedMarkdown(message.text);
    return <div className="prose" dangerouslySetInnerHTML={textHtml} />;
  };

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-2 py-4 sm:px-4 space-y-6">
      {messages.map((message) => (
        <MemoMessage
          key={message.id}
          message={message}
          currentUser={currentUser}
          renderContent={renderMessageContent}
          onStartWorkout={onStartWorkout}
        />
      ))}
      {isLoading && (
        <div className="flex items-end gap-3 flex-row">
            <div className="flex-shrink-0">
              <Avatar size="w-8 h-8" />
            </div>
            <div className="bg-zinc-800 text-gray-200 rounded-2xl rounded-bl-none p-4 inline-flex items-center justify-center gap-2">
                <LoadingIcon />
                {isGeneratingWorkout && (
                  <span className="text-sm text-gray-400">Sammi's building your workout...</span>
                )}
            </div>
        </div>
      )}
      <div ref={scrollRef} />
      {selectedVideo && (
        <VideoPlayer 
          video={selectedVideo} 
          onClose={() => setSelectedVideo(null)} 
        />
      )}
    </div>
  );
};

interface MemoMessageProps {
  message: Message;
  currentUser: User | null;
  renderContent: (m: Message) => React.ReactNode;
  onStartWorkout: (plan: WorkoutPlan, messageId: string) => void;
}

const MemoMessage: React.FC<MemoMessageProps> = React.memo(({ message, currentUser, renderContent, onStartWorkout }) => {
  return (
    <div
      className={`flex items-end gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className="flex-shrink-0">
        {message.sender === 'user' && currentUser ? (
          <UserAvatar user={currentUser} size="w-8 h-8" />
        ) : (
          <Avatar size="w-8 h-8" />
        )}
      </div>
      <div className="flex flex-col">
        <div
          className={`max-w-[280px] sm:max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${
            message.sender === 'user'
              ? 'bg-fuchsia-600 text-white rounded-br-none'
              : 'bg-zinc-800 text-gray-200 rounded-bl-none'
          }`}
        >
          {renderContent(message)}
        </div>
        {message.sender === 'sammi' && message.workoutPlan && (
          <button
            onClick={() => onStartWorkout(message.workoutPlan, message.id)}
            className="mt-2 self-start text-sm font-bold text-white bg-green-600 rounded-lg px-3 py-2 hover:bg-green-500 transition-all duration-200 flex items-center justify-center gap-2 animate-fade-in"
          >
            <PlayIcon className="w-5 h-5" />
            <span>Play Workout</span>
          </button>
        )}
      </div>
    </div>
  );
}, (prev, next) => {
  return (
    prev.message.id === next.message.id &&
    prev.message.text === next.message.text &&
    prev.message.workoutPlan === next.message.workoutPlan &&
    prev.message.video === next.message.video &&
    prev.currentUser === next.currentUser
  );
});

export default ChatWindow;
