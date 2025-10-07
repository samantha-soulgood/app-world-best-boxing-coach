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
  const [isRestPeriod, setIsRestPeriod] = useState(false);
  const [restDuration, setRestDuration] = useState(0);


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

  // Detect set repetitions when entering Main Workout phase
  useEffect(() => {
    const currentPhase = workout.workout.phases[currentPhaseIndex];
    if (currentPhase?.name === 'Main Workout') {
      console.log('=== MAIN WORKOUT DETECTION ===');
      console.log('Current exercise:', currentExercise?.name);
      console.log('Current exercise notes:', currentExercise?.notes);
      
      // Always look for repetition instructions in the current set
      const currentSetStart = findSetStartIndex();
      const currentSetEnd = findSetEndIndex();
      
      console.log(`Looking for repetition instructions in set range ${currentSetStart}-${currentSetEnd}`);
      
      let foundRepetitions = false;
      for (let i = currentSetStart; i <= currentSetEnd; i++) {
        const exercise = currentPhase.exercises[i];
        console.log(`Exercise ${i}: "${exercise.name}" - Notes: "${exercise.notes}"`);
        const setRepeatMatch = exercise?.notes?.match(/Repeat this set (\d+) times?/i);
        if (setRepeatMatch) {
          const repeatCount = parseInt(setRepeatMatch[1]);
          setCircuitRepetitions(repeatCount);
          setCurrentCircuitRound(1);
          console.log(`✅ Set setup: ${repeatCount} repetitions detected from exercise at index ${i}`);
          foundRepetitions = true;
          break;
        }
      }
      
      if (!foundRepetitions) {
        console.log('❌ No repetition instructions found in current set');
        setCircuitRepetitions(0);
        setCurrentCircuitRound(1);
      }
    } else {
      // Reset when not in Main Workout phase
      console.log('Not in Main Workout phase, resetting repetitions');
      setCircuitRepetitions(0);
      setCurrentCircuitRound(1);
    }
  }, [currentPhaseIndex, currentExerciseIndex, workout]);


  const startRestPeriod = (duration: number, message: string) => {
    console.log(`Starting rest period: ${duration} seconds - ${message}`);
    console.log('Current phase:', currentPhase?.name, 'Exercise index:', currentExerciseIndex, 'Total exercises:', currentPhase?.exercises.length);
    setIsRestPeriod(true);
    setRestDuration(duration);
  };

  const handleRestComplete = () => {
    console.log('Rest period completed, moving to next exercise');
    setIsRestPeriod(false);
    setRestDuration(0);
    // Continue with the original exercise advancement logic
    advanceToNextExercise();
  };

  const advanceToNextExercise = () => {
    // Check if we're in the Main Workout phase and need to repeat the circuit
    const isMainWorkoutPhase = currentPhase?.name === 'Main Workout';
    
    console.log('advanceToNextExercise called:', {
      isMainWorkoutPhase,
      currentExerciseIndex,
      totalExercises: currentPhase?.exercises.length,
      circuitRepetitions,
      currentCircuitRound
    });
    
    if (currentExerciseIndex < (currentPhase?.exercises.length || 0) - 1) {
      console.log('Moving to next exercise in same phase');
      setCurrentExerciseIndex(prev => prev + 1);
    } else if (isMainWorkoutPhase && circuitRepetitions > 0) {
      // We're at the end of a set in Main Workout phase
      console.log(`🎯 At end of set. Current round: ${currentCircuitRound}, Total repetitions: ${circuitRepetitions}`);
      if (currentCircuitRound < circuitRepetitions) {
        console.log(`🔄 Repeating set: Round ${currentCircuitRound + 1} of ${circuitRepetitions}`);
        setCurrentCircuitRound(prev => prev + 1);
        // Find the start of this set and reset to it
        const setStartIndex = findSetStartIndex();
        console.log(`Resetting to set start index: ${setStartIndex}`);
        setCurrentExerciseIndex(setStartIndex);
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

  const handleNextExercise = () => {
    console.log('handleNextExercise called - advancing to next exercise');
    console.log('Current state:', {
      currentPhaseIndex,
      currentExerciseIndex,
      phaseName: currentPhase?.name,
      totalExercises: currentPhase?.exercises.length,
      circuitRepetitions,
      currentCircuitRound,
      isMainWorkoutPhase: currentPhase?.name === 'Main Workout'
    });
    
    const isMainWorkoutPhase = currentPhase?.name === 'Main Workout';
    
    // Determine rest duration based on context
    if (currentExerciseIndex < (currentPhase?.exercises.length || 0) - 1) {
      // Moving to next exercise in same phase - 15 second break for all phases
      startRestPeriod(15, 'Break between exercises');
    } else if (isMainWorkoutPhase && circuitRepetitions > 0 && currentCircuitRound < circuitRepetitions) {
      // Moving to next set round - 1 minute break
      startRestPeriod(60, 'Break between sets');
    } else {
      // Moving to next phase or completing workout - add a break between phases
      startRestPeriod(30, 'Break between phases');
    }
  };

  // Helper function to find the start index of the current set
  const findSetStartIndex = () => {
    if (!currentPhase) return 0;
    
    // Look backwards from current exercise to find the start of this set
    for (let i = currentExerciseIndex - 1; i >= 0; i--) {
      const exercise = currentPhase.exercises[i];
      if (exercise.notes?.match(/Repeat this set (\d+) times?/i)) {
        // Found the end of the previous set, so this set starts at i + 1
        return i + 1;
      }
    }
    // If no previous set found, this is the first set
    return 0;
  };

  // Helper function to find the end index of the current set
  const findSetEndIndex = () => {
    if (!currentPhase) return (currentPhase.exercises.length || 0) - 1;
    
    // Look forwards from current exercise to find the end of this set
    for (let i = currentExerciseIndex; i < (currentPhase.exercises.length || 0); i++) {
      const exercise = currentPhase.exercises[i];
      if (exercise.notes?.match(/Repeat this set (\d+) times?/i)) {
        // Found the end of this set
        return i;
      }
    }
    // If no set end found, this is the last set
    return (currentPhase.exercises.length || 0) - 1;
  };

  // Helper function to get the current set number (1, 2, 3, etc.)
  const getCurrentSetNumber = () => {
    if (!currentPhase || currentPhase.name !== 'Main Workout') return 0;
    
    let setNumber = 1;
    for (let i = 0; i < currentExerciseIndex; i++) {
      const exercise = currentPhase.exercises[i];
      if (exercise.notes?.match(/Repeat this set (\d+) times?/i)) {
        setNumber++;
      }
    }
    return setNumber;
  };

  // Helper function to get total number of sets
  const getTotalSets = () => {
    if (!currentPhase || currentPhase.name !== 'Main Workout') return 0;
    
    let totalSets = 1;
    for (let i = 0; i < (currentPhase.exercises.length || 0); i++) {
      const exercise = currentPhase.exercises[i];
      if (exercise.notes?.match(/Repeat this set (\d+) times?/i)) {
        totalSets++;
      }
    }
    return totalSets;
  };

  const handlePrevExercise = () => {
    // If we're in a rest period, cancel it and stay on current exercise
    if (isRestPeriod) {
      console.log('Cancelling rest period');
      setIsRestPeriod(false);
      setRestDuration(0);
      return;
    }
    
    // Normal previous exercise logic
    if (currentExerciseIndex > 0) {
      console.log('Moving to previous exercise in same phase');
      setCurrentExerciseIndex(prev => prev - 1);
    } else if (currentPhaseIndex > 0) {
      console.log('Moving to previous phase');
      // Move to previous phase, last exercise
      const prevPhaseIndex = currentPhaseIndex - 1;
      const prevPhase = workout.workout.phases[prevPhaseIndex];
      setCurrentPhaseIndex(prevPhaseIndex);
      setCurrentExerciseIndex(prevPhase.exercises.length - 1);
    }
  };

  const handleSkipExercise = () => {
    // If we're in a rest period, skip the rest and advance immediately
    if (isRestPeriod) {
      console.log('Skipping rest period');
      setIsRestPeriod(false);
      setRestDuration(0);
      advanceToNextExercise();
      return;
    }
    
    // Normal skip logic - go to next exercise with rest period
    handleNextExercise();
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
              <div className="text-yellow-400 font-semibold text-sm">
                <p>{`Set ${getCurrentSetNumber()} - Round ${currentCircuitRound} of ${circuitRepetitions}`}</p>
                <p className="text-xs text-yellow-300">{`Set ${getCurrentSetNumber()} of ${getTotalSets()} (each repeats ${circuitRepetitions} times)`}</p>
              </div>
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
          
          {isRestPeriod && (
            <div className="absolute inset-0 bg-green-900/80 backdrop-blur-md z-20 flex flex-col items-center justify-center rounded-2xl animate-fade-in">
                <h3 className="text-4xl font-display font-bold text-green-400 tracking-wider">REST TIME</h3>
                <p className="text-green-300 text-lg mt-2">Take a break and prepare for the next exercise</p>
                <Timer 
                    key={`rest-${restDuration}`}
                    initialSeconds={restDuration} 
                    onComplete={handleRestComplete}
                    autoStart={true}
                    isPaused={isWorkoutPaused}
                />
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
                    key={`${currentPhaseIndex}-${currentExerciseIndex}`}
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
            onClick={handleSkipExercise}
            className="flex items-center gap-2 p-3 bg-zinc-800 rounded-lg text-white font-semibold hover:bg-zinc-700 transition-colors"
        >
            <span className="hidden sm:inline">{isLastExerciseOverall ? 'Finish' : (isRestPeriod ? 'Skip Rest' : 'Skip')}</span>
            <NextIcon />
        </button>
      </footer>
    </div>
  );
};

export default WorkoutPlayer;