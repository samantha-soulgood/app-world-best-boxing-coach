import React from 'react';
import type { WorkoutPlan, Video } from '../types';
import ExerciseVideoButton from './ExerciseVideoButton';

interface WorkoutDisplayProps {
  plan: WorkoutPlan;
  onFindVideo?: (exerciseName: string) => Promise<Video | null>;
}

const WorkoutDisplay: React.FC<WorkoutDisplayProps> = ({ plan, onFindVideo }) => {
  console.log("WorkoutDisplay: onFindVideo prop:", !!onFindVideo);
  
  if (!plan.workout || !plan.workout.phases) {
    return null;
  }

  // Helper function to get set repetition info for Main Workout phases
  const getSetRepetitionInfo = (phase: any) => {
    if (phase.name !== 'Main Workout') return null;
    
    const repetitionExercises = phase.exercises.filter((ex: any) => 
      ex.notes?.includes('Repeat this set')
    );
    
    if (repetitionExercises.length === 0) return null;
    
    const repetitionCount = repetitionExercises.length;
    const repeatTimes = repetitionExercises[0]?.notes?.match(/Repeat this set (\d+) times?/i)?.[1] || 'unknown';
    
    return { repetitionCount, repeatTimes };
  };

  // Get emoji for phase
  const getPhaseEmoji = (phaseName: string): string => {
    const lowerName = phaseName.toLowerCase();
    if (lowerName.includes('warm')) return '🔥';
    if (lowerName.includes('main') || lowerName.includes('workout')) return '💪';
    if (lowerName.includes('core') || lowerName.includes('finisher')) return '⚡';
    if (lowerName.includes('cool') || lowerName.includes('stretch')) return '🧘‍♀️';
    return '✨';
  };

  return (
    <div className="mt-4 p-5 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border-2 border-orange-200 rounded-lg">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-bold text-gray-900 tracking-tight">🎯 Your Workout Plan</h3>
      </div>
      {plan.workout.phases.map((phase, phaseIndex) => {
        const setInfo = getSetRepetitionInfo(phase);
        const phaseEmoji = getPhaseEmoji(phase.name);
        
        return (
          <div key={phaseIndex} className="mb-6 last:mb-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{phaseEmoji}</span>
              <h4 className="font-bold text-gray-900 tracking-wide uppercase text-sm flex-1">{phase.name}</h4>
              <span className="text-xs text-gray-600 font-medium bg-white px-2 py-1 border border-gray-200 rounded-full">
                {phase.exercises.filter(ex => ex.name.toLowerCase() !== 'rest').length} exercises
              </span>
            </div>
            {setInfo && (
              <div className="mb-3 p-3 bg-gradient-to-r from-amber-100 to-orange-100 border-2 border-amber-300 text-xs rounded-lg">
                <p className="text-amber-900 font-bold">
                  🔁 Set Structure: {setInfo.repetitionCount} sets, each repeated {setInfo.repeatTimes} times
                </p>
                <p className="text-amber-800 mt-1">
                  💥 Total: {setInfo.repetitionCount} sets × {setInfo.repeatTimes} rounds = {setInfo.repetitionCount * parseInt(setInfo.repeatTimes)} total set rounds
                </p>
              </div>
            )}
          <ul className="space-y-3">
            {phase.exercises.map((exercise, exerciseIndex) => {
              // If the current exercise is "Rest", it will be handled by the preceding exercise, so we skip rendering it.
              // We only render a "Rest" if it's the very first item in a phase, which is unlikely but a good edge case to handle.
              if (exercise.name.toLowerCase() === 'rest') {
                if (exerciseIndex === 0) {
                    // Render standalone rest if it's the first exercise
                     return (
                         <li key={exerciseIndex}>
                            <strong className="text-gray-900 font-semibold text-base">{exercise.name}</strong>
                            {exercise.duration && <span className="text-gray-600 italic ml-2">({exercise.duration})</span>}
                         </li>
                     );
                }
                return null;
              }

              // Check if the next exercise is 'Rest' to append its info.
              const nextExercise = phase.exercises[exerciseIndex + 1];
              const isNextExerciseRest = nextExercise && nextExercise.name.toLowerCase() === 'rest';

              return (
                <li key={exerciseIndex} className="group p-4 bg-white border-2 border-orange-200 hover:border-orange-300 transition-all duration-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">💪</span>
                        <strong className="text-gray-900 font-bold text-base">{exercise.name}</strong>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        {/* The prompt ensures timed exercises have N/A reps, this makes the display cleaner */}
                        {exercise.reps !== 'N/A' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 font-semibold text-blue-800 rounded-full">
                            <span className="text-xs">🔢</span>
                            {exercise.sets} sets × {exercise.reps} reps
                          </span>
                        )}
                        {exercise.duration && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 font-semibold text-green-800 rounded-full">
                            <span className="text-xs">⏱️</span>
                            {exercise.duration}
                            {isNextExerciseRest ? ` + ${nextExercise.duration} rest` : ''}
                          </span>
                        )}
                      </div>
                      {exercise.notes && (
                        <p className={`text-xs mt-3 p-2.5 rounded-lg ${
                          exercise.notes.includes('Repeat this set') 
                            ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 font-bold border-2 border-amber-300' 
                            : 'bg-gray-50 text-gray-700 italic border border-gray-200'
                        }`}>
                          {exercise.notes.includes('Repeat this set') ? '🔁 ' : '💡 '}
                          {exercise.notes}
                        </p>
                      )}
                    </div>
                    {onFindVideo && (
                      <div className="ml-3 flex-shrink-0">
                        <ExerciseVideoButton
                          exerciseName={exercise.name}
                          onFindVideo={onFindVideo}
                        />
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          </div>
        );
      })}
    </div>
  );
};

export default WorkoutDisplay;
