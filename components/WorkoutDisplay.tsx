import React from 'react';
import type { WorkoutPlan } from '../types';

interface WorkoutDisplayProps {
  plan: WorkoutPlan;
}

const WorkoutDisplay: React.FC<WorkoutDisplayProps> = ({ plan }) => {
  if (!plan.workout || !plan.workout.phases) {
    return null;
  }

  return (
    <div className="mt-3 border-t border-zinc-700/50 pt-3 text-sm">
      {plan.workout.phases.map((phase, phaseIndex) => (
        <div key={phaseIndex} className="mb-4 last:mb-0">
          <h4 className="font-bold text-fuchsia-400 tracking-wide uppercase text-xs mb-2">{phase.name}</h4>
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
                <li key={exerciseIndex}>
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
                  {exercise.notes && <p className="text-xs text-gray-400/90 mt-1 pl-2 border-l-2 border-zinc-600 italic">{exercise.notes}</p>}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default WorkoutDisplay;
