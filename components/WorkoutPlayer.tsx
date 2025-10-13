import React, { useState, useMemo, useEffect } from 'react';
import type { WorkoutPlan, WorkoutPlan_Phase, WorkoutPlan_Exercise, Video } from '../types';
import Timer from './Timer';
import { CloseIcon, NextIcon, PrevIcon, PlayIcon, PauseIcon } from './Icons';
import { parseDurationToSeconds } from '../utils';
import WorkoutFeedback from './WorkoutFeedback';
import ExerciseVideoButton from './ExerciseVideoButton';

interface WorkoutPlayerProps {
  workout: WorkoutPlan;
  onClose: () => void;
  onComplete: () => void;
  onSubmitFeedback: (feedback: { rpe: number; text: string }) => void;
  onFindVideo?: (exerciseName: string) => Promise<Video | null>;
}

const WorkoutPlayer: React.FC<WorkoutPlayerProps> = ({ workout, onClose, onComplete, onSubmitFeedback, onFindVideo }) => {
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
    const phaseName = currentPhase?.name || '';
    const isMainWorkout = phaseName.toLowerCase().includes('main') && 
                          phaseName.toLowerCase().includes('workout');
    
    console.log('=== PHASE DETECTION ===');
    console.log('Current phase name:', phaseName);
    console.log('Is main workout?', isMainWorkout);
    
    if (isMainWorkout) {
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
          const repeatCount = Math.min(parseInt(setRepeatMatch[1]), 3); // Cap at 3 repetitions
          setCircuitRepetitions(repeatCount);
          setCurrentCircuitRound(1);
          console.log(`✅ Set setup: ${repeatCount} repetitions detected from exercise at index ${i} (capped at 3)`);
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
    const phaseName = currentPhase?.name || '';
    const isMainWorkoutPhase = phaseName.toLowerCase().includes('main') && 
                                phaseName.toLowerCase().includes('workout');
    
    console.log('advanceToNextExercise called:', {
      isMainWorkoutPhase,
      currentExerciseIndex,
      totalExercises: currentPhase?.exercises.length,
      circuitRepetitions,
      currentCircuitRound,
      currentExerciseNotes: currentExercise?.notes
    });
    
    // Check if the current exercise marks the end of a set (has "Repeat this set X times")
    const isEndOfSet = currentExercise?.notes?.match(/Repeat this set (\d+) times?/i);
    
    if (isEndOfSet && isMainWorkoutPhase) {
      // We're at the end of a set that should be repeated
      console.log(`🎯 At end of set. Current round: ${currentCircuitRound}, Total repetitions: ${circuitRepetitions}`);
      
      if (currentCircuitRound < circuitRepetitions) {
        console.log(`🔄 Repeating set: Round ${currentCircuitRound + 1} of ${circuitRepetitions}`);
        setCurrentCircuitRound(prev => prev + 1);
        // Find the start of this set and reset to it
        const setStartIndex = findSetStartIndex();
        console.log(`Resetting to set start index: ${setStartIndex}`);
        setCurrentExerciseIndex(setStartIndex);
      } else {
        console.log('Set repetitions completed, moving to next exercise');
        // Set repetitions are complete, move to next exercise
        setCurrentCircuitRound(1); // Reset for next set
        setCircuitRepetitions(0); // Clear current set repetitions
        
        if (currentExerciseIndex < (currentPhase?.exercises.length || 0) - 1) {
          setCurrentExerciseIndex(prev => prev + 1);
        } else {
          // End of phase
          if (currentPhaseIndex < workout.workout.phases.length - 1) {
            setCurrentPhaseIndex(prev => prev + 1);
            setCurrentExerciseIndex(0);
          } else {
            setIsComplete(true);
          }
        }
      }
    } else if (currentExerciseIndex < (currentPhase?.exercises.length || 0) - 1) {
      console.log('Moving to next exercise in same phase');
      setCurrentExerciseIndex(prev => prev + 1);
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
      isMainWorkoutPhase: (currentPhase?.name || '').toLowerCase().includes('main') && 
                          (currentPhase?.name || '').toLowerCase().includes('workout'),
      currentExerciseNotes: currentExercise?.notes
    });
    
    const phaseName = currentPhase?.name || '';
    const isMainWorkoutPhase = phaseName.toLowerCase().includes('main') && 
                                phaseName.toLowerCase().includes('workout');
    const isEndOfSet = currentExercise?.notes?.match(/Repeat this set (\d+) times?/i);
    
    // Determine rest duration based on context
    if (isEndOfSet && isMainWorkoutPhase && currentCircuitRound < circuitRepetitions) {
      // At end of set and need to repeat - 1 minute break between set rounds
      startRestPeriod(60, 'Break between set rounds');
    } else if (currentExerciseIndex < (currentPhase?.exercises.length || 0) - 1) {
      // Moving to next exercise in same phase - 15 second break
      startRestPeriod(15, 'Break between exercises');
    } else {
      // Moving to next phase or completing workout - 30 second break
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
    const phaseName = currentPhase?.name || '';
    const isMainWorkout = phaseName.toLowerCase().includes('main') && 
                          phaseName.toLowerCase().includes('workout');
    if (!currentPhase || !isMainWorkout) return 0;
    
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
        <div className="fixed inset-0 bg-gray-50 bg-opacity-95 z-50 flex items-center justify-center text-gray-900">
            <p>Workout completed or data is invalid.</p>
            <button onClick={onClose} className="ml-4 p-2 bg-stone-600 text-white rounded-lg hover:bg-stone-700 transition-colors shadow-sm">Close</button>
        </div>
    );
  }

  const isFirstExerciseOverall = currentPhaseIndex === 0 && currentExerciseIndex === 0;
  const isLastExerciseOverall = currentExerciseOverallIndex === totalExercises - 1;

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-8 flex-shrink-0 border-b border-gray-200 bg-white">
        <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-3xl font-display font-bold text-gray-900 tracking-wider uppercase truncate">{currentPhase.name}</h1>
            <p className="text-stone-700 font-semibold text-sm md:text-base">{`Exercise ${currentExerciseOverallIndex + 1} of ${totalExercises}`}</p>
            {circuitRepetitions > 0 && currentPhase.name === 'Main Workout' && (
              <div className="text-amber-600 font-semibold text-xs md:text-sm">
                <p>{`Set ${getCurrentSetNumber()} - Round ${currentCircuitRound} of ${circuitRepetitions}`}</p>
                <p className="text-xs text-amber-500">{`Set ${getCurrentSetNumber()} of ${getTotalSets()} (each repeats ${circuitRepetitions} times)`}</p>
              </div>
            )}
        </div>
        <button onClick={onClose} className="text-gray-600 hover:text-rose-900 transition-colors flex-shrink-0 ml-2">
          <CloseIcon />
        </button>
      </header>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8">
        <div className="relative flex flex-col items-center text-center py-8">
         {isWorkoutPaused && (
            <div className="absolute inset-0 bg-rose-900/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl animate-fade-in">
                <h3 className="text-4xl font-display font-bold text-white tracking-wider">PAUSED</h3>
                <button onClick={toggleWorkoutPause} className="mt-4 flex items-center gap-2 px-6 py-3 bg-stone-600 rounded-lg text-white font-bold hover:bg-stone-700 transition-colors shadow-sm">
                    <PlayIcon className="w-6 h-6" />
                    <span>Resume</span>
                </button>
            </div>
          )}
          
          {isRestPeriod && (
            <div className="absolute inset-0 bg-emerald-100/95 backdrop-blur-md z-20 flex flex-col items-center justify-center rounded-2xl animate-fade-in border border-emerald-300">
                <h3 className="text-4xl font-display font-bold text-emerald-800 tracking-wider">REST TIME</h3>
                <p className="text-emerald-700 text-lg mt-2">Take a break and prepare for the next exercise</p>
                <Timer 
                    key={`rest-${restDuration}`}
                    initialSeconds={restDuration} 
                    onComplete={handleRestComplete}
                    autoStart={true}
                    isPaused={isWorkoutPaused}
                />
            </div>
          )}
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl w-full max-w-lg mb-4 sm:mb-8 border border-gray-200 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-gray-900 break-words leading-tight flex-1">{currentExercise.name}</h2>
              {onFindVideo && (
                <div className="ml-3 flex-shrink-0">
                  <ExerciseVideoButton
                    exerciseName={currentExercise.name}
                    onFindVideo={onFindVideo}
                  />
                </div>
              )}
            </div>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-4">{`${currentExercise.sets} sets x ${currentExercise.reps} reps`}</p>
            {currentExercise.notes && <p className="text-sm text-gray-600 break-words">{currentExercise.notes}</p>}
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
                <p className="text-gray-600 mt-2 text-sm">Timer for <span className="font-semibold">{currentExercise.name}</span>.</p>
            </>
        ) : (
            <div className="h-48 flex items-center justify-center">
                <p className="text-center text-gray-600 max-w-xs">No timer for this exercise. Complete the sets & reps, then hit 'Skip' when you're ready.</p>
            </div>
        )}
        </div>
      </div>

      {/* Footer / Navigation - Fixed at bottom */}
      <footer className="flex items-center justify-between p-4 md:p-8 bg-white border-t border-gray-200 flex-shrink-0">
        <button
            onClick={handlePrevExercise}
            disabled={isFirstExerciseOverall}
            className="flex items-center justify-center p-2 sm:p-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors relative group shadow-sm"
            title="Previous Exercise"
        >
            <PrevIcon />
            <span className="hidden sm:inline ml-2">Previous</span>
            {/* Mobile tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none sm:hidden">
                Previous
            </div>
        </button>

        <button
            onClick={handleSkipExercise}
            className="flex items-center justify-center p-2 sm:p-3 bg-stone-600 rounded-lg text-white font-semibold hover:bg-stone-700 transition-colors relative group shadow-sm"
            title={isLastExerciseOverall ? 'Finish Workout' : (isRestPeriod ? 'Skip Rest' : 'Skip Exercise')}
        >
            <span className="hidden sm:inline mr-2">{isLastExerciseOverall ? 'Finish' : (isRestPeriod ? 'Skip Rest' : 'Skip')}</span>
            <NextIcon />
            {/* Mobile tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none sm:hidden">
                {isLastExerciseOverall ? 'Finish' : (isRestPeriod ? 'Skip Rest' : 'Skip')}
            </div>
        </button>
      </footer>
    </div>
  );
};

export default WorkoutPlayer;