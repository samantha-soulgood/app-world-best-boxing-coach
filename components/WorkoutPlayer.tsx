import React, { useState, useMemo, useEffect } from 'react';
import type { WorkoutPlan, WorkoutPlan_Phase, WorkoutPlan_Exercise } from '../types';
import Timer from './Timer';
import { CloseIcon, NextIcon, PrevIcon, PlayIcon, PauseIcon } from './Icons';
import { parseDurationToSeconds } from '../utils';
import WorkoutFeedback from './WorkoutFeedback';

interface WorkoutPlayerProps {
  workout: WorkoutPlan;
  onClose: () => void;
  onComplete: () => void;
  onSubmitFeedback: (feedback: { rpe: number; text: string }) => void;
}

const WorkoutPlayer: React.FC<WorkoutPlayerProps> = ({ workout, onClose, onComplete, onSubmitFeedback }) => {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isWorkoutPaused, setIsWorkoutPaused] = useState(false);
  const [circuitRepetitions, setCircuitRepetitions] = useState(0);
  const [currentCircuitRound, setCurrentCircuitRound] = useState(1);


  const allExercises = useMemo(() => workout.workout.phases.flatMap(p => p.exercises), [workout]);
  const totalExercises = allExercises.length;
  
  const currentExerciseOverallIndex = useMemo(() => {
    let count = 0;
    for (let i = 0; i < currentPhaseIndex; i++) {
        count += workout.workout.phases[i].exercises.length;
    }
    return count + currentExerciseIndex;
  }, [currentPhaseIndex, currentExerciseIndex, workout]);


  const currentPhase: WorkoutPlan_Phase | undefined = workout.workout.phases[currentPhaseIndex];
  const currentExercise: WorkoutPlan_Exercise | undefined = currentPhase?.exercises[currentExerciseIndex];

  const exerciseDurationInSeconds = useMemo(() => {
    const duration = currentExercise?.duration ? parseDurationToSeconds(currentExercise.duration) : 0;
    console.log('Exercise changed:', currentExercise?.name, 'Duration:', currentExercise?.duration, 'Seconds:', duration);
    return duration;
  }, [currentExercise]);
  
  useEffect(() => {
    if (isComplete) {
        onComplete(); // Signal to parent that workout is completed
    }
  }, [isComplete, onComplete]);

  // Detect circuit repetitions when entering Main Workout phase
  useEffect(() => {
    const currentPhase = workout.workout.phases[currentPhaseIndex];
    if (currentPhase?.name === 'Main Workout') {
      // Look for "Repeat this set X times" in any exercise notes
      const repeatMatch = currentPhase.exercises
        .map(ex => ex.notes?.match(/Repeat this set (\d+) times?/i))
        .find(match => match);
      
      if (repeatMatch) {
        const repeatCount = parseInt(repeatMatch[1]);
        setCircuitRepetitions(repeatCount);
        setCurrentCircuitRound(1);
        console.log(`Set setup: ${repeatCount} repetitions detected`);
      }
    }
  }, [currentPhaseIndex, workout]);


  const handleNextExercise = () => {
    console.log('handleNextExercise called - advancing to next exercise');
    
    // Check if we're in the Main Workout phase and need to repeat the circuit
    const isMainWorkoutPhase = currentPhase?.name === 'Main Workout';
    
    if (currentExerciseIndex < (currentPhase?.exercises.length || 0) - 1) {
      console.log('Moving to next exercise in same phase');
      setCurrentExerciseIndex(prev => prev + 1);
    } else if (isMainWorkoutPhase && circuitRepetitions > 0) {
      // We're at the end of a set in Main Workout phase
      if (currentCircuitRound < circuitRepetitions) {
        console.log(`Repeating set: Round ${currentCircuitRound + 1} of ${circuitRepetitions}`);
        setCurrentCircuitRound(prev => prev + 1);
        setCurrentExerciseIndex(0); // Start over with first exercise in set
      } else {
        console.log('Set completed, moving to next phase');
        // Circuit is complete, move to next phase
        if (currentPhaseIndex < workout.workout.phases.length - 1) {
          setCurrentPhaseIndex(prev => prev + 1);
          setCurrentExerciseIndex(0);
        } else {
          setIsComplete(true);
        }
      }
    } else if (currentPhaseIndex < workout.workout.phases.length - 1) {
      console.log('Moving to next phase');
      // Move to next phase
      setCurrentPhaseIndex(prev => prev + 1);
      setCurrentExerciseIndex(0);
    } else {
      console.log('Workout completed');
      // Last exercise of last phase, trigger completion screen
      setIsComplete(true);
    }
  };

  const handlePrevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
    } else if (currentPhaseIndex > 0) {
        // Move to previous phase, last exercise
        const prevPhaseIndex = currentPhaseIndex - 1;
        const prevPhase = workout.workout.phases[prevPhaseIndex];
        setCurrentPhaseIndex(prevPhaseIndex);
        setCurrentExerciseIndex(prevPhase.exercises.length - 1);
    }
  };

  const toggleWorkoutPause = () => {
    setIsWorkoutPaused(prev => !prev);
  }
  
  if (isComplete) {
    return <WorkoutFeedback onSubmit={onSubmitFeedback} />;
  }

  if (!currentPhase || !currentExercise) {
    return (
        <div className="fixed inset-0 bg-zinc-900 bg-opacity-95 z-50 flex items-center justify-center text-white">
            <p>Workout completed or data is invalid.</p>
            <button onClick={onClose} className="ml-4 p-2 bg-fuchsia-600 rounded-lg">Close</button>
        </div>
    );
  }

  const isFirstExerciseOverall = currentPhaseIndex === 0 && currentExerciseIndex === 0;
  const isLastExerciseOverall = currentExerciseOverallIndex === totalExercises - 1;

  return (
    <div className="fixed inset-0 bg-zinc-900 z-50 flex flex-col p-4 md:p-8 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between mb-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-wider uppercase">{currentPhase.name}</h1>
            <p className="text-fuchsia-400 font-semibold">{`Exercise ${currentExerciseOverallIndex + 1} of ${totalExercises}`}</p>
            {circuitRepetitions > 0 && currentPhase.name === 'Main Workout' && (
              <p className="text-yellow-400 font-semibold text-sm">{`Set Round ${currentCircuitRound} of ${circuitRepetitions}`}</p>
            )}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <CloseIcon />
        </button>
      </header>

      {/* Main Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center text-center">
         {isWorkoutPaused && (
            <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl animate-fade-in">
                <h3 className="text-4xl font-display font-bold text-white tracking-wider">PAUSED</h3>
                <button onClick={toggleWorkoutPause} className="mt-4 flex items-center gap-2 px-6 py-3 bg-green-600 rounded-lg text-white font-bold hover:bg-green-500 transition-colors">
                    <PlayIcon className="w-6 h-6" />
                    <span>Resume</span>
                </button>
            </div>
          )}
        <div className="bg-zinc-800 p-4 sm:p-6 md:p-8 rounded-2xl w-full max-w-lg mb-4 sm:mb-8 border border-zinc-700">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-2">{currentExercise.name}</h2>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-4">{`${currentExercise.sets} sets x ${currentExercise.reps} reps`}</p>
            {currentExercise.notes && <p className="text-md text-gray-400">{currentExercise.notes}</p>}
        </div>
        
        {exerciseDurationInSeconds > 0 ? (
            <>
                <Timer 
                    initialSeconds={exerciseDurationInSeconds} 
                    onComplete={handleNextExercise}
                    autoStart={true}
                    isPaused={isWorkoutPaused}
                />
                <p className="text-gray-500 mt-2 text-sm">Timer for <span className="font-semibold">{currentExercise.name}</span>.</p>
            </>
        ) : (
            <div className="h-48 flex items-center justify-center">
                <p className="text-center text-gray-400 max-w-xs">No timer for this exercise. Complete the sets & reps, then hit 'Skip' when you're ready.</p>
            </div>
        )}
      </div>

      {/* Footer / Navigation */}
      <footer className="flex items-center justify-between">
        <button
            onClick={handlePrevExercise}
            disabled={isFirstExerciseOverall}
            className="flex items-center gap-2 p-3 bg-zinc-800 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition-colors"
        >
            <PrevIcon />
            <span className="hidden sm:inline">Previous</span>
        </button>

        <button
            onClick={toggleWorkoutPause}
            className="p-4 bg-fuchsia-600 rounded-full text-white font-bold hover:bg-fuchsia-500 transition-colors"
            aria-label={isWorkoutPaused ? 'Resume' : 'Stop'}
        >
            {isWorkoutPaused ? <PlayIcon /> : <PauseIcon />}
        </button>

        <button
            onClick={handleNextExercise}
            className="flex items-center gap-2 p-3 bg-zinc-800 rounded-lg text-white font-semibold hover:bg-zinc-700 transition-colors"
        >
            <span className="hidden sm:inline">{isLastExerciseOverall ? 'Finish' : 'Skip'}</span>
            <NextIcon />
        </button>
      </footer>
    </div>
  );
};

export default WorkoutPlayer;