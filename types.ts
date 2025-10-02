export enum Role {
  User = 'user',
  Model = 'model',
}

export interface Message {
  role: Role;
  text: string;
}

export interface SimpleExercise {
  exercise: string;
  youtubeVideoId: string;
  searchQuery: string;
  duration: number; // duration in seconds
  rest?: number;    // rest after exercise in seconds
}

export interface Exercise extends SimpleExercise {
  rest: number;     // rest after exercise in seconds
}

export interface Circuit {
  repeat: number;
  restBetweenSets: number;
  exercises: Exercise[];
}

export interface Workout {
  day: number;
  title: string;
  description: string;
  warmup: SimpleExercise[];
  main: Circuit[];
  core: Exercise[];
  cooldown: SimpleExercise[];
}

export interface WorkoutPlan {
  workouts: Workout[];
}

export type WorkoutPhase = 'Warm-up-Work' | 'Warm-up-Rest' | 'Main-Work' | 'Main-Rest' | 'Circuit-Rest' | 'Core-Work' | 'Core-Rest' | 'Cool-down-Work' | 'Cool-down-Rest' | 'Finished';

export interface WorkoutSession {
  workout: Workout;
  phase: WorkoutPhase;
  phaseIndex: number;      // index of exercise within a phase (warmup, core, cooldown, or circuit)
  circuitIndex: number;    // index of the current circuit in the main workout
  circuitRepetition: number; // current repetition of the circuit
  timer: number;
  totalDuration: number;
  isPaused: boolean;
}