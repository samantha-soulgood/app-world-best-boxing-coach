import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { WorkoutPlan, WorkoutSession, Workout, SimpleExercise, Exercise } from '../types';
import { LogoIcon, YouTubeIcon, PlayIcon, PauseIcon, StopIcon, SkipForwardIcon, RestIcon, PlayCircleIcon, ThumbsUpIcon, ThumbsDownIcon } from './Icons';

interface WorkoutDisplayProps {
  plan: WorkoutPlan | null;
  session: WorkoutSession | null;
  onStart: (workout: Workout) => void;
  onPauseToggle: () => void;
  onStop: () => void;
  onSkip: () => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const ActiveWorkoutView: React.FC<Omit<WorkoutDisplayProps, 'plan' | 'onStart'>> = ({ session, onPauseToggle, onStop, onSkip }) => {
  if (!session) return null;

  const { workout, phase, phaseIndex, circuitIndex, circuitRepetition, timer, totalDuration, isPaused } = session;
  const progress = totalDuration > 0 ? ((totalDuration - timer) / totalDuration) * 100 : 0;
  
  const [thumbRating, setThumbRating] = useState<'up' | 'down' | null>(null);
  const [rpeRating, setRpeRating] = useState<number | null>(null);
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [imgError, setImgError] = useState(false);


  let currentExercise: SimpleExercise | Exercise | null = null;
  let displayPhaseTitle = phase.replace('-Work', '').replace('-Rest', ' Rest');
  const isRestPhase = phase.endsWith('Rest') || phase === 'Circuit-Rest';

  if (phase === 'Warm-up-Work' || phase === 'Warm-up-Rest') {
    currentExercise = workout.warmup[phaseIndex];
  } else if (phase === 'Cool-down-Work' || phase === 'Cool-down-Rest') {
    currentExercise = workout.cooldown[phaseIndex];
  } else if (phase.startsWith('Main-')) {
    const currentCircuit = workout.main[circuitIndex];
    currentExercise = currentCircuit.exercises[phaseIndex];
    displayPhaseTitle = `Circuit ${circuitIndex + 1} | Rep ${circuitRepetition}/${currentCircuit.repeat}`;
  } else if (phase.startsWith('Core-')) {
    currentExercise = workout.core[phaseIndex];
  } else if (phase === 'Circuit-Rest') {
    displayPhaseTitle = `Circuit ${circuitIndex + 1} Rest`;
  }
  
  useEffect(() => {
    setImgError(false);
  }, [currentExercise]);


  let currentTitle = isRestPhase ? "Rest" : currentExercise?.exercise || "";
  if (phase === 'Circuit-Rest') {
    currentTitle = "Get Ready for Next Set!";
  }
  
  const youtubeVideoId = !isRestPhase ? currentExercise?.youtubeVideoId : null;
  const searchQuery = !isRestPhase ? currentExercise?.searchQuery : null;
  const thumbnailSrc = youtubeVideoId ? `https://i.ytimg.com/vi/${youtubeVideoId}/0.jpg` : null;


  if (phase === 'Finished') {
    if (surveySubmitted) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-lg border border-gray-200 text-center">
                <h2 className="text-3xl font-bold text-rose-500 mb-4">Feedback Submitted!</h2>
                <p className="text-gray-600 mb-6">Thank you for your feedback. You crushed it today!</p>
                <button
                onClick={onStop}
                className="px-6 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                >
                Finish
                </button>
            </div>
        );
    }

    const handleSurveySubmit = () => {
        setSurveySubmitted(true);
    };

