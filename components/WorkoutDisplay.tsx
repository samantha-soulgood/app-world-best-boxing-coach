import React from 'react';
import type { WorkoutPlan, Video } from '../types';
import ExerciseVideoButton from './ExerciseVideoButton';

interface WorkoutDisplayProps {
  plan: WorkoutPlan;
  onFindVideo?: (exerciseName: string) => Promise<Video | null>;
}

const WorkoutDisplay: React.FC<WorkoutDisplayProps> = ({ plan, onFindVideo }) => {
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

  return (
    <div className="mt-3 border-t border-zinc-700/50 pt-3 text-sm">
      {plan.workout.phases.map((phase, phaseIndex) => {
        const setInfo = getSetRepetitionInfo(phase);
        
        return (
          <div key={phaseIndex} className="mb-4 last:mb-0">
            <h4 className="font-bold text-fuchsia-400 tracking-wide uppercase text-xs mb-2">{phase.name}</h4>
            {setInfo && (
              <div className="mb-3 p-2 bg-yellow-400/10 border border-yellow-400/30 rounded text-xs">
                <p className="text-yellow-400 font-semibold">
                  📋 Set Structure: {setInfo.repetitionCount} sets, each repeated {setInfo.repeatTimes} times
                </p>
                <p className="text-yellow-300/80 mt-1">
                  Total: {setInfo.repetitionCount} sets × {setInfo.repeatTimes} rounds = {setInfo.repetitionCount * parseInt(setInfo.repeatTimes)} total set rounds
                </p>
              </div>
            )}
          <ul className="space-y-2 pl-2">
            {phase.exercises.map((exercise, exerciseIndex) => {
              // If the current exercise is "Rest", it will be handled by the preceding exercise, so we skip rendering it.
              // We only render a "Rest" if it's the very first item in a phase, which is unlikely but a good edge case to handle.
              if (exercise.name.toLowerCase() === 'rest') {
                if (exerciseIndex === 0) {
                    // Render standalone rest if it's the first exercise
                     return (
                         <li key={exerciseIndex}>
                            <strong className="text-white font-medium">{exercise.name}</strong>
                            {exercise.duration && <span className="text-gray-400 italic ml-2">({exercise.duration})</span>}
                         </li>
                     );
                }
                return null;
              }

              // Check if the next exercise is 'Rest' to append its info.
              const nextExercise = phase.exercises[exerciseIndex + 1];
              const isNextExerciseRest = nextExercise && nextExercise.name.toLowerCase() === 'rest';

              return (
                <li key={exerciseIndex} className="mb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <strong className="text-white font-medium">{exercise.name}</strong>
                      <div className="text-gray-300 pl-2">
                        {/* The prompt ensures timed exercises have N/A reps, this makes the display cleaner */}
                        {exercise.reps !== 'N/A' 
                            ? <span>{exercise.sets} sets x {exercise.reps} reps</span>
                            : null
                        }
                        {exercise.duration && 
                            <span className="text-gray-400 italic ml-2">
                                ({exercise.duration}
                                {isNextExerciseRest ? ` + ${nextExercise.duration} rest` : ''})
                            </span>
                        }
                      </div>
                      {exercise.notes && (
                        <p className={`text-xs mt-1 pl-2 border-l-2 border-zinc-600 italic ${
                          exercise.notes.includes('Repeat this set') 
                            ? 'text-yellow-400 font-semibold' 
                            : 'text-gray-400/90'
                        }`}>
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
