import React from 'react';

interface NutritionPlanDisplayProps {
  planText: string;
}

const NutritionPlanDisplay: React.FC<NutritionPlanDisplayProps> = ({ planText }) => {
  // Function to parse and format the nutrition plan text
  const formatNutritionPlan = (text: string) => {
    // Split by lines and process each line
    const lines = text.split('\n');
    const formattedElements: React.ReactElement[] = [];
    let keyCounter = 0;

    for (const [, line] of lines.entries()) {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) continue;

      // Handle main headings (## Day names or main sections)
      if (trimmedLine.startsWith('## ') && !trimmedLine.startsWith('### ')) {
        const dayName = trimmedLine.replace('## ', '');
        formattedElements.push(
          <div key={keyCounter++} className="mt-6 mb-4">
            <h3 className="text-xl font-bold text-fuchsia-400 border-b border-fuchsia-400/30 pb-2 mb-3">
              {dayName}
            </h3>
          </div>
        );
      }
      // Handle meal headings (### Breakfast, ### Lunch, etc.)
      else if (trimmedLine.startsWith('### ')) {
        const mealName = trimmedLine.replace('### ', '');
        formattedElements.push(
          <div key={keyCounter++} className="mb-4">
            <h4 className="text-lg font-semibold text-white mb-2 flex items-center">
              <span className="w-2 h-2 bg-fuchsia-500 rounded-full mr-3"></span>
              {mealName}
            </h4>
          </div>
        );
      }
      // Handle meal items (starting with - or *)
      else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        const mealItem = trimmedLine.replace(/^[-*] /, '');
        formattedElements.push(
          <div key={keyCounter++} className="ml-5 mb-2">
            <div className="flex items-start">
              <span className="text-fuchsia-400 mr-2 mt-1">•</span>
              <span 
                className="text-gray-200 text-sm leading-relaxed prose"
                dangerouslySetInnerHTML={{ __html: window.marked.parse(mealItem) }}
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
              <span className="text-fuchsia-400 mr-2 mt-1">•</span>
              <span className="text-gray-200 text-sm leading-relaxed">{item}</span>
            </div>
          </div>
        );
      }
      // Handle regular paragraphs (not empty, not special formatting)
      else if (trimmedLine && !trimmedLine.startsWith('#') && !trimmedLine.startsWith('-') && !trimmedLine.startsWith('*') && !/^\d+\.\s/.test(trimmedLine)) {
        formattedElements.push(
          <div key={keyCounter++} className="mb-3">
            <p 
              className="text-gray-300 text-sm leading-relaxed prose"
              dangerouslySetInnerHTML={{ __html: window.marked.parse(trimmedLine) }}
            />
          </div>
        );
      }
    }

    return formattedElements;
  };

  return (
    <div className="mt-3 border-t border-zinc-700/50 pt-4">
      <div className="bg-zinc-800/50 rounded-lg p-3 sm:p-4 border border-zinc-700/30">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-2">🍱</span>
          <h2 className="text-lg font-bold text-fuchsia-400">Your Meal Plan</h2>
        </div>
        <div className="space-y-2">
          {formatNutritionPlan(planText)}
        </div>
      </div>
    </div>
  );
};

export default NutritionPlanDisplay;