    return (
       <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-lg border border-gray-200 text-center">
        <h2 className="text-3xl font-bold text-rose-500 mb-4">Workout Complete!</h2>
        <p className="text-gray-600 mb-6">Incredible work! Please rate your session.</p>
        
        <div className="w-full max-w-sm space-y-6">
            <div className="space-y-2">
                <p className="font-semibold text-gray-700">How was the workout?</p>
                <div className="flex justify-center gap-4">
                    <button 
                        onClick={() => setThumbRating('up')}
                        className={`p-4 rounded-full transition-colors border-2 ${thumbRating === 'up' ? 'bg-green-100 border-green-400 text-green-500' : 'bg-gray-100 border-gray-200 text-gray-400 hover:border-green-300'}`}
                        aria-label="Thumbs Up"
                    >
                        <ThumbsUpIcon className="w-8 h-8" />
                    </button>
                    <button 
                        onClick={() => setThumbRating('down')}
                        className={`p-4 rounded-full transition-colors border-2 ${thumbRating === 'down' ? 'bg-red-100 border-red-400 text-red-500' : 'bg-gray-100 border-gray-200 text-gray-400 hover:border-red-300'}`}
                        aria-label="Thumbs Down"
                    >
                        <ThumbsDownIcon className="w-8 h-8" />
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <p className="font-semibold text-gray-700">Rate Your Perceived Exertion (RPE)</p>
                <div className="flex flex-wrap justify-center gap-2">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                        <button
                            key={num}
                            onClick={() => setRpeRating(num)}
                            className={`w-10 h-10 rounded-md font-bold transition-colors border ${rpeRating === num ? 'bg-rose-500 text-white border-rose-500' : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-rose-100 hover:border-rose-300'}`}
                        >
                            {num}
                        </button>
                    ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 px-1 mt-1">
                    <span>Too Easy</span>
                    <span>Max Effort</span>
                </div>
            </div>

            <button
                onClick={handleSurveySubmit}
                disabled={!thumbRating || !rpeRating}
                className="w-full px-6 py-3 bg-rose-500 text-white font-semibold rounded-lg hover:bg-rose-600 transition-colors disabled:bg-rose-300 disabled:cursor-not-allowed"
            >
                Submit Feedback
            </button>
        </div>
      </div>
    );
  }

  const FallbackDisplay = () => (
    <div className="text-center text-gray-500">
        <LogoIcon className="w-16 h-16 mx-auto" />
        <p className="mt-2 text-sm">No visual for this exercise.</p>
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col items-center w-full max-w-4xl mx-auto">
      <p className="text-xl font-semibold text-rose-600 uppercase tracking-wider mb-4">{displayPhaseTitle}</p>
      
      <div className="w-full flex flex-col lg:flex-row gap-6 lg:gap-8 items-center justify-center">

        <div className="w-full lg:w-1/2 max-w-md text-center">
            <div className="w-full aspect-video rounded-lg overflow-hidden shadow-md bg-gray-100 flex items-center justify-center">
              {isRestPhase ? (
                 <div className="text-center text-gray-500">
                    <RestIcon className="w-16 h-16 mx-auto text-gray-400" />
                    <p className="mt-2 font-semibold">Time to Rest!</p>
                 </div>
              ) : (
                <a 
                    href={searchQuery ? `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}` : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-full flex items-center justify-center relative group bg-gray-800"
                    aria-label={`Watch video for ${currentExercise?.exercise} on YouTube`}
                >
                    {thumbnailSrc && !imgError ? (
                        <img 
                            src={thumbnailSrc} 
                            alt={`Demonstration of ${currentExercise?.exercise}`}
                            className="w-full h-full object-cover transition-opacity group-hover:opacity-70"
                            onError={() => setImgError(true)}
                        />
                    ) : <FallbackDisplay />}
                    
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-center text-white transform scale-90 group-hover:scale-100 transition-transform">
                            <PlayCircleIcon className="w-20 h-20 mx-auto" />
                        </div>
                    </div>
                    
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded flex items-center gap-1.5 pointer-events-none">
                        <YouTubeIcon className="w-4 h-4" />
                        <span>Watch on YouTube</span>
                    </div>
                </a>
              )}
            </div>
        </div>

        <div className="w-full lg:w-1/2 flex flex-col items-center">
          <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center mb-4">
            <svg className="absolute w-full h-full" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" strokeWidth="12" className="text-gray-200" stroke="currentColor"/>
              <circle
                cx="60" cy="60" r="54" fill="none" strokeWidth="12" pathLength="100"
                strokeDasharray={`${progress} 100`}
                transform="rotate(-90 60 60)"
                className="text-rose-500 transition-all duration-500" stroke="currentColor"
              />
            </svg>
            <span className="text-5xl md:text-6xl font-bold font-mono text-gray-800 tabular-nums">
              {formatTime(timer)}
            </span>
          </div>
          
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 my-2 text-balance">{currentTitle}</h3>
          </div>

          <div className="flex items-center space-x-4 mt-6">
            <button onClick={onPauseToggle} className="p-4 bg-gray-700 text-white rounded-full hover:bg-gray-800 transition-colors" aria-label={isPaused ? 'Play' : 'Pause'}>
              {isPaused ? <PlayIcon className="w-6 h-6" /> : <PauseIcon className="w-6 h-6" />}
            </button>
            <button onClick={onSkip} className="p-3 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors" aria-label="Skip">
              <SkipForwardIcon className="w-5 h-5" />
            </button>
            <button onClick={onStop} className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors" aria-label="Stop">
              <StopIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


const PlanOverviewView: React.FC<Omit<WorkoutDisplayProps, 'session' | 'onPauseToggle' | 'onStop' | 'onSkip'>> = ({ plan, onStart }) => {
  if (!plan || !plan.workouts || plan.workouts.length === 0) {
    return null;
  }

  const ExerciseLink: React.FC<{item: SimpleExercise | Exercise}> = ({ item }) => (
     <a 
      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(item.searchQuery)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-gray-600 hover:text-rose-600 transition-colors"
    >
      {item.exercise}
      <YouTubeIcon className="w-4 h-4 text-red-500" />
    </a>
  );

  return (
    <div className="max-w-3xl mx-auto my-8 p-4 md:p-6 bg-white rounded-xl shadow-lg border border-gray-200 animate-fade-in">
      <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Your Custom Boxing Plan</h2>
      <div className="space-y-8">
        {plan.workouts.map((workout) => {
          const warmupDurationMins = workout.warmup ? Math.round(workout.warmup.reduce((acc, item) => acc + item.duration + (item.rest || 0), 0) / 60) : 0;
          const mainDurationMins = workout.main ? Math.round(
            workout.main.reduce((circuitTotal, circuit) => {
              const singleRepDuration = circuit.exercises.reduce((repTotal, ex) => repTotal + ex.duration + ex.rest, 0);
              const totalCircuitDuration = (singleRepDuration * circuit.repeat) + (circuit.restBetweenSets * (circuit.repeat - 1));
              return circuitTotal + totalCircuitDuration;
            }, 0) / 60
          ) : 0;
          const coreDurationMins = workout.core ? Math.round(workout.core.reduce((acc, item) => acc + item.duration + item.rest, 0) / 60) : 0;
          const cooldownDurationMins = workout.cooldown ? Math.round(workout.cooldown.reduce((acc, item) => acc + item.duration + (item.rest || 0), 0) / 60) : 0;

          return (
            <div key={workout.day} className="p-4 md:p-6 border border-gray-200 rounded-lg transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-rose-100 p-2 rounded-full">
                  <LogoIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-rose-600">Day {workout.day}: {workout.title}</h3>
                  <p className="text-gray-500">{workout.description}</p>
                </div>
              </div>

              <div className="space-y-4 text-sm md:text-base">
                {workout.warmup && workout.warmup.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Warm-up ({warmupDurationMins} mins):</h4>
                    <div className="pl-4 space-y-2 text-gray-600">
                      {workout.warmup.map((item, index) => (
                        <div key={index}><ExerciseLink item={item} /></div>
                      ))}
                    </div>
                  </div>
                )}

                {workout.main && workout.main.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Main Workout ({mainDurationMins} mins):</h4>
                    <div className="pl-4 space-y-4 text-gray-600">
                      {workout.main.map((circuit, circuitIdx) => (
                        <div key={circuitIdx}>
                          <h5 className="font-semibold text-gray-700">Circuit {circuitIdx + 1} (Repeat {circuit.repeat} times)</h5>
                          <div className="pl-4 space-y-2 border-l-2 border-rose-200 ml-2 mt-2">
                            {circuit.exercises.map((item, exIndex) => (
                              <div key={exIndex}><ExerciseLink item={item} /></div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {workout.core && workout.core.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Core Workout ({coreDurationMins} mins):</h4>
                    <div className="pl-4 space-y-2 text-gray-600">
                      {workout.core.map((item, index) => (
                        <div key={index}><ExerciseLink item={item} /></div>
                      ))}
                    </div>
                  </div>
                )}
                
                {workout.cooldown && workout.cooldown.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Cool-down ({cooldownDurationMins} mins):</h4>
                    <div className="pl-4 space-y-2 text-gray-600">
                      {workout.cooldown.map((item, index) => (
                        <div key={index}><ExerciseLink item={item} /></div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => onStart(workout)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500 text-white font-semibold rounded-lg hover:bg-rose-600 transition-colors"
                >
                  Start Day {workout.day} Workout <PlayIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};


const WorkoutDisplay: React.FC<WorkoutDisplayProps> = (props) => {
  if (props.session) {
    return <ActiveWorkoutView {...props} />;
  }
  return <PlanOverviewView {...props} />;
};

export default WorkoutDisplay;