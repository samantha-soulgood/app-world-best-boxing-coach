import React, { useState } from 'react';
import type { JournalEntry } from '../types';
import { CloseIcon, JournalIcon } from './Icons';

interface JournalProps {
  entries: JournalEntry[];
  onClose: () => void;
  onAddEntry: (text: string) => void;
}

const Journal: React.FC<JournalProps> = ({ entries, onClose, onAddEntry }) => {
  const [newEntryText, setNewEntryText] = useState('');

  const handleSave = () => {
    if (newEntryText.trim()) {
      onAddEntry(newEntryText);
      setNewEntryText('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleSave();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white border-2 border-gray-300 rounded-lg flex flex-col max-h-[90vh]">
        <header className="flex items-center justify-between p-4 border-b-2 border-orange-200 flex-shrink-0 bg-gradient-to-r from-orange-100 to-amber-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📓</span>
            <h2 className="text-xl font-display font-bold text-gray-900 tracking-wider">Training Journal</h2>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900 transition-colors text-2xl">
            <CloseIcon />
          </button>
        </header>
        
        <div className="overflow-y-auto p-4 flex-1 bg-gray-50">
          {entries.length === 0 ? (
            <div className="text-center text-gray-600 py-10">
                <p className="text-lg font-semibold">📖 Your journal is empty.</p>
                <p className="text-sm mt-2">Use this space to track your progress, mood, or anything on your mind.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {entries.map((entry) => (
                <li key={entry.id} className="bg-white border-2 border-orange-200 p-4 rounded-lg">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{entry.text}</p>
                  <p className="text-xs text-gray-600 mt-3 text-right font-medium">
                    📅 {new Date(entry.timestamp).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="p-4 border-t-2 border-orange-200 flex-shrink-0 bg-white">
          <textarea
            value={newEntryText}
            onChange={(e) => setNewEntryText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="How was your training today, champ? 💭"
            className="w-full bg-white border-2 border-orange-200 rounded-lg p-3 text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 focus:outline-none resize-none transition-all duration-200"
            rows={3}
          />
          <div className="flex justify-between items-center mt-3">
            <p className="text-xs text-gray-600">Press <kbd className="font-sans text-xs px-2 py-1 bg-gray-100 border border-gray-300 rounded">Ctrl+Enter</kbd> to save.</p>
            <button
                onClick={handleSave}
                disabled={!newEntryText.trim()}
                className="text-sm font-bold text-gray-900 bg-gradient-to-r from-orange-100 to-amber-100 hover:from-orange-200 hover:to-amber-200 rounded-lg px-4 py-2.5 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 border-2 border-orange-300 flex items-center gap-2"
            >
                <span>💾</span>
                <span>Save Entry</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Journal;
