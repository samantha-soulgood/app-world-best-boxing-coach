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
          <div key={keyCounter++} className="mt-4 mb-3">
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 rounded-lg">
              <span className="text-2xl">📅</span>
              <h3 className="text-base font-bold text-green-900">{dayName}</h3>
            </div>
          </div>
        );
      }
      // Handle meal headings (### Breakfast, ### Lunch, etc.)
      else if (trimmedLine.startsWith('### ')) {
        const mealName = trimmedLine.replace('### ', '');
        const mealEmoji = mealName.toLowerCase().includes('breakfast') ? '🌅' :
                         mealName.toLowerCase().includes('lunch') ? '☀️' :
                         mealName.toLowerCase().includes('dinner') ? '🌙' :
                         mealName.toLowerCase().includes('snack') ? '🍎' : '🍽️';
        formattedElements.push(
          <div key={keyCounter++} className="mb-3">
            <div className="flex items-center gap-2 p-2.5 bg-white border-2 border-green-200 rounded-lg">
              <span className="text-xl">{mealEmoji}</span>
              <h4 className="text-base font-semibold text-gray-900">{mealName}</h4>
            </div>
          </div>
        );
      }
      // Handle meal items (starting with - or *)
      else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        const mealItem = trimmedLine.replace(/^[-*] /, '');
        formattedElements.push(
          <div key={keyCounter++} className="ml-3 mb-2">
            <div className="flex items-start gap-2 p-2.5 bg-white border border-green-200 rounded-lg">
              <span className="text-base flex-shrink-0">🥗</span>
              <span 
                className="text-gray-900 text-sm leading-relaxed prose flex-1 font-medium"
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
          <div key={keyCounter++} className="ml-3 mb-2">
            <div className="flex items-start gap-2 p-2.5 bg-white border border-green-200 rounded-lg">
              <span className="text-base flex-shrink-0">🥗</span>
              <span className="text-gray-900 text-sm leading-relaxed font-medium">{item}</span>
            </div>
          </div>
        );
      }
      // Handle regular paragraphs (not empty, not special formatting)
      else if (trimmedLine && !trimmedLine.startsWith('#') && !trimmedLine.startsWith('-') && !trimmedLine.startsWith('*') && !/^\d+\.\s/.test(trimmedLine)) {
        formattedElements.push(
          <div key={keyCounter++} className="mb-3">
            <p 
              className="text-gray-900 text-sm leading-relaxed prose font-medium"
              dangerouslySetInnerHTML={{ __html: window.marked.parse(trimmedLine) }}
            />
          </div>
        );
      }
    }

    return formattedElements;
  };

  return (
    <div className="mt-4 p-5 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 rounded-lg">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-3xl">🍱</span>
          <h2 className="text-lg font-bold text-gray-900">Your Meal Plan</h2>
        </div>
      </div>
      <div className="space-y-3">
        {formatNutritionPlan(planText)}
      </div>
    </div>
  );
};

export default NutritionPlanDisplay;
