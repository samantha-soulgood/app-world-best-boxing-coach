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

  const inputStyles = "block w-full bg-white border-2 border-orange-200 rounded-lg p-3 text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 focus:outline-none transition-all duration-200";
  const labelStyles = "block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2";

  const activityLevels = [
    { key: 'beginner', label: 'Just starting out' },
    { key: 'intermediate', label: 'I exercise moderately (1-2 times/week)' },
    { key: 'advanced', label: "I'm active (3+ times/week)" }
  ];

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white border-2 border-gray-300 rounded-lg">
        <div className="text-center pb-4 border-b-2 border-orange-200">
          <h1 className="text-2xl font-display font-bold text-gray-900 tracking-wider flex items-center justify-center gap-2">
            <span className="text-2xl">✨</span>
            LET'S GET PERSONAL
          </h1>
          <p className="mt-2 text-gray-700">Tell me about yourself, {userName}!</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="pronouns" className={labelStyles}>
                    <span className="text-base">👤</span>
                    Pronouns
                </label>
                <input
                id="pronouns"
                type="text"
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                className={inputStyles}
                placeholder="she/her, he/him, they/them"
                />
            </div>
            <div>
                <label htmlFor="age" className={labelStyles}>
                    <span className="text-base">🎂</span>
                    Age
                </label>
                <input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className={inputStyles}
                placeholder="28"
                />
            </div>
          </div>
          <div>
            <label className={labelStyles}>
              <span className="text-base">🏃‍♀️</span>
              What's your current activity level? <span className="text-orange-600">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2 mt-2">
                {activityLevels.map(({ key, label }) => (
                    <button
                        type="button"
                        key={key}
                        onClick={() => setActivityLevel(label)}
                        className={`w-full text-left p-3 border-2 transition-all duration-200 rounded-lg font-semibold ${
                            activityLevel === label
                                ? 'bg-gradient-to-r from-orange-100 to-amber-100 border-orange-400 text-orange-900'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-orange-50 hover:border-orange-300'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>
          </div>
          <div>
            <label htmlFor="goals" className={labelStyles}>
              <span className="text-base">🎯</span>
              What are your main fitness goals?
            </label>
            <textarea
              id="goals"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              className={`${inputStyles} resize-none`}
              placeholder="Lose weight, build muscle, improve boxing..."
              rows={3}
            />
          </div>
           <div>
            <label htmlFor="injuries" className={labelStyles}>
              <span className="text-base">🩹</span>
              Any injuries or concerns?
            </label>
            <textarea
              id="injuries"
              value={injuries}
              onChange={(e) => setInjuries(e.target.value)}
              className={`${inputStyles} resize-none`}
              placeholder="Bad knees, shoulder injury, etc."
              rows={3}
            />
          </div>
           <div>
            <label htmlFor="equipment" className={labelStyles}>
              <span className="text-base">🏋️</span>
              What equipment do you have?
            </label>
            <textarea
              id="equipment"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              className={`${inputStyles} resize-none`}
              placeholder="Dumbbells, jump rope, heavy bag..."
              rows={3}
            />
          </div>
          <div>
            <label htmlFor="dietaryPreferences" className={labelStyles}>
              <span className="text-base">🥗</span>
              Dietary preferences (optional)
            </label>
            <textarea
              id="dietaryPreferences"
              value={dietaryPreferences}
              onChange={(e) => setDietaryPreferences(e.target.value)}
              className={`${inputStyles} resize-none`}
              placeholder="Vegetarian, Mediterranean, low-carb..."
              rows={2}
            />
          </div>
          <div>
            <label htmlFor="foodAllergies" className={labelStyles}>
              <span className="text-base">⚠️</span>
              Food allergies or restrictions (optional)
            </label>
            <textarea
              id="foodAllergies"
              value={foodAllergies}
              onChange={(e) => setFoodAllergies(e.target.value)}
              className={`${inputStyles} resize-none`}
              placeholder="Nuts, dairy, gluten, shellfish..."
              rows={2}
            />
          </div>
          <button
            type="submit"
            disabled={!activityLevel}
            className="w-full p-3 font-bold text-gray-900 bg-gradient-to-r from-orange-100 to-amber-100 hover:from-orange-200 hover:to-amber-200 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 border-2 border-orange-300 rounded-lg"
          >
            🚀 {`Let's Go, ${userName}!`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingScreen;