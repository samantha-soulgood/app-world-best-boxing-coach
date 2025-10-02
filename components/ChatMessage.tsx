import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, Role } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { LogoIcon, UserIcon, YouTubeIcon } from './Icons';

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading = false }) => {
  const isModel = message.role === Role.Model;

  const containerClasses = `flex items-start gap-3 md:gap-4 ${isModel ? '' : 'justify-end'}`;
  const bubbleClasses = `max-w-xl p-5 rounded-2xl shadow-md text-base leading-relaxed ${
    isModel
      ? 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
      : 'bg-rose-500 text-white rounded-tr-none'
  }`;
  
  const avatarClasses = `w-8 h-8 md:w-10 md:h-10 rounded-full flex-shrink-0 flex items-center justify-center shadow-inner overflow-hidden ${
    isModel ? 'bg-white' : 'bg-rose-500'
  }`;

  return (
    <div className={containerClasses}>
      {isModel && (
        <div className={avatarClasses}>
          <LogoIcon className="w-full h-full" />
        </div>
      )}
      <div className={bubbleClasses}>
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <LoadingSpinner />
            <span className="text-gray-500 animate-pulse">Thinking...</span>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none prose-p:my-4 first:prose-p:mt-0 last:prose-p:mb-0 prose-ul:my-2 prose-ol:my-2">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ node, ...props }) => {
                  if (props.href && props.href.includes('youtube.com')) {
                    return (
                      <a
                        {...props}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 font-semibold no-underline hover:underline ${isModel ? 'text-rose-600' : 'text-white'
                          }`}
                      >
                        {props.children}
                        <YouTubeIcon className={`w-5 h-5 ${isModel ? 'text-red-600' : 'text-white'}`} />
                      </a>
                    );
                  }
                  return <a {...props} target="_blank" rel="noopener noreferrer" className={isModel ? 'font-semibold text-rose-600 hover:underline' : 'font-bold text-white underline'}>{props.children}</a>;
                }
              }}
            >
              {message.text}
            </ReactMarkdown>
          </div>
        )}
      </div>
      {!isModel && (
         <div className={avatarClasses}>
            <UserIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;