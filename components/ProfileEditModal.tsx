import React, { useState } from 'react';
import type { User, OnboardingData } from '../types';

interface ProfileEditModalProps {
  user: User;
  onClose: () => void;
  onSave: (data: OnboardingData) => void;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ user, onClose, onSave }) => {
  const [pronouns, setPronouns] = useState(user.profile?.pronouns || '');
  const [age, setAge] = useState(user.profile?.age || '');
  const [goals, setGoals] = useState(user.profile?.goals || '');
  const [injuries, setInjuries] = useState(user.profile?.injuries || '');
  const [equipment, setEquipment] = useState(user.profile?.equipment || '');
  const [activityLevel, setActivityLevel] = useState(user.profile?.activityLevel || '');
  const [dietaryPreferences, setDietaryPreferences] = useState(user.profile?.dietaryPreferences || '');
  const [foodAllergies, setFoodAllergies] = useState(user.profile?.foodAllergies || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      pronouns,
      age,
      goals,
      injuries,
      equipment,
      activityLevel,
      dietaryPreferences,
      foodAllergies
    });
    onClose();
  };

  const inputStyles = "w-full px-3 py-2 bg-white border-2 border-orange-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all";
  const labelStyles = "block text-sm font-bold text-gray-900 mb-2";

  const activityLevels = [
    { value: "Just starting out", emoji: "🌱", label: "Beginner" },
    { value: "I exercise moderately (1-2 times/week)", emoji: "💪", label: "Moderate" },
    { value: "I'm active (3+ times/week)", emoji: "🔥", label: "Active" }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-300">
        <div className="sticky top-0 bg-gradient-to-r from-orange-100 via-amber-50 to-rose-100 px-6 py-4 border-b border-orange-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">✏️ Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 text-3xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              placeholder="she/her, he/him, they/them..."
            />
          </div>

          <div>
            <label htmlFor="age" className={labelStyles}>
              Age
            </label>
            <input
              id="age"
              type="text"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className={inputStyles}
              placeholder="25"
            />
          </div>

          <div>
            <label htmlFor="goals" className={labelStyles}>
              🎯 Fitness Goals
            </label>
            <textarea
              id="goals"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              className={`${inputStyles} resize-none`}
              placeholder="Build strength, lose weight, improve cardio..."
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="injuries" className={labelStyles}>
              🩹 Injuries or Limitations
            </label>
            <textarea
              id="injuries"
              value={injuries}
              onChange={(e) => setInjuries(e.target.value)}
              className={`${inputStyles} resize-none`}
              placeholder="Bad knee, shoulder issue, lower back pain..."
              rows={2}
            />
          </div>

          <div>
            <label htmlFor="equipment" className={labelStyles}>
              🏋️ Available Equipment
            </label>
            <input
              id="equipment"
              type="text"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              className={inputStyles}
              placeholder="Dumbbells, resistance bands, jump rope..."
            />
          </div>

          <div>
            <label className={labelStyles}>
              💪 Activity Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {activityLevels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setActivityLevel(level.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    activityLevel === level.value
                      ? 'bg-gradient-to-br from-orange-100 to-amber-100 border-orange-400 text-orange-900'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-orange-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{level.emoji}</div>
                  <div className="text-xs font-semibold">{level.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="dietaryPreferences" className={labelStyles}>
              🥗 Dietary Preferences
            </label>
            <input
              id="dietaryPreferences"
              type="text"
              value={dietaryPreferences}
              onChange={(e) => setDietaryPreferences(e.target.value)}
              className={inputStyles}
              placeholder="Vegetarian, vegan, keto, paleo..."
            />
          </div>

          <div>
            <label htmlFor="foodAllergies" className={labelStyles}>
              ⚠️ Food Allergies
            </label>
            <textarea
              id="foodAllergies"
              value={foodAllergies}
              onChange={(e) => setFoodAllergies(e.target.value)}
              className={`${inputStyles} resize-none`}
              placeholder="Nuts, dairy, gluten, shellfish, quinoa..."
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-100 to-amber-100 text-gray-900 rounded-lg font-bold hover:from-orange-200 hover:to-amber-200 transition-all border border-orange-300"
            >
              💾 Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditModal;

