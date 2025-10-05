import React, { useState } from 'react';
import type { JournalEntry } from '../types';
import { CloseIcon, JournalIcon } from './icons';

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
    <div className="fixed inset-0 bg-zinc-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-zinc-800 rounded-2xl shadow-lg border border-zinc-700 flex flex-col max-h-[90vh]">
        <header className="flex items-center justify-between p-4 border-b border-zinc-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <JournalIcon className="w-6 h-6 text-fuchsia-400" />
            <h2 className="text-xl font-display font-bold text-white tracking-wider">Training Journal</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <CloseIcon />
          </button>
        </header>
        
        <div className="overflow-y-auto p-4 flex-1">
          {entries.length === 0 ? (
            <div className="text-center text-gray-400 py-10">
                <p>Your journal is empty.</p>
                <p className="text-sm">Use this space to track your progress, mood, or anything on your mind.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {entries.map((entry) => (
                <li key={entry.id} className="bg-zinc-900 p-3 rounded-lg">
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{entry.text}</p>
                  <p className="text-xs text-gray-500 mt-2 text-right">
                    {new Date(entry.timestamp).toLocaleDateString('en-US', {
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

        <footer className="p-4 border-t border-zinc-700 flex-shrink-0">
          <textarea
            value={newEntryText}
            onChange={(e) => setNewEntryText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="How was your training today, champ?"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-fuchsia-500 focus:outline-none resize-none transition-all duration-200"
            rows={3}
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">Press <kbd className="font-sans text-xs p-1 bg-zinc-700 rounded">Ctrl+Enter</kbd> to save.</p>
            <button
                onClick={handleSave}
                disabled={!newEntryText.trim()}
                className="font-bold text-white bg-fuchsia-600 rounded-lg py-2 px-5 hover:bg-fuchsia-500 disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors duration-200"
            >
                Save Entry
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Journal;
