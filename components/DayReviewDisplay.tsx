import React from 'react';

interface DayReviewDisplayProps {
  reviewText: string;
}

const DayReviewDisplay: React.FC<DayReviewDisplayProps> = ({ reviewText }) => {
  // Function to detect if this is a day review
  const isDayReview = (text: string): boolean => {
    const reviewKeywords = [
      'day\'s activities', 'what you did well', 'fired up for tomorrow',
      'review of my day', 'today\'s progress', 'daily review',
      'great job today', 'tomorrow\'s plan', 'keep it up'
    ];
    
    const lowerText = text.toLowerCase();
    return reviewKeywords.some(keyword => lowerText.includes(keyword));
  };

  // Function to parse and format the day review
  const formatDayReview = (text: string): React.ReactElement[] => {
    const lines = text.split('\n');
    const formattedElements: React.ReactElement[] = [];
    let keyCounter = 0;

    for (const [, line] of lines.entries()) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Handle main sections (## headings)
      if (trimmedLine.startsWith('## ')) {
        const sectionName = trimmedLine.replace('## ', '');
        formattedElements.push(
          <div key={keyCounter++} className="mt-6 mb-4">
            <h3 className="text-xl font-bold text-fuchsia-400 border-b border-fuchsia-400/30 pb-2 mb-3 flex items-center">
              <span className="text-2xl mr-2">🥊</span>
              {sectionName}
            </h3>
          </div>
        );
      }
      // Handle accomplishments or achievements
      else if (trimmedLine.startsWith('### ') || trimmedLine.toLowerCase().includes('you did well') || trimmedLine.toLowerCase().includes('great job')) {
        const achievement = trimmedLine.replace('### ', '');
        formattedElements.push(
          <div key={keyCounter++} className="mb-4">
            <h4 className="text-lg font-semibold text-green-400 mb-2 flex items-center">
              <span className="text-xl mr-2">✅</span>
              {achievement}
            </h4>
          </div>
        );
      }
      // Handle motivational sections
      else if (trimmedLine.toLowerCase().includes('tomorrow') || trimmedLine.toLowerCase().includes('keep it up') || trimmedLine.toLowerCase().includes('fired up')) {
        formattedElements.push(
          <div key={keyCounter++} className="mb-4">
            <div className="bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20 border border-fuchsia-500/30 rounded-lg p-4">
              <p className="text-fuchsia-200 font-medium text-sm leading-relaxed flex items-start">
                <span className="text-xl mr-2 mt-1">🔥</span>
                <span>{trimmedLine}</span>
              </p>
            </div>
          </div>
        );
      }
      // Handle bullet points
      else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        const item = trimmedLine.replace(/^[-*] /, '');
        formattedElements.push(
          <div key={keyCounter++} className="ml-5 mb-2">
            <div className="flex items-start">
              <span className="text-fuchsia-400 mr-2 mt-1">•</span>
              <span className="text-gray-200 text-sm leading-relaxed">{item}</span>
            </div>
          </div>
        );
      }
      // Handle numbered items
      else if (/^\d+\.\s/.test(trimmedLine)) {
        const item = trimmedLine.replace(/^\d+\.\s/, '');
        formattedElements.push(
          <div key={keyCounter++} className="ml-5 mb-2">
            <div className="flex items-start">
              <span className="text-fuchsia-400 mr-2 mt-1">•</span>
              <span className="text-gray-200 text-sm leading-relaxed">{item}</span>
            </div>
          </div>
        );
      }
      // Handle regular paragraphs
      else if (trimmedLine && !trimmedLine.startsWith('#') && !trimmedLine.startsWith('-') && !trimmedLine.startsWith('*') && !/^\d+\.\s/.test(trimmedLine)) {
        formattedElements.push(
          <div key={keyCounter++} className="mb-3">
            <p className="text-gray-300 text-sm leading-relaxed">{trimmedLine}</p>
          </div>
        );
      }
    }

    return formattedElements;
  };

  // Only render if this looks like a day review
  if (!isDayReview(reviewText)) {
    return null;
  }

  return (
    <div className="mt-3 border-t border-zinc-700/50 pt-4">
      <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 rounded-lg p-3 sm:p-4 border border-zinc-700/30">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-2">📊</span>
          <h2 className="text-lg font-bold text-fuchsia-400">Your Day Review</h2>
        </div>
        <div className="space-y-2">
          {formatDayReview(reviewText)}
        </div>
      </div>
    </div>
  );
};

export default DayReviewDisplay;
