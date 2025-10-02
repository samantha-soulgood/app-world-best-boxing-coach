import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Message, Role, WorkoutPlan, WorkoutSession, Workout, WorkoutPhase, SimpleExercise, Circuit } from './types';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import WorkoutDisplay from './components/WorkoutDisplay';
import { EXERCISE_LIBRARY } from './components/exercise-library';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const exerciseListForPrompt = EXERCISE_LIBRARY.map(ex => `- ${ex.name}`).join('\n');
const libraryMap = new Map(EXERCISE_LIBRARY.map(ex => [ex.name, ex]));


const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: Role.Model,
      text: `Hey champ! Welcome to the Soul Good Boxing 12-week training camp! I'm Sammi, your personal AI coach, and I'm so excited to be on this journey with you.

Before we dive in, let's make sure you're all set up for success. Here’s what you'll need:

*   **Boxing Gloves:** To protect those powerful hands.
*   **Hand Wraps:** For essential wrist support and knuckle protection.
*   **Mouth Guard:** Optional, but highly recommended if you participate in sparring drills.
*   **Commitment to work out at least 3 times a week:** Consistency is your superpower!
*   **Commitment to attend training camp class every week:** Let's grow stronger together.
*   **Stay connected:** Join our [WhatsApp group](https://chat.whatsapp.com/I5KIVrNWPqkAj6hssaVtSe) to connect with your fellow fighters!

Ready to get started? You can ask me for a workout plan, nutritional tips, or anything else about our training camp. How can I help you today?`
    }
  ]);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [workoutSession, setWorkoutSession] = useState<WorkoutSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const timerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);


  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, workoutPlan]);
  
  const playSound = (type: 'tick' | 'end') => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const context = audioContextRef.current;
    if (!context) return;
    
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    gainNode.gain.setValueAtTime(0, context.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.01);

    if (type === 'end') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, context.currentTime); // A5
    } else {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, context.currentTime); // A4
    }

    oscillator.start(context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.2);
    oscillator.stop(context.currentTime + 0.2);
  };

  const getNextPhaseState = (currentSession: WorkoutSession): WorkoutSession => {
    if (isSoundEnabled) playSound('end');

    const { workout, phase, phaseIndex, circuitIndex, circuitRepetition } = currentSession;

    const startNextMajorPhase = (afterPhase: 'warmup' | 'main' | 'core') => {
        if (afterPhase === 'warmup' && workout.main.length > 0 && workout.main[0].exercises.length > 0) {
            return { phase: 'Main-Work', cIndex: 0, cRep: 1, pIndex: 0, duration: workout.main[0].exercises[0].duration };
        }
        if ((afterPhase === 'warmup' || afterPhase === 'main') && workout.core.length > 0) {
            return { phase: 'Core-Work', cIndex: circuitIndex, cRep: circuitRepetition, pIndex: 0, duration: workout.core[0].duration };
        }
        if ((afterPhase === 'warmup' || afterPhase === 'main' || afterPhase === 'core') && workout.cooldown.length > 0) {
            return { phase: 'Cool-down-Work', cIndex: circuitIndex, cRep: circuitRepetition, pIndex: 0, duration: workout.cooldown[0].duration };
        }
        return { phase: 'Finished', cIndex: 0, cRep: 0, pIndex: 0, duration: 0 };
    };

    let nextPhase: WorkoutPhase = phase;
    let nextPhaseIndex = phaseIndex;
    let nextCircuitIndex = circuitIndex;
    let nextCircuitRepetition = circuitRepetition;
    let nextDuration = 0;

    switch (phase) {
        case 'Warm-up-Work': {
            const currentExercise = workout.warmup[phaseIndex];
            if (currentExercise.rest && currentExercise.rest > 0) {
                nextPhase = 'Warm-up-Rest';
                nextDuration = currentExercise.rest;
            } else {
                const isLastWarmup = phaseIndex >= workout.warmup.length - 1;
                if (isLastWarmup) {
                    const { phase, cIndex, cRep, pIndex, duration } = startNextMajorPhase('warmup');
                    nextPhase = phase as WorkoutPhase;
                    nextCircuitIndex = cIndex;
                    nextCircuitRepetition = cRep;
                    nextPhaseIndex = pIndex;
                    nextDuration = duration;
                } else {
                    nextPhaseIndex++;
                    nextDuration = workout.warmup[nextPhaseIndex].duration;
                }
            }
            break;
        }
        case 'Warm-up-Rest': {
            const isLastWarmup = phaseIndex >= workout.warmup.length - 1;
            if (isLastWarmup) {
                const { phase, cIndex, cRep, pIndex, duration } = startNextMajorPhase('warmup');
                nextPhase = phase as WorkoutPhase;
                nextCircuitIndex = cIndex;
                nextCircuitRepetition = cRep;
                nextPhaseIndex = pIndex;
                nextDuration = duration;
            } else {
                nextPhase = 'Warm-up-Work';
                nextPhaseIndex++;
                nextDuration = workout.warmup[nextPhaseIndex].duration;
            }
            break;
        }
        case 'Main-Work': {
            const currentExercise = workout.main[circuitIndex].exercises[phaseIndex];
            if (currentExercise.rest > 0) {
                nextPhase = 'Main-Rest';
                nextDuration = currentExercise.rest;
            }
            break;
        }
        case 'Main-Rest': {
            const currentCircuit = workout.main[circuitIndex];
            const isLastExerciseInCircuit = phaseIndex >= currentCircuit.exercises.length - 1;

            if (!isLastExerciseInCircuit) {
                nextPhase = 'Main-Work';
                nextPhaseIndex++;
                nextDuration = currentCircuit.exercises[nextPhaseIndex].duration;
            } else {
                const isLastRepetition = circuitRepetition >= currentCircuit.repeat;
                if (!isLastRepetition) {
                    nextPhase = 'Circuit-Rest';
                    nextDuration = currentCircuit.restBetweenSets;
                } else {
                    const isLastCircuit = circuitIndex >= workout.main.length - 1;
                    if (!isLastCircuit) {
                        nextPhase = 'Main-Work';
                        nextCircuitIndex++;
                        nextCircuitRepetition = 1;
                        nextPhaseIndex = 0;
                        nextDuration = workout.main[nextCircuitIndex].exercises[0].duration;
                    } else {
                        const { phase, pIndex, duration } = startNextMajorPhase('main');
                        nextPhase = phase as WorkoutPhase;
                        nextPhaseIndex = pIndex;
                        nextDuration = duration;
                    }
                }
            }
            break;
        }
        case 'Circuit-Rest': {
            nextPhase = 'Main-Work';
            nextCircuitRepetition++;
            nextPhaseIndex = 0;
            nextDuration = workout.main[circuitIndex].exercises[0].duration;
            break;
        }
        case 'Core-Work': {
            const currentExercise = workout.core[phaseIndex];
            if (currentExercise.rest > 0) {
                nextPhase = 'Core-Rest';
                nextDuration = currentExercise.rest;
            } else {
                const { phase, pIndex, duration } = startNextMajorPhase('core');
                nextPhase = phase as WorkoutPhase;
                nextPhaseIndex = pIndex;
                nextDuration = duration;
            }
            break;
        }
        case 'Core-Rest': {
             const isLastCore = phaseIndex >= workout.core.length - 1;
             if (isLastCore) {
                const { phase, pIndex, duration } = startNextMajorPhase('core');
                nextPhase = phase as WorkoutPhase;
                nextPhaseIndex = pIndex;
                nextDuration = duration;
             } else {
                nextPhase = 'Core-Work';
                nextPhaseIndex++;
                nextDuration = workout.core[nextPhaseIndex].duration;
             }
             break;
        }
        case 'Cool-down-Work': {
            const currentExercise = workout.cooldown[phaseIndex];
            if (currentExercise.rest && currentExercise.rest > 0) {
                nextPhase = 'Cool-down-Rest';
                nextDuration = currentExercise.rest;
            } else {
                 nextPhase = 'Finished';
            }
            break;
        }
        case 'Cool-down-Rest': {
             const isLastCooldown = phaseIndex >= workout.cooldown.length - 1;
             if (isLastCooldown) {
                nextPhase = 'Finished';
             } else {
                nextPhase = 'Cool-down-Work';
                nextPhaseIndex++;
                nextDuration = workout.cooldown[nextPhaseIndex].duration;
             }
            break;
        }
        default:
            nextPhase = 'Finished';
    }

    if (nextPhase === 'Finished') {
        return { ...currentSession, phase: 'Finished', timer: 0 };
    }

    return {
        ...currentSession,
        phase: nextPhase,
        phaseIndex: nextPhaseIndex,
        circuitIndex: nextCircuitIndex,
        circuitRepetition: nextCircuitRepetition,
        timer: nextDuration,
        totalDuration: nextDuration,
    };
  };

  useEffect(() => {
    if (!workoutSession || workoutSession.isPaused || workoutSession.phase === 'Finished') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setWorkoutSession(prev => {
        if (!prev) return null;
        if (prev.timer <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return getNextPhaseState(prev);
        }
        if (isSoundEnabled && prev.timer > 1 && prev.timer <= 4) {
          playSound('tick');
        }
        return { ...prev, timer: prev.timer - 1 };
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [workoutSession?.isPaused, workoutSession?.phase, workoutSession?.phaseIndex, workoutSession?.circuitIndex, workoutSession?.circuitRepetition, isSoundEnabled]);


  const handleStartWorkout = (workout: Workout) => {
    let initialPhase: WorkoutPhase | null = null;
    let initialDuration = 0;

    if (workout.warmup && workout.warmup.length > 0) {
      initialPhase = 'Warm-up-Work';
      initialDuration = workout.warmup[0].duration;
    } else if (workout.main && workout.main.length > 0 && workout.main[0].exercises.length > 0) {
      initialPhase = 'Main-Work';
      initialDuration = workout.main[0].exercises[0].duration;
    } else if (workout.core && workout.core.length > 0) {
      initialPhase = 'Core-Work';
      initialDuration = workout.core[0].duration;
    } else if (workout.cooldown && workout.cooldown.length > 0) {
      initialPhase = 'Cool-down-Work';
      initialDuration = workout.cooldown[0].duration;
    }

    if (initialPhase) {
      setWorkoutSession({
        workout,
        phase: initialPhase,
        phaseIndex: 0,
        circuitIndex: 0,
        circuitRepetition: 1,
        timer: initialDuration,
        totalDuration: initialDuration,
        isPaused: false,
      });
    }
  };

  const handlePauseToggle = () => {
    setWorkoutSession(prev => prev ? { ...prev, isPaused: !prev.isPaused } : null);
  };

  const handleStopWorkout = () => {
    setWorkoutSession(null);
  };
  
  const handleSkipPhase = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setWorkoutSession(prev => {
      if (!prev) return null;
      return getNextPhaseState({ ...prev });
    });
  };

  const handleToggleSound = () => setIsSoundEnabled(prev => !prev);

  const handleSubmit = async (userInput: string) => {
    setIsLoading(true);
    setError(null);
    if(workoutPlan) setWorkoutPlan(null); // Clear previous plan on new submission
    
    const userMessage: Message = { role: Role.User, text: userInput };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `(Current Date: ${new Date().toDateString()}) User says: "${userInput}"`,
        config: {
          systemInstruction: `You are "Sammi", a supportive and empowering AI coach for the Soul Good Boxing training camp, a 12-week women-only program. Your persona is like a cool, knowledgeable big sister who is also a badass boxer.

          **Camp Context:**
          - **Program:** 12-week women-only boxing training camp.
          - **Start Date:** October 6, 2025.
          - **Goals:** Build healthy eating habits, improve conditioning, refine boxing techniques, and build muscle.
          - **Your Role:** Guide clients week-by-week based on the current date. You can answer questions about nutrition, scheduling, stretching, motivation, etc.

          **Response Modes:**

          1. **Workout Plan Generation:**
              - If the user explicitly asks for a workout plan (e.g., "give me a plan for 3 days", "start workout"), you MUST respond ONLY with a special string: \`WORKOUT_PLAN::\` followed immediately by a single, valid JSON object. Do not include any other text or markdown.
              
              - **CRITICAL EXERCISE SELECTION RULE - YOUR MOST IMPORTANT INSTRUCTION:**
                - You MUST build the workout plan by selecting exercises *exclusively* from the 'Available Exercises' list provided below.
                - For every exercise in your generated JSON, you MUST use the exact 'exercise' name from the list. This is not optional.
                - A workout plan without valid exercise names from this list is a complete failure.

              **Available Exercises:**
              ${exerciseListForPrompt}

              - **Workout Template:** Adhere strictly to this template:
                - **Warm-up (5 min total):** A list of dynamic stretches. Each exercise MUST have a 'duration' and a 'rest' of 15 seconds.
                - **Main Workout (20-45 min total):** This section MUST be composed of 1-2 circuits. Each circuit should have 3-4 exercises and be repeated 2-3 times.
                    - **Exercise Timing:** ALL exercises in the main workout must have a 'duration' of 45 seconds and a 'rest' of 15 seconds.
                    - **Circuit Rest:** Each circuit object MUST have a 'restBetweenSets' property with a value of 60. This creates a 1-minute break between sets.
                - **Core Workout (5-10 min total):** Each exercise is 45-60 seconds, with 15 seconds rest.
                - **Cool-down (5 min total):** A list of full-body static stretches. Each exercise MUST have its own duration and a 'rest' of 15 seconds.
                - **Final Exercise Rest:** The final exercise in the warmup, core, and cooldown arrays should have 'rest': 0.

              - **JSON Structure:** The JSON object MUST conform to this structure (note: you only provide 'exercise', 'duration', etc. The app will add visual data):
                {
                  "workouts": [
                    {
                      "day": "number",
                      "title": "string",
                      "description": "string",
                      "warmup": [ { "exercise": "string", "duration": "number", "rest": 15 } ],
                      "main": [
                        {
                          "repeat": "number (2-3)",
                          "restBetweenSets": 60,
                          "exercises": [
                            { "exercise": "string", "duration": 45, "rest": 15 },
                            { "exercise": "string", "duration": 45, "rest": 15 }
                          ]
                        }
                      ],
                      "core": [ { "exercise": "string", "duration": "number (45-60)", "rest": 15 } ],
                      "cooldown": [ { "exercise": "string", "duration": "number", "rest": 15 } ]
                    }
                  ]
                }
              - **Example of a CORRECT entry:**
                {
                  "exercise": "Jumping Jacks",
                  "duration": 30,
                  "rest": 15
                }
              - Before you output the JSON, you must double-check that every single 'exercise' name you have provided comes directly from the 'Available Exercises' list.

          2. **General Conversation:**
              - For ANY other question or comment (e.g., "what should I eat?", "I feel unmotivated"), respond as a friendly and knowledgeable coach.
              - Use markdown for formatting. DO NOT use the \`WORKOUT_PLAN::\` prefix.

          Keep your tone motivational, expert, and aligned with the "supportive big sister" persona.`
        }
      });
      
      const responseText = response.text.trim();
      
      if (responseText.startsWith('WORKOUT_PLAN::')) {
        const jsonString = responseText.replace('WORKOUT_PLAN::', '');
        try {
          const planFromAI = JSON.parse(jsonString);

          // Enrich the plan with IDs and search queries from our library
          const enrichExercise = (exercise: { exercise: string }) => {
            const libraryEntry = libraryMap.get(exercise.exercise);
            return {
              ...exercise,
              youtubeVideoId: libraryEntry?.youtubeVideoId || '',
              searchQuery: libraryEntry ? `how to do ${libraryEntry.name}` : exercise.exercise,
            };
          };

          const enrichedWorkouts = planFromAI.workouts.map((workout: any) => ({
            ...workout,
            warmup: workout.warmup.map(enrichExercise),
            main: workout.main.map((circuit: any) => ({
              ...circuit,
              exercises: circuit.exercises.map(enrichExercise),
            })),
            core: workout.core.map(enrichExercise),
            cooldown: workout.cooldown.map(enrichExercise),
          }));

          const enrichedPlan: WorkoutPlan = { workouts: enrichedWorkouts };
          setWorkoutPlan(enrichedPlan);
          
          const modelMessage: Message = { 
            role: Role.Model, 
            text: "Alright, let's get it! Here is the plan I cooked up for you. Choose a day and let's get started whenever you're ready. You got this!"
          };
          setMessages(prev => [...prev, modelMessage]);
        } catch (e) {
          console.error("JSON parsing error:", e);
          throw new Error("The workout plan I received was not in the correct format.");
        }
      } else {
        setWorkoutPlan(null);
        const modelMessage: Message = { role: Role.Model, text: responseText };
        setMessages(prev => [...prev, modelMessage]);
      }

    } catch (e) {
      console.error(e);
      const errorMessage = "Apologies, I'm having a little trouble right now. Could you try rephrasing your request or check back in a moment?";
      setError(errorMessage);
      setMessages(prev => [...prev, { role: Role.Model, text: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const isWorkoutActive = workoutSession !== null;

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      <Header isSoundEnabled={isSoundEnabled} onToggleSound={handleToggleSound} />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-8">
          {!isWorkoutActive && messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}
          {isLoading && !isWorkoutActive && (
            <ChatMessage 
              message={{ role: Role.Model, text: "" }} 
              isLoading={true} 
            />
          )}
          {error && !isLoading && !isWorkoutActive && <p className="text-red-500 text-center">{messages[messages.length-1].text}</p>}
          <WorkoutDisplay 
            plan={workoutPlan} 
            session={workoutSession}
            onStart={handleStartWorkout}
            onPauseToggle={handlePauseToggle}
            onStop={handleStopWorkout}
            onSkip={handleSkipPhase}
          />
          <div ref={messagesEndRef} />
        </div>
      </main>
      {!isWorkoutActive && <ChatInput onSubmit={handleSubmit} isLoading={isLoading} />}
    </div>
  );
};

export default App;