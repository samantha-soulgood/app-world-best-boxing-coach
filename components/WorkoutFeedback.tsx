import React, { useState } from 'react';

interface WorkoutFeedbackProps {
  onSubmit: (feedback: { rpe: number; text: string }) => void;
}

const WorkoutFeedback: React.FC<WorkoutFeedbackProps> = ({ onSubmit }) => {
  const [rpe, setRpe] = useState<number | null>(null);
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rpe !== null) {
      onSubmit({ rpe, text });
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-900 z-50 flex flex-col items-center justify-center text-center p-4 animate-fade-in">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-fuchsia-400 mb-2 tracking-wider">WORKOUT COMPLETE!</h1>
      <p className="text-base sm:text-lg text-white max-w-md mb-6">Great job! Let me know how that felt so I can adjust your next session.</p>
      
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
        <div>
          <label className="block text-md font-semibold text-gray-200 mb-3">How hard was that? (1 = Easy, 10 = Max Effort)</label>
          <div className="flex justify-center flex-wrap gap-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
              <button
                type="button"
                key={num}
                onClick={() => setRpe(num)}
                className={`w-10 h-10 rounded-full font-bold text-lg transition-all duration-200 border ${
                  rpe === num
                    ? 'bg-fuchsia-500 border-fuchsia-400 text-white'
                    : 'bg-zinc-700 border-zinc-600 text-gray-300 hover:bg-zinc-600 hover:border-zinc-500'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label htmlFor="feedback-text" className="block text-md font-semibold text-gray-200 mb-3">Any other feedback?</label>
          <textarea
            id="feedback-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-fuchsia-500 focus:outline-none resize-none transition-all duration-200"
            placeholder="e.g., 'The core finisher was tough!', 'My left hook felt weak today.', 'Felt great!'"
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={rpe === null}
          className="w-full p-3 font-bold text-white bg-fuchsia-600 rounded-lg hover:bg-fuchsia-500 disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors duration-200"
        >
          Submit & Finish
        </button>
      </form>
    </div>
  );
};

export default WorkoutFeedback;
