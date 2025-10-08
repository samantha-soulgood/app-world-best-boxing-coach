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
          <div key={keyCounter++} className="mt-4 mb-3">
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-300 rounded-lg">
              <span className="text-2xl">🎯</span>
              <h3 className="text-base font-bold text-blue-900">{sectionName}</h3>
            </div>
          </div>
        );
      }
      // Handle accomplishments or achievements
      else if (trimmedLine.startsWith('### ') || trimmedLine.toLowerCase().includes('you did well') || trimmedLine.toLowerCase().includes('great job')) {
        const achievement = trimmedLine.replace('### ', '');
        formattedElements.push(
          <div key={keyCounter++} className="mb-3">
            <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 border border-green-300 rounded-lg">
              <h4 className="text-base font-semibold text-green-800 flex items-center gap-2">
                <span className="text-xl">✅</span>
                {achievement}
              </h4>
            </div>
          </div>
        );
      }
      // Handle motivational sections
      else if (trimmedLine.toLowerCase().includes('tomorrow') || trimmedLine.toLowerCase().includes('keep it up') || trimmedLine.toLowerCase().includes('fired up')) {
        formattedElements.push(
          <div key={keyCounter++} className="mb-3">
            <div className="bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-300 p-4 rounded-lg">
              <p className="text-orange-900 font-semibold text-sm leading-relaxed flex items-start gap-2">
                <span className="text-xl">🔥</span>
                <span 
                  className="prose flex-1"
                  dangerouslySetInnerHTML={{ __html: window.marked.parse(trimmedLine) }}
                />
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
              <span className="text-blue-600 mr-2 mt-1">•</span>
              <span 
                className="text-gray-800 text-sm leading-relaxed prose"
                dangerouslySetInnerHTML={{ __html: window.marked.parse(item) }}
              />
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
              <span className="text-blue-600 mr-2 mt-1">•</span>
              <span 
                className="text-gray-800 text-sm leading-relaxed prose"
                dangerouslySetInnerHTML={{ __html: window.marked.parse(item) }}
              />
            </div>
          </div>
        );
      }
      // Handle regular paragraphs
      else if (trimmedLine && !trimmedLine.startsWith('#') && !trimmedLine.startsWith('-') && !trimmedLine.startsWith('*') && !/^\d+\.\s/.test(trimmedLine)) {
        formattedElements.push(
          <div key={keyCounter++} className="mb-3">
            <p 
              className="text-gray-700 text-sm leading-relaxed prose"
              dangerouslySetInnerHTML={{ __html: window.marked.parse(trimmedLine) }}
            />
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
    <div className="mt-4 p-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-lg">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-3xl">📊</span>
          <h2 className="text-lg font-bold text-gray-900">Your Day Review</h2>
        </div>
      </div>
      <div className="space-y-3">
        {formatDayReview(reviewText)}
      </div>
    </div>
  );
};

export default DayReviewDisplay;
