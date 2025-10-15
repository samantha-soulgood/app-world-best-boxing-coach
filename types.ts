export type Sender = 'user' | 'sammi';

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  workoutPlan?: WorkoutPlan;
  video?: Video;
  isWorkoutCompleted?: boolean;
  rpe?: number; // Rating of Perceived Exertion
  feedback?: string; // User feedback text
}

export interface User {
  id: string;
  name: string;
  profile?: OnboardingData;
}

export interface OnboardingData {
  pronouns: string;
  age: string;
  goals: string;
  injuries: string;
  equipment: string;
  activityLevel: string;
  dietaryPreferences?: string;
  foodAllergies?: string;
}

export interface WorkoutPlan_Exercise {
  name: string;
  sets: number;
  reps: string;
  notes?: string;
  duration: string;
}

export interface WorkoutPlan_Phase {
  name: string;
  exercises: WorkoutPlan_Exercise[];
}

export interface WorkoutPlan {
  summary: string;
  workout: {
    phases: WorkoutPlan_Phase[];
  };
}

export interface Video {
  id: string;
  title: string;
  watchUrl: string;
}

export interface JournalEntry {
  id: string;
  text: string;
  timestamp: number;
}

export interface ScheduledClass {
  id: string;
  title: string;
  description: string;
  instructor: string;
  startTime: number; // timestamp
  endTime: number; // timestamp
  capacity: number;
  bookedCount: number;
  type: 'boxing' | 'strength' | 'cardio' | 'yoga' | 'nutrition';
}

export interface ClassBooking {
  id: string;
  classId: string;
  userId: string;
  timestamp: number;
}
