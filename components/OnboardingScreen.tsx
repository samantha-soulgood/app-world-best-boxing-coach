import React, { useState } from 'react';
import type { OnboardingData, User } from '../types';

interface OnboardingScreenProps {
  onSubmit: (data: OnboardingData) => void;
  currentUser: User;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onSubmit, currentUser }) => {
  const [pronouns, setPronouns] = useState('');
  const [age, setAge] = useState('');
  const [goals, setGoals] = useState('');
  const [injuries, setInjuries] = useState('');
  const [equipment, setEquipment] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [dietaryPreferences, setDietaryPreferences] = useState('');
  const [foodAllergies, setFoodAllergies] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activityLevel) { // Ensure an activity level is selected
        onSubmit({ pronouns, age, goals, injuries, equipment, activityLevel, dietaryPreferences, foodAllergies });
    }
  };

  const userName = currentUser?.name || 'Champ';

  const inputStyles = "block w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-fuchsia-500 focus:outline-none transition-all duration-200";
  const labelStyles = "block text-sm font-medium text-gray-300 mb-2";

  const activityLevels = [
    { key: 'beginner', label: 'Just starting out' },
    { key: 'intermediate', label: 'I exercise moderately (1-2 times/week)' },
    { key: 'advanced', label: "I'm active (3+ times/week)" }
  ];

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-900 p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-zinc-800 rounded-2xl shadow-lg border border-zinc-700">
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold text-white tracking-wider">LET'S GET PERSONAL</h1>
          <p className="mt-2 text-fuchsia-400">Tell me a bit about yourself so I can be the best coach for you.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="pronouns" className={labelStyles}>
                    Pronouns
                </label>
                <input
                id="pronouns"
                type="text"
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                className={inputStyles}
                placeholder="e.g., she/her, he/him, they/them"
                />
            </div>
            <div>
                <label htmlFor="age" className={labelStyles}>
                    Age
                </label>
                <input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className={inputStyles}
                placeholder="e.g., 28"
                />
            </div>
          </div>
          <div>
            <label className={labelStyles}>What's your current activity level? <span className="text-red-400">*</span></label>
            <div className="grid grid-cols-1 gap-2">
                {activityLevels.map(({ key, label }) => (
                    <button
                        type="button"
                        key={key}
                        onClick={() => setActivityLevel(label)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 ${
                            activityLevel === label
                                ? 'bg-fuchsia-600/30 border-fuchsia-500 text-white'
                                : 'bg-zinc-900 border-zinc-700 text-gray-300 hover:bg-zinc-700/50 hover:border-zinc-600'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>
          </div>
          <div>
            <label htmlFor="goals" className={labelStyles}>
              What are your main fitness goals?
            </label>
            <textarea
              id="goals"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              className={`${inputStyles} resize-none`}
              placeholder="e.g., Lose weight, build muscle, improve my boxing technique..."
              rows={3}
            />
          </div>
           <div>
            <label htmlFor="injuries" className={labelStyles}>
              Any injuries or concerns I should know about?
            </label>
            <textarea
              id="injuries"
              value={injuries}
              onChange={(e) => setInjuries(e.target.value)}
              className={`${inputStyles} resize-none`}
              placeholder="e.g., Bad knees, previous shoulder injury, etc."
              rows={3}
            />
          </div>
           <div>
            <label htmlFor="equipment" className={labelStyles}>
              What equipment do you have access to?
            </label>
            <textarea
              id="equipment"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              className={`${inputStyles} resize-none`}
              placeholder="e.g., Dumbbells, jump rope, heavy bag, treadmill..."
              rows={3}
            />
          </div>
          <div>
            <label htmlFor="dietaryPreferences" className={labelStyles}>
              Dietary preferences (optional)
            </label>
            <textarea
              id="dietaryPreferences"
              value={dietaryPreferences}
              onChange={(e) => setDietaryPreferences(e.target.value)}
              className={`${inputStyles} resize-none`}
              placeholder="e.g., Vegetarian, Mediterranean diet, low-carb, etc."
              rows={2}
            />
          </div>
          <div>
            <label htmlFor="foodAllergies" className={labelStyles}>
              Food allergies or restrictions (optional)
            </label>
            <textarea
              id="foodAllergies"
              value={foodAllergies}
              onChange={(e) => setFoodAllergies(e.target.value)}
              className={`${inputStyles} resize-none`}
              placeholder="e.g., Nuts, dairy, gluten, shellfish, etc."
              rows={2}
            />
          </div>
          <button
            type="submit"
            disabled={!activityLevel}
            className="w-full p-3 font-bold text-white bg-fuchsia-600 rounded-lg hover:bg-fuchsia-500 disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {`Let's Go, ${userName}!`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingScreen;