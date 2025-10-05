
import React, { useRef, useEffect } from 'react';
import type { Message, WorkoutPlan, User } from '../types';
import { LoadingIcon, PlayIcon } from './icons';
import WorkoutDisplay from './WorkoutDisplay';
import NutritionPlanDisplay from './NutritionPlanDisplay';
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
    const nutritionKeywords = [
      'breakfast', 'lunch', 'dinner', 'meal plan', 'nutrition plan',
      '### breakfast', '### lunch', '### dinner', '## monday', '## tuesday',
      '## wednesday', '## thursday', '## friday', '## saturday', '## sunday'
    ];
    
    const lowerText = text.toLowerCase();
    return nutritionKeywords.some(keyword => lowerText.includes(keyword)) && 
           (lowerText.includes('###') || lowerText.includes('##'));
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
    
    if (message.sender === 'sammi' && isNutritionPlan(message.text)) {
      return (
        <>
          <div
            className="prose"
            dangerouslySetInnerHTML={createMarkup(message.text)}
          />
          <NutritionPlanDisplay planText={message.text} />
        </>
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
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
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
                className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${
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
    </div>
  );
};

export default ChatWindow;
