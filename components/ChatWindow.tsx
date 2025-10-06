
import React, { useRef, useEffect, useState } from 'react';
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
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const createMarkup = (text: string) => {
    // Use marked from the window object to parse markdown.
    const rawMarkup = window.marked.parse(text);
    return { __html: rawMarkup };
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
      return (
        <>
          <div
            className="prose"
            dangerouslySetInnerHTML={createMarkup(message.workoutPlan.summary)}
          />
          <WorkoutDisplay plan={message.workoutPlan} />
        </>
      );
    }
    
    // Handle video messages
    if (message.sender === 'sammi' && message.video) {
      return (
        <div className="space-y-3">
          <div
            className="prose"
            dangerouslySetInnerHTML={createMarkup(message.text)}
          />
          <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">Video Tutorial</h3>
              <button
                onClick={() => setSelectedVideo(message.video!)}
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
        
        return (
          <>
            <div
              className="prose"
              dangerouslySetInnerHTML={createMarkup(introText)}
            />
            <NutritionPlanDisplay planText={extractedPlan} />
          </>
        );
      }
      
      // For clean nutrition plans, show only the formatted version
      return (
        <NutritionPlanDisplay planText={message.text} />
      );
    }
    
    return (
      <div
        className="prose"
        dangerouslySetInnerHTML={createMarkup(message.text)}
      />
    );
  };

  return (
    <div className="flex-1 overflow-y-auto px-2 py-4 sm:px-4 space-y-6">
      {messages.map((message) => {
        return (
          <div
            key={message.id}
            className={`flex items-end gap-3 ${
              message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
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
                {renderMessageContent(message)}
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
      })}
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

export default ChatWindow;
