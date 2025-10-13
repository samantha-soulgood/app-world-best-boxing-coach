
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// OpenAI integration - no client library needed, using direct API calls
import type { Message, Sender, OnboardingData, User, WorkoutPlan, Video, JournalEntry } from './types';
import { SAMMI_PERSONA } from './constants';
import Header from './components/Header';
import ChatWindow, { type ChatWindowRef } from './components/ChatWindow';
import MessageInput from './components/MessageInput';
import LoginScreen from './components/LoginScreen';
import OnboardingScreen from './components/OnboardingScreen';
import WorkoutPlayer from './components/WorkoutPlayer';
import VideoLibrary from './components/VideoLibrary';
import VideoPlayer from './components/VideoPlayer';
import TopicButton from './components/TopicButton';
import Journal from './components/Journal';
import { ChevronDownIcon, ChevronUpIcon } from './components/Icons';
import { parseWorkoutJson } from './utils';

// Add a declaration for the google object from the GSI script
declare global {
  interface Window {
    google: any;
    marked: {
      parse: (markdown: string) => string;
    };
  }
}

// --- Helper Functions ---

const getYouTubeIdFromUrl = (urlString: string): string | null => {
    try {
        const url = new URL(urlString);
        if (url.hostname.endsWith('youtube.com')) {
            return url.searchParams.get('v');
        }
        if (url.hostname.endsWith('youtu.be')) {
            // For youtu.be links, the ID is in the pathname
            return url.pathname.slice(1);
        }
    } catch (e) {
        console.error("Invalid URL for YouTube ID extraction:", urlString, e);
    }
    return null;
};

const pruneHistoryToLast24Hours = (messages: Message[]): Message[] => {
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    return messages.filter(msg => msg.timestamp >= twentyFourHoursAgo);
};


const pruneHistoryToLastNCompletedWorkouts = (messages: Message[], count: number): Message[] => {
    // Filter for only completed workouts to find the cutoff date
    const completedWorkoutMessages = messages
        .filter(msg => msg.workoutPlan && msg.isWorkoutCompleted)
        .sort((a, b) => b.timestamp - a.timestamp);

    if (completedWorkoutMessages.length > count) {
        // Get the timestamp of the Nth most recent *completed* workout
        const cutoffTimestamp = completedWorkoutMessages[count - 1].timestamp;
        // Return all messages from that point in time forward
        return messages.filter(msg => msg.timestamp >= cutoffTimestamp);
    }
    
    // If there are N or fewer completed workouts, return the entire history
    return messages;
};


// --- AI Schemas and Tool Definitions ---

const workoutSchema = {
    type: 'object',
    properties: {
        summary: { type: 'string', description: "A brief, encouraging string about the workout." },
        workout: {
            type: 'object',
            properties: {
                phases: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            exercises: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        name: { type: 'string' },
                                        sets: { type: 'number' },
                                        reps: { type: 'string' },
                                        duration: { type: 'string' },
                                        notes: { type: 'string' }
                                    },
                                    required: ['name', 'sets', 'reps', 'duration']
                                }
                            }
                        },
                        required: ['name', 'exercises']
                    }
                }
            },
            required: ['phases']
        }
    },
    required: ['summary', 'workout']
};

const createWorkoutPlanFunction = {
    type: 'function',
    function: {
    name: 'createWorkoutPlan',
        description: 'Creates a detailed, fitness-focused workout plan when the user asks for a workout, training session, or exercise routine. Use this function even if the user profile is incomplete - create a general workout that can be adapted. CRITICAL: Always extract and pass the user\'s specific workout request (e.g., "upper body", "lower body", "cardio", etc.) in the userRequest parameter.',
    parameters: {
        type: 'object',
        properties: {
            duration: {
                type: 'string',
                description: 'The desired total duration of the workout, e.g., "30 minutes". If not specified, use "30 minutes" as default.'
            },
                userRequest: {
                    type: 'string',
                    description: 'The user\'s specific workout request, extracted from their message. Examples: "upper body workout", "lower body focus", "core exercises", "cardio session", "full body", "leg day". This is CRITICAL for ensuring the workout matches their request. If not specified in the message, use "general workout".'
        },
    },
            required: ['duration', 'userRequest'],
        },
    }
};

const findBoxingVideoFunction = {
    type: 'function',
    function: {
    name: 'findBoxingVideo',
    description: 'Finds and displays a relevant fitness tutorial video on YouTube when a user asks for video tutorials, exercise demonstrations, or workout videos. Use this function whenever the user requests video content, exercise demonstrations, or tutorial videos.',
    parameters: {
        type: 'object',
        properties: {
            topic: {
                type: 'string',
                description: 'The specific fitness technique or topic the user wants a video for (e.g., "squats", "cardio", "strength training").'
            }
        },
        required: ['topic']
    },
    }
};

const showVideoLibraryFunction = {
    type: 'function',
    function: {
    name: 'showVideoLibrary',
    description: 'Shows the user the library of pre-selected video drills and tutorials when they ask to see the video list or library.',
    parameters: {
        type: 'object',
        properties: {},
    },
    }
};

const createNutritionPlanFunction = {
    type: 'function',
    function: {
    name: 'createNutritionPlan',
    description: 'Creates a personalized nutrition plan when a user asks for a diet plan, meal plan, weekly meal plan, daily meals, or any structured list of what to eat. Use this function whenever the user requests meal planning, nutrition planning, or dietary guidance.',
    parameters: {
        type: 'object',
        properties: {
            goal: {
                type: 'string',
                description: 'The specific dietary goal, e.g., "weight loss", "muscle gain", "race day prep". Inferred from the user query.'
            },
            dietaryRestrictions: {
                type: 'string',
                description: 'Any specific dietary restrictions or preferences the user mentions, e.g., "vegetarian", "gluten-free", "allergic to nuts".'
            },
            duration: {
                type: 'string',
                description: 'The duration of the meal plan, e.g., "one day", "for the week". Defaults to a single day if not specified.'
            }
        },
        required: ['goal', 'duration'],
    },
    }
};


const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOnboarding, setIsOnboarding] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingWorkout, setIsGeneratingWorkout] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // OpenAI integration - using direct API calls only
  const [activeWorkoutInfo, setActiveWorkoutInfo] = useState<{ plan: WorkoutPlan, messageId: string } | null>(null);
  const [showVideoLibrary, setShowVideoLibrary] = useState<boolean>(false);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [showJournal, setShowJournal] = useState<boolean>(false);
  const [isTopicsVisible, setIsTopicsVisible] = useState(true);
  const chatWindowRef = useRef<ChatWindowRef>(null);

  const scrollToEnd = () => {
    chatWindowRef.current?.scrollToEnd();
  };

  const displayedMessages = useMemo(() => {
    return pruneHistoryToLast24Hours(messages);
  }, [messages]);

  const initChat = (historyMessages: Message[], userProfile?: OnboardingData) => {
    try {
      // OpenAI uses direct API calls via server proxy - no client-side API key needed
      console.log("InitChat - OpenAI integration ready");
      setError(null);
      console.log("OpenAI chat initialized successfully");
    } catch (e) {
      console.error(e);
      setError("Failed to initialize the AI. Please check the API key.");
    }
  };

  useEffect(() => {
    try {
    // Check for new key first, then fallback to old key for migration
    let storedUserJson = localStorage.getItem('soulGoodFitnessUser');
    if (!storedUserJson) {
      // Migrate from old key
      storedUserJson = localStorage.getItem('soulGoodBoxingUser');
      if (storedUserJson) {
        // Copy to new key and remove old key
        localStorage.setItem('soulGoodFitnessUser', storedUserJson);
        localStorage.removeItem('soulGoodBoxingUser');
        console.log('Migrated user data from soulGoodBoxingUser to soulGoodFitnessUser');
      }
    }
    
    if (storedUserJson) {
      const user: User = JSON.parse(storedUserJson);
      const storedMessages = localStorage.getItem(`chatHistory_${user.id}`);
      const storedJournal = localStorage.getItem(`journalEntries_${user.id}`);

      if (storedJournal) {
          try {
          setJournalEntries(JSON.parse(storedJournal));
          } catch (err) {
            console.error('Failed to parse journal entries:', err);
            setJournalEntries([]);
          }
      }

      if (storedMessages) {
          try {
        const allMessages: Message[] = JSON.parse(storedMessages);
        const recentMessages = pruneHistoryToLastNCompletedWorkouts(allMessages, 14);

        // Check if the last message is recent (within last hour)
        const lastMessageTime = recentMessages[recentMessages.length - 1]?.timestamp || 0;
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        const isRecentSession = lastMessageTime > oneHourAgo;
        
        // Only add welcome back message if it's been more than an hour
        if (!isRecentSession) {
          const welcomeBackMessage: Message = {
            id: `welcome-back-${Date.now()}`,
            text: `Welcome back, ${user.name}! 💪 Ready to continue your fitness journey? What would you like to work on today?`,
            sender: 'sammi',
            timestamp: Date.now(),
          };
          setMessages([...recentMessages, welcomeBackMessage]);
          setCurrentUser(user);
          initChat([...recentMessages, welcomeBackMessage], user.profile);
        } else {
          // Recent session - just load existing messages
          setMessages(recentMessages);
          setCurrentUser(user);
          initChat(recentMessages, user.profile);
        }
          } catch (err) {
            console.error('Failed to parse messages:', err);
            setCurrentUser(user);
            if (!user.profile) {
              setIsOnboarding(true);
              setMessages([]);
            } else {
              // Messages corrupted but user has profile - add welcome message
              const welcomeMessage: Message = {
                id: `welcome-${Date.now()}`,
                text: `Welcome back to Soul Good Fitness, ${user.name}! I'm Sammi, your personal fitness coach. Ready to train? What would you like to work on today?`,
                sender: 'sammi',
                timestamp: Date.now(),
              };
              setMessages([welcomeMessage]);
              initChat([welcomeMessage], user.profile);
            }
          }
      } else {
        // This case handles a user who logged in but didn't finish onboarding
        setCurrentUser(user);
          if (!user.profile) {
            setIsOnboarding(true);
        setMessages([]);
          } else {
            // User has profile but no messages - add welcome message
            const welcomeMessage: Message = {
              id: `welcome-${Date.now()}`,
              text: `Welcome back to Soul Good Fitness, ${user.name}! I'm Sammi, your personal fitness coach. Ready to train? What would you like to work on today?`,
              sender: 'sammi',
              timestamp: Date.now(),
            };
            setMessages([welcomeMessage]);
            initChat([welcomeMessage], user.profile);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user data from localStorage:', error);
      // Clear corrupted data and start fresh
      localStorage.removeItem('soulGoodFitnessUser');
      localStorage.removeItem('soulGoodBoxingUser');
      setCurrentUser(null);
      setMessages([]);
      setIsOnboarding(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser && messages.length > 0) {
      const historyToSave = pruneHistoryToLastNCompletedWorkouts(messages, 14);
      localStorage.setItem(`chatHistory_${currentUser.id}`, JSON.stringify(historyToSave));
    }
  }, [messages, currentUser]);
  
  useEffect(() => {
    if (currentUser) {
        localStorage.setItem(`journalEntries_${currentUser.id}`, JSON.stringify(journalEntries));
    }
  }, [journalEntries, currentUser]);

  const handleLogin = (user: User) => {
    const storedUserJson = localStorage.getItem('soulGoodFitnessUser');
    let fullUser = user;
    if(storedUserJson){
        const storedUser = JSON.parse(storedUserJson);
        if(storedUser.id === user.id && storedUser.profile){
            fullUser = storedUser;
        }
    }
    
    localStorage.setItem('soulGoodFitnessUser', JSON.stringify(fullUser));
    setCurrentUser(fullUser);

    const storedMessages = localStorage.getItem(`chatHistory_${fullUser.id}`);
    const storedJournal = localStorage.getItem(`journalEntries_${fullUser.id}`);
    
    if (storedJournal) {
        setJournalEntries(JSON.parse(storedJournal));
    }

    if (storedMessages) {
      const allMessages = JSON.parse(storedMessages);
      const recentMessages = pruneHistoryToLastNCompletedWorkouts(allMessages, 14);
      
      setMessages(recentMessages);
      initChat(recentMessages, fullUser.profile);
      setIsOnboarding(false);
    } else {
      setMessages([]);
      setIsOnboarding(!fullUser.profile);
    }
  };

  const handleLogout = () => {
    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
    localStorage.removeItem('soulGoodFitnessUser');
    setCurrentUser(null);
    setMessages([]);
    setJournalEntries([]);
    setIsOnboarding(false);
  };
  
  const generateNutritionPlan = useCallback(async (options: {
      goal?: string;
      dietaryRestrictions?: string;
      duration?: string;
      userInfo?: OnboardingData;
      journalEntries?: JournalEntry[];
  }): Promise<string> => {
      // Use OpenAI API instead of Google Gemini
      const { goal, dietaryRestrictions, duration, userInfo, journalEntries } = options;
      
      let prompt = `Your task is to act as Sammi, a fitness coach, and create a practical, personalized nutritional plan for a client. The output MUST be well-structured markdown.\n\n`;

      // Food Allergies - HIGHEST PRIORITY
      if (userInfo?.foodAllergies && userInfo.foodAllergies.trim() !== '' && userInfo.foodAllergies.toLowerCase() !== 'none') {
          prompt += `🔴🔴🔴 CRITICAL SAFETY ALERT 🔴🔴🔴\n`;
          prompt += `FOOD ALLERGIES: ${userInfo.foodAllergies}\n\n`;
          prompt += `**YOU MUST ABSOLUTELY AVOID THESE FOODS IN ALL MEALS:**\n`;
          prompt += `- Do NOT suggest any foods containing these allergens\n`;
          prompt += `- Do NOT suggest foods that "might be okay"\n`;
          prompt += `- Only suggest foods that are 100% safe and allergen-free\n`;
          prompt += `- This is a safety issue - strictly adhere to these restrictions\n\n`;
          prompt += `═══════════════════════════════════════════════════════════\n\n`;
      }

      // User Profile Section
      prompt += '## User Profile\n';
      if (userInfo) {
          prompt += `- Primary Goal: ${userInfo.goals || 'Not specified'}\n`;
          prompt += `- Activity Level: ${userInfo.activityLevel || 'Not specified'}\n`;
          if (userInfo.dietaryPreferences) {
              prompt += `- Dietary Preferences: ${userInfo.dietaryPreferences}\n`;
          }
          if (userInfo.foodAllergies) {
              prompt += `- Food Allergies/Restrictions: ${userInfo.foodAllergies}\n`;
          }
      } else {
          prompt += '- No user profile data available. Create a general nutrition plan.\n\n';
      }
      
      // Journal Context Section
      if (journalEntries && journalEntries.length > 0) {
          prompt += '\n## User\'s Private Journal (for context)\n';
          prompt += 'The user keeps a private journal. Use these recent entries for deeper context into their mood, energy levels, and mindset. Refer to them subtly if it helps personalize the plan.\n';
          journalEntries.slice(0, 5).forEach(entry => {
              prompt += `- ${new Date(entry.timestamp).toLocaleDateString()}: "${entry.text}"\n`;
          });
          prompt += '\n';
      }

      // Nutrition Request Section
      prompt += '## Nutrition Request\n';
      prompt += `- Plan Duration: ${duration || 'Single Day'}\n`;
      prompt += `- Stated Goal: ${goal || 'General healthy eating for training'}\n`;
      prompt += `- Dietary Restrictions/Preferences: ${dietaryRestrictions || 'None specified'}\n\n`;

      // Core Philosophy Section
      prompt += '## Core Philosophy\n';
      prompt += "1.  **Sustainable Habits, Not Diets:** The goal is to build sustainable, healthy eating habits, not to create a restrictive, short-term diet. Focus on small, manageable changes. The plan should feel like an upgrade, not an overhaul.\n";
      prompt += "2.  **Balance is Key:** Promote a balanced intake of macronutrients (protein for muscle repair, complex carbs for energy, healthy fats for overall health). Meals should be nourishing and support their training goals.\n";
      prompt += "3.  **Preference & Variety:** Provide a variety of appealing and simple-to-prepare meals to prevent boredom. The choices should be realistic for someone with a busy lifestyle.\n\n";

      // Instructions and Constraints Section
      prompt += '\n## Instructions & Constraints\n';
      if (duration && duration.toLowerCase().includes('week')) {
          prompt += "1.  **Structure:** Organize the plan by day. Use a Level 2 Markdown Heading (e.g., `## Monday`) for each day. Under each day, use Level 3 Headings (e.g., `### Breakfast`) for 'Breakfast', 'Lunch', and 'Dinner'. Use an unordered list (`-`) for meal suggestions.\n";
          prompt += "2.  **Personalization:** Tailor suggestions to the user's profile. Instead of just listing foods, briefly explain *why* a suggestion is good (e.g., 'Oatmeal with berries: great for sustained energy before training.'). If their goal is 'weight loss', suggest satisfying, high-protein/fiber meals. If 'muscle gain', include more complex carbs and protein. If they are 'vegetarian', all suggestions MUST be vegetarian.\n";
          prompt += "3.  **CRITICAL - Dietary Restrictions:** If the user has food allergies or dietary preferences listed in their profile, you MUST strictly adhere to these restrictions. NEVER suggest foods they are allergic to or that conflict with their dietary preferences. Always provide safe alternatives.\n";
          prompt += "4.  **Fitness Context:** Frame advice for someone who exercises. Mention things like pre-workout fuel or post-workout recovery when appropriate.\n";
          prompt += "5.  **Tone:** Maintain Sammi's energetic, motivating, and no-nonsense voice.\n";
          prompt += "6.  **Sign-off:** End with an encouraging, supportive sign-off like 'You've got this!' or 'Take care of yourself today.'\n";
      } else { // For a single day plan
          prompt += "1.  **Structure:** Organize the plan with Level 3 Markdown Headings (e.g., `### Breakfast`) for 'Breakfast', 'Lunch', 'Dinner', and 'Snacks'. Provide 2-3 simple meal/snack ideas as an unordered list (`-`) for each.\n";
          prompt += "2.  **Personalization:** Tailor suggestions to the user's profile. Briefly explain the benefit of a food choice in the context of their training (e.g., 'Greek yogurt: excellent source of protein for muscle recovery.').\n";
          prompt += "3.  **CRITICAL - Dietary Restrictions:** If the user has food allergies or dietary preferences listed in their profile, you MUST strictly adhere to these restrictions. NEVER suggest foods they are allergic to or that conflict with their dietary preferences. Always provide safe alternatives.\n";
          prompt += "4.  **Boxing Context:** Frame advice for an athlete. Mention pre-workout fuel or post-workout recovery.\n";
          prompt += "5.  **Tone:** Maintain Sammi's energetic, motivating, and no-nonsense voice.\n";
          prompt += "6.  **Sign-off:** End with an encouraging, supportive sign-off like 'You've got this!' or 'Take care of yourself today.'\n";
      }

      // Use OpenAI API call
      const requestBody = {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: SAMMI_PERSONA
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        temperature: 1.0, // Higher temperature for more variety in meal plans
        max_tokens: 2048
      };

      const response = await fetch('/api-proxy/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const result = await response.json();
      return result.choices?.[0]?.message?.content || "Sorry, I couldn't generate a nutrition plan.";
  }, [currentUser?.profile]);

  const generateWorkoutPlan = useCallback(async (options: {
      duration?: string;
      userRequest?: string;
      lastWorkoutMessage?: Message;
      userInfo?: OnboardingData;
      journalEntries?: JournalEntry[];
  }): Promise<WorkoutPlan> => {
    console.log("generateWorkoutPlan: Called with options:", options);
    // Use OpenAI API instead of Google Gemini
    const { duration, userRequest, lastWorkoutMessage, userInfo, journalEntries } = options;
    
    let prompt = '🔴🔴🔴 CRITICAL FORMAT RULE - READ THIS FIRST 🔴🔴🔴\n\n';
    prompt += 'Each workout SET must have EXACTLY 4 exercises. NOT 3, NOT 5, NOT 8 - ONLY 4.\n';
    prompt += 'If you create a set with 8 exercises, you are doing it WRONG.\n';
    prompt += 'Instead, create TWO SEPARATE SETS, each with 4 exercises.\n\n';
    prompt += '✅ CORRECT: Set 1 (4 exercises), Set 2 (4 exercises)\n';
    prompt += '❌ WRONG: Set 1 (8 exercises)\n\n';
    prompt += '═══════════════════════════════════════════════════════════\n\n';
    prompt += 'Your task is to create a FUN and CHALLENGING workout plan that feels like an exciting adventure!\n\n';
    
    // User's Specific Request - HIGHEST PRIORITY
    if (userRequest) {
      prompt += `## 🎯 USER'S SPECIFIC REQUEST (HIGHEST PRIORITY - FOLLOW THIS EXACTLY):\n`;
      prompt += `"${userRequest}"\n\n`;
      prompt += `**CRITICAL: The workout MUST match this request. If they ask for "upper body", give them ONLY upper body exercises. If they ask for "legs" or "lower body", give them ONLY lower body exercises. This is NON-NEGOTIABLE.**\n\n`;
    }

    // User Profile Section
    prompt += '## User Profile\n';
    if (userInfo) {
        prompt += `- Activity Level: ${userInfo.activityLevel || 'Not specified'}\n`;
        prompt += `- Injuries/Concerns: ${userInfo.injuries || 'None'}\n`;
        prompt += `- Goals: ${userInfo.goals || 'Not specified'}\n`;
        prompt += `- Available Equipment: ${userInfo.equipment || 'Bodyweight only'}\n\n`;
        
        // Emphasize equipment usage
        if (userInfo.equipment && userInfo.equipment.toLowerCase() !== 'none' && userInfo.equipment.toLowerCase() !== 'bodyweight only') {
            prompt += `**🔑 EQUIPMENT REQUIREMENT: The user has the following equipment available: "${userInfo.equipment}". You MUST incorporate this equipment into the workout. Design exercises that specifically use this equipment to maximize effectiveness. Do not create a bodyweight-only workout when equipment is available.**\n\n`;
    } else {
            prompt += `**📝 NOTE: This is a bodyweight-only workout. Use creative bodyweight exercises.**\n\n`;
        }
    } else {
        prompt += '- No user profile data available. Create a general bodyweight workout.\n\n';
    }

    // Journal Context Section
    if (journalEntries && journalEntries.length > 0) {
        prompt += '## User\'s Private Journal (for context)\n';
        prompt += 'The user keeps a private journal. Use these recent entries for deeper context into their mood, energy levels, and mindset to tailor the workout. For example, if they feel low-energy, maybe suggest a slightly less intense workout. If they feel strong, push them a bit harder.\n';
        journalEntries.slice(0, 5).forEach(entry => {
            prompt += `- ${new Date(entry.timestamp).toLocaleDateString()}: "${entry.text}"\n`;
        });
        prompt += '\n';
    }

    // Workout Request Section
    prompt += '## Workout Request\n';
    if (lastWorkoutMessage?.workoutPlan) {
        prompt += `Create a new workout that is a clear progression from the user's last one. Consider their feedback to tailor the intensity.\n`;
        if (lastWorkoutMessage.rpe) {
            prompt += `- Last Workout RPE (1-10): ${lastWorkoutMessage.rpe}\n`;
        }
        if (lastWorkoutMessage.feedback) {
            prompt += `- Last Workout Feedback: "${lastWorkoutMessage.feedback}"\n`;
        }
        
        // Safely extract exercises with error handling
        let uniqueLastExercises: string[] = [];
        try {
            if (lastWorkoutMessage.workoutPlan.workout?.phases) {
        const lastWorkoutExercises = lastWorkoutMessage.workoutPlan.workout.phases
                    .flatMap(phase => {
                        if (!phase?.exercises) return [];
                        return phase.exercises
                            .map(ex => ex?.name)
                            .filter(name => name && typeof name === 'string')
                            .map(name => name.toLowerCase())
                            .filter(name => name !== 'rest');
                    });
                uniqueLastExercises = [...new Set(lastWorkoutExercises)];
            }
        } catch (error) {
            console.error("Error extracting last workout exercises:", error);
            uniqueLastExercises = [];
        }
        
        if (uniqueLastExercises.length > 0) {
        prompt += `\n## 🚫 EXERCISES TO COMPLETELY AVOID (used in last workout):\n`;
        prompt += `${uniqueLastExercises.join(', ')}\n\n`;
        prompt += `**🔴 ABSOLUTE ZERO REPETITION RULE (NON-NEGOTIABLE):**\n`;
        prompt += `DO NOT use ANY of these exercises or their variations. This means:\n`;
        prompt += `- If last workout had "Push-ups", you CANNOT use ANY push-up variation (diamond, wide, decline, etc.)\n`;
        prompt += `- If last workout had "Squats", you CANNOT use ANY squat variation (jump, sumo, pistol, etc.)\n`;
        prompt += `- If last workout had "Plank", you CANNOT use ANY plank variation (side, shoulder taps, etc.)\n`;
        prompt += `- If last workout had "Lunges", you CANNOT use ANY lunge variation (reverse, walking, jumping, etc.)\n\n`;
        prompt += `**This applies to ALL phases - create an ENTIRELY NEW workout with 100% different exercises.**\n\n`;
        prompt += `**Examples of COMPLETELY DIFFERENT alternatives:**\n`;
        prompt += `- Last workout had "Push-ups"? → Use: Dips, Bear Crawls, Burpees, Mountain Climbers, Inchworms, Commandos (NOT any push-up variation)\n`;
        prompt += `- Last workout had "Squats"? → Use: Deadlifts, Step-ups, Box Jumps, Wall Sits, Glute Bridges, Single-leg RDLs (NOT any squat variation)\n`;
        prompt += `- Last workout had "Plank"? → Use: Dead Bug, Hollow Body Hold, Bird Dog, Russian Twists, V-ups, Leg Raises (NOT any plank variation)\n`;
        prompt += `- Last workout had "Lunges"? → Use: Single-leg Deadlifts, Cossack Squats, Skater Hops, Lateral Bounds, Side Shuffles (NOT any lunge variation)\n`;
        prompt += `- Last workout had "Arm Circles"? → Use: Band Pull-Aparts, Scapular Push-ups, YTWs, Overhead Reaches, Arm Haulers (NOT any circle variation)\n`;
        prompt += `- Last workout had "Jumping Jacks"? → Use: High Knees, Butt Kicks, Jumping Rope, Skater Jumps, Tuck Jumps (NOT any jack variation)\n\n`;
        prompt += `**Remember: Use COMPLETELY DIFFERENT movement patterns. If the base exercise was used before, choose an entirely different exercise category!**\n\n`;
        }
    } else {
        prompt += `This is the user's first workout. Create a diverse and exciting plan based on their profile.\n`;
    }

    if (duration) {
        prompt += `- Target Duration: ${duration}\n`;
    }

    // Fun & Challenge Requirements
    prompt += '\n## Workout Requirements\n';
    prompt += '- 🔴 **SETS MUST HAVE EXACTLY 4 EXERCISES**: Every workout set contains EXACTLY 4 exercises, not 3, not 5, not 6 - ONLY 4. This is mandatory.\n';
    prompt += '- ✨ **CREATIVITY IS KEY**: Use unique, creative exercise names and playful challenges. Avoid generic names!\n';
    prompt += '- 🎨 **MAXIMIZE VARIETY**: Every workout should feel fresh and different. Use different angles, tempos, ranges of motion, and movement patterns\n';
    prompt += '- 🚫 **NO EXERCISE REPETITION WITHIN WORKOUT**: Each exercise must be UNIQUE across all phases. If you use "Push-ups" in the warm-up, you CANNOT use any push-up variation in the main workout or core finisher. Each movement pattern should only appear ONCE in the entire workout.\n';
    prompt += '- 💪 Make it CHALLENGING - push the user to their next level with progressive difficulty\n';
    prompt += '- 🔥 Include variety in intensity - mix high-energy bursts with focused strength work\n';
    prompt += '- 🎯 Use motivational, energetic language that makes exercises feel exciting\n';
    prompt += '- 🏆 Add achievement moments that make the user feel strong and accomplished\n';
    prompt += '- 🎪 Create fun exercise combinations or mini-circuits with unexpected twists\n';
    prompt += '- 🌈 Think outside the box: Use unconventional exercises, creative variations, and playful names\n';

    // Instructions and Constraints Section
    prompt += '\n## Workout Structure\n';
    prompt += `Create a ${duration || '30-minute'} workout with 4 phases:\n\n`;
    prompt += `**🔴 CRITICAL RULE: NO EXERCISE OR MOVEMENT PATTERN CAN REPEAT ACROSS PHASES!**\n`;
    prompt += `Each phase must use COMPLETELY DIFFERENT exercises. If warm-up includes lunges, main workout CANNOT have any lunge variations. If main workout has planks, core finisher CANNOT have any plank variations. This ensures maximum variety and prevents boredom.\n\n`;
    prompt += '1. **Warm-up**: 3-4 dynamic exercises (30s-1min each). Use movements like: dynamic lunges with twist, inchworms, world\'s greatest stretch, leg swings, hip circles, cat-cow flow, arm swings, torso rotations, lateral shuffles, high knees with arm reach, butt kicks with shoulder rolls, etc.\n';
    prompt += '2. **Main Workout Sets**: Create 2-3 SEPARATE sets. Each set has EXACTLY 4 EXERCISES (not counting Rest).\n\n';
    prompt += '**🔴 NON-NEGOTIABLE SET STRUCTURE:**\n';
    prompt += '- Each SET = EXACTLY 4 ACTUAL EXERCISES (NOT 3, NOT 5, NOT 6, NOT 8 - ONLY 4)\n';
    prompt += '- ⚠️ IMPORTANT: "Rest" is NOT an exercise! Do NOT count Rest in your 4 exercises.\n';
    prompt += '- Rest periods go BETWEEN exercises automatically - you don\'t need to add them as separate exercises\n';
    prompt += '- Count ONLY actual exercises: 1, 2, 3, 4 - then STOP and start a new set\n';
    prompt += '- Each exercise = 45 seconds work\n';
    prompt += '- Rest happens automatically between exercises (15 seconds)\n';
    prompt += '- The 4th (LAST) exercise in EVERY set MUST have notes: "Repeat this set X times"\n';
    prompt += '- Calculate X: 15min=1x, 20min=2x, 30min=3x (MAX 3x for any duration)\n\n';
    prompt += '**EXACT FORMAT YOU MUST FOLLOW:**\n';
    prompt += '```\n';
    prompt += 'Set 1 has 4 EXERCISES (Rest is automatic, not counted):\n';
    prompt += '  1. Exercise 1 (45 seconds) ← First exercise\n';
    prompt += '  2. Rest (15 seconds) ← Automatic, not counted\n';
    prompt += '  3. Exercise 2 (45 seconds) ← Second exercise\n';
    prompt += '  4. Rest (15 seconds) ← Automatic, not counted\n';
    prompt += '  5. Exercise 3 (45 seconds) ← Third exercise\n';
    prompt += '  6. Rest (15 seconds) ← Automatic, not counted\n';
    prompt += '  7. Exercise 4 (45 seconds, notes: "Repeat this set 3 times") ← Fourth exercise\n';
    prompt += '  8. Rest (30 seconds) ← Between-set rest\n\n';
    prompt += 'Set 2 has 4 EXERCISES (Rest is automatic, not counted):\n';
    prompt += '  1. Exercise 5 (45 seconds) ← First exercise\n';
    prompt += '  2. Rest (15 seconds) ← Automatic, not counted\n';
    prompt += '  3. Exercise 6 (45 seconds) ← Second exercise\n';
    prompt += '  4. Rest (15 seconds) ← Automatic, not counted\n';
    prompt += '  5. Exercise 7 (45 seconds) ← Third exercise\n';
    prompt += '  6. Rest (15 seconds) ← Automatic, not counted\n';
    prompt += '  7. Exercise 8 (45 seconds, notes: "Repeat this set 3 times") ← Fourth exercise\n';
    prompt += '  8. Rest (30 seconds) ← Between-set rest\n';
    prompt += '```\n\n';
    prompt += '**❌ WRONG:** Counting Rest as an exercise (that would be 5 items per set)\n';
    prompt += '**✅ CORRECT:** 4 exercises + Rest in between (Rest is automatic, not an exercise)\n\n';
    prompt += '3. **Core Finisher**: 3-4 core exercises (30-45s each). Use DIFFERENT core movements than what appeared in warm-up or main workout (e.g., if main workout had mountain climbers, use Russian twists, dead bugs, or bicycle crunches here instead).\n';
    prompt += '4. **Cool-down**: 3-4 static stretches (30s each). Use DIFFERENT stretches than what appeared earlier (e.g., quad stretch, hamstring stretch, shoulder stretch, spinal twist, child\'s pose, etc.).\n\n';
    prompt += '## Key Requirements\n';
    prompt += '- All exercises need `duration` string (e.g., "45 seconds")\n';
    prompt += '- **MANDATORY: Each set\'s last exercise must have notes: "Repeat this set X times"**\n';
    if (userInfo?.equipment && userInfo.equipment.toLowerCase() !== 'none' && userInfo.equipment.toLowerCase() !== 'bodyweight only') {
        prompt += `- **EQUIPMENT USAGE: Actively use "${userInfo.equipment}" in at least 60-70% of exercises. Be specific about how to use the equipment (e.g., "Dumbbell Goblet Squats", "Resistance Band Rows", "Jump Rope Double-Unders", etc.)**\n`;
    }
    prompt += '- **BOXING FOCUS: Include popular 1-2 boxing drills in each main workout set.\n';
    prompt += '- **INJURY ADAPTATION**: Carefully modify or completely avoid exercises that stress injured areas\n';
    prompt += '- **VARIETY EMPHASIS**: Aim for 80%+ NEW exercises compared to the last workout. Only keep 1-2 core movements if absolutely necessary\n';
    prompt += '- **PROGRESSION**: Based on RPE/feedback, adjust intensity, complexity, or volume appropriately\n';
    prompt += '- **MANDATORY: Provide description on how to perform the exercises in the workout plan\n';


    // Use OpenAI API call with JSON mode
    const requestBody = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `${SAMMI_PERSONA}\n\nRespond with valid JSON matching this schema: ${JSON.stringify(workoutSchema)}\n\nCRITICAL: Main Workout = 2-3 different sets of 3-4 exercises each. Each set's last exercise notes MUST say "Repeat this set X times" where X is capped at maximum 3 repetitions regardless of duration. This is MANDATORY - the workout player depends on this instruction.`
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      temperature: 1.0, // Higher temperature for more variety in workouts
      max_tokens: 2048,
      response_format: { type: "json_object" }
    };

    const response = await fetch('/api-proxy/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    const result = await response.json();
    console.log("generateWorkoutPlan: API response:", result);
    const workoutJsonString = result.choices?.[0]?.message?.content;
    
     if (!workoutJsonString) {
      throw new Error("AI returned an empty response for the workout plan.");
    }
    
    console.log("generateWorkoutPlan: Parsing workout JSON:", workoutJsonString);
    const parsedWorkout = JSON.parse(workoutJsonString);
    console.log("generateWorkoutPlan: Parsed workout:", parsedWorkout);
    
    // Debug: Check if Main Workout phase exists and has circuit format
    const mainWorkoutPhase = parsedWorkout.workout?.phases?.find((phase: any) => phase.name === 'Main Workout');
    if (mainWorkoutPhase) {
      console.log("Main Workout phase found with exercises:", mainWorkoutPhase.exercises.length);
      console.log("Main Workout exercises:", mainWorkoutPhase.exercises.map((ex: any) => ({ name: ex.name, notes: ex.notes })));
    } else {
      console.log("No Main Workout phase found! Available phases:", parsedWorkout.workout?.phases?.map((p: any) => p.name));
    }
    
    return parsedWorkout;
  }, []);

  const handleFindVideo = useCallback(async (topic: string): Promise<Video | null> => {
      try {
        console.log("handleFindVideo: Generating YouTube search for:", topic);
        
        // Clean up the exercise name for better search results
        const cleanTopic = topic
          .replace(/\([^)]*\)/g, '') // Remove parenthetical notes
          .replace(/\d+\s*(seconds?|minutes?|reps?)/gi, '') // Remove duration/rep info
          .trim();
        
        // Create a focused search query for exercise tutorials
        // We'll search for: "exercise name how to proper form tutorial"
        const searchQuery = `${cleanTopic} exercise how to proper form tutorial`;
        const encodedQuery = encodeURIComponent(searchQuery);
        
        // Generate YouTube search URL
        const searchUrl = `https://www.youtube.com/results?search_query=${encodedQuery}`;
        
        console.log("handleFindVideo: Generated search URL:", searchUrl);
        console.log("handleFindVideo: Clean topic:", cleanTopic);
        
        // Return a Video object with the search URL
        // When users click the video button, they'll see YouTube search results
        // filtered for tutorials and proper form videos from reputable channels
        return {
          id: `search_${Date.now()}`,
          title: `${cleanTopic} - Tutorial`,
          watchUrl: searchUrl
        };

      } catch (error) {
        console.error("Error generating video search:", error);
          return null;
      }
  }, []);

  // Direct API call for OpenAI
  const sendDirectApiCall = useCallback(async (text: string): Promise<any> => {
    console.log("sendDirectApiCall: Making direct OpenAI API call");
    console.log("sendDirectApiCall: Request text:", text);
    console.log("sendDirectApiCall: Current user:", currentUser);
    console.log("sendDirectApiCall: User profile:", currentUser?.profile);
    console.log("sendDirectApiCall: Profile exists:", !!currentUser?.profile);
    console.log("sendDirectApiCall: User name:", currentUser?.name);
    console.log("sendDirectApiCall: Profile keys:", currentUser?.profile ? Object.keys(currentUser.profile) : 'No profile');
    console.log("sendDirectApiCall: Full currentUser object:", JSON.stringify(currentUser, null, 2));
    
    // Build system message with user profile
    let systemMessage = SAMMI_PERSONA;
    
    if (currentUser?.profile) {
      systemMessage = `${systemMessage}\n\nUser Profile:\n- Name: ${currentUser.name}\n- Pronouns: ${currentUser.profile.pronouns || 'Not specified'}\n- Age: ${currentUser.profile.age || 'Not specified'}\n- Goals: ${currentUser.profile.goals || 'Not specified'}\n- Activity Level: ${currentUser.profile.activityLevel || 'Not specified'}\n- Injuries/Limitations: ${currentUser.profile.injuries || 'None'}\n- Equipment: ${currentUser.profile.equipment || 'None specified'}`;
    } else if (currentUser?.name) {
      // If user exists but no profile, include at least their name
      systemMessage = `${systemMessage}\n\nUser: ${currentUser.name} (Profile not yet completed - create a general workout that can be adapted to their needs)`;
    }
    
    // Get last 8 messages (4 rounds of conversation) for context
    const recentMessages = messages.slice(-8);
    
    const conversationHistory = recentMessages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
    
    // Add the current message
    const allMessages = [
      ...conversationHistory,
      { role: 'user', content: text }
    ];
    
    try {
    const requestBody = {
      model: "gpt-4o-mini",
      messages: [
          { role: 'system', content: systemMessage },
          ...allMessages
      ],
      temperature: 0.9,
        max_tokens: 1500,
        tools: [
          createWorkoutPlanFunction,
          findBoxingVideoFunction,
          showVideoLibraryFunction,
          createNutritionPlanFunction
        ],
        tool_choice: 'auto'
      };
      
      console.log("sendDirectApiCall: About to fetch from:", '/api-proxy/v1/chat/completions');
    console.log("sendDirectApiCall: Request body:", JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('/api-proxy/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log("sendDirectApiCall: Response status:", response.status);
    console.log("sendDirectApiCall: Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
        console.error("sendDirectApiCall: API error response:", errorText);
        console.error("sendDirectApiCall: Response status:", response.status);
        throw new Error(`API call failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
      console.log("sendDirectApiCall: API result:", JSON.stringify(result, null, 2));
      
      console.log("sendDirectApiCall: Full API result:", JSON.stringify(result, null, 2));
      
    return result;
    } catch (error) {
      console.error("sendDirectApiCall: Error:", error);
      throw error;
    }
  }, [currentUser, messages]);

  // Send message handler
  const sendMessage = useCallback(async (text: string, sender: Sender) => {
    if (!text.trim()) return;

    console.log("Sending message:", { text: text.trim(), sender, timestamp: Date.now() });
    console.log("User agent:", navigator.userAgent);
    console.log("API Key available:", !!process.env.API_KEY);
    console.log("API Key length:", process.env.API_KEY?.length || 0);
    console.log("Connection type:", (navigator as any).connection?.effectiveType || 'unknown');
    console.log("Online status:", navigator.onLine);

    const userMessage: Message = { id: Date.now().toString(), text, sender, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    
    // Scroll to end when user sends a message
    setTimeout(() => scrollToEnd(), 100);

    try {
        const isMobileSafari = /iPhone|iPad|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/.test(navigator.userAgent);
        
        console.log("Mobile Safari Detection:", {
            userAgent: navigator.userAgent,
            isMobileSafari,
            isIPhone: /iPhone/.test(navigator.userAgent),
            isSafari: /Safari/.test(navigator.userAgent),
            isChrome: /Chrome|CriOS|FxiOS/.test(navigator.userAgent)
        });
        
        // Use direct OpenAI API call for all browsers
        console.log("Using direct OpenAI API call");
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 30000);
        });

        const responsePromise = sendDirectApiCall(text);
        const response = await Promise.race([responsePromise, timeoutPromise]);
        console.log("sendMessage: Full OpenAI response:", JSON.stringify(response, null, 2));
        console.log("sendMessage: Response choices:", response.choices);
        console.log("sendMessage: Response message:", response.choices?.[0]?.message);
        
        // Add a timestamp to track request timing
        const requestId = Date.now() + Math.random();
        console.log(`sendMessage: Processing request ${requestId} for: "${text.substring(0, 50)}..."`);
        
        // Parse OpenAI response format
        const toolCalls = response.choices?.[0]?.message?.tool_calls || [];
        console.log("sendMessage: Tool calls found:", toolCalls.length);
        console.log("sendMessage: Tool call names:", toolCalls.map(tc => tc.function?.name));
        
        // Check for duplicate tool calls
        const uniqueToolCalls = toolCalls.filter((tc, index, self) => 
          index === self.findIndex(t => t.function?.name === tc.function?.name)
        );
        if (toolCalls.length !== uniqueToolCalls.length) {
          console.warn("sendMessage: Duplicate tool calls detected!", {
            original: toolCalls.length,
            unique: uniqueToolCalls.length
          });
        }
        
        // Use only unique tool calls to prevent duplicate processing
        const finalToolCalls = uniqueToolCalls;
        const workoutToolCall = finalToolCalls.find(tc => tc.function?.name === 'createWorkoutPlan');
        const videoToolCall = finalToolCalls.find(tc => tc.function?.name === 'findBoxingVideo');
        const videoLibraryToolCall = finalToolCalls.find(tc => tc.function?.name === 'showVideoLibrary');
        const nutritionToolCall = finalToolCalls.find(tc => tc.function?.name === 'createNutritionPlan');


        if (nutritionToolCall) {
            try {
                const args = JSON.parse(nutritionToolCall.function.arguments);
                const goal = args.goal as string | undefined;
                const dietaryRestrictions = args.dietaryRestrictions as string | undefined;
                const duration = args.duration as string | undefined;
                
                const nutritionPlanText = await generateNutritionPlan({ goal, dietaryRestrictions, duration, userInfo: currentUser?.profile, journalEntries });

                const sammiResponse: Message = {
                    id: (Date.now() + 1).toString(),
                    text: nutritionPlanText,
                    sender: 'sammi',
                    timestamp: Date.now(),
                };
                
                console.log("sendMessage: Adding nutrition response to messages");
                setMessages(prev => [...prev, sammiResponse]);

            } catch (e) {
                console.error("Nutrition plan generation from tool call failed:", e);
                const errorMessage = "I'm having trouble creating your meal plan right now. Let's try that again in a moment.";
                setError(errorMessage);
                const errorResponse: Message = { id: (Date.now() + 1).toString(), text: errorMessage, sender: 'sammi', timestamp: Date.now() };
                setMessages(prev => [...prev, errorResponse]);
            }
        } else if (workoutToolCall) {
            console.log("sendMessage: Processing workout tool call");
            setIsGeneratingWorkout(true);
            try {
                const args = JSON.parse(workoutToolCall.function.arguments);
                const duration = args.duration as string | undefined;
                const userRequest = args.userRequest as string | undefined;
                console.log("sendMessage: Workout tool call args:", args);
                console.log("sendMessage: User's specific request:", userRequest);
                
                const lastCompletedWorkoutMessage = messages
                  .slice()
                  .reverse()
                  .find(msg => msg.workoutPlan && msg.isWorkoutCompleted);

                console.log("sendMessage: Calling generateWorkoutPlan with duration:", duration, "and userRequest:", userRequest);
                const workoutPlan = await generateWorkoutPlan({ 
                  duration, 
                  userRequest,
                  lastWorkoutMessage: lastCompletedWorkoutMessage, 
                  userInfo: currentUser?.profile, 
                  journalEntries 
                });
                console.log("sendMessage: Generated workout plan:", workoutPlan);
                
                const sammiResponse: Message = {
                    id: (Date.now() + 1).toString(),
                    text: workoutPlan.summary,
                    sender: 'sammi',
                    workoutPlan: workoutPlan,
                    timestamp: Date.now(),
                };
                
                console.log("sendMessage: Adding workout response to messages:", sammiResponse);
                setMessages(prev => [...prev, sammiResponse]);

            } catch (e) {
                console.error("Workout generation from tool call failed:", e);
                const errorMessage = "I'm having trouble creating your workout right now. Let's try that again in a moment.";
                setError(errorMessage);
                const errorResponse: Message = { id: (Date.now() + 1).toString(), text: errorMessage, sender: 'sammi', timestamp: Date.now() };
                setMessages(prev => [...prev, errorResponse]);
            } finally {
                setIsGeneratingWorkout(false);
            }
        } else if (videoToolCall) {
            const args = JSON.parse(videoToolCall.function.arguments);
            const topic = args.topic as string;
            
            try {
                const foundVideo = await handleFindVideo(topic);
                
                if (foundVideo) {
                    const sammiResponse: Message = {
                        id: (Date.now() + 1).toString(),
                        text: `I found a great video on "${topic}". Click the button below to watch it!`,
                        sender: 'sammi',
                        video: foundVideo,
                        timestamp: Date.now(),
                    };
                    console.log("sendMessage: Adding video response to messages");
                    setMessages(prev => [...prev, sammiResponse]);

                } else {
                    const sammiResponse: Message = {
                        id: (Date.now() + 1).toString(),
                        text: `I'm having trouble finding a specific video for "${topic}" right now, but that's okay! We can try searching for something else, or I can guide you through it step by step.`,
                        sender: 'sammi',
                        timestamp: Date.now(),
                    };
                    console.log("sendMessage: Adding video response to messages");
                    setMessages(prev => [...prev, sammiResponse]);
                }
            } catch (e) {
                console.error("Video search from tool call failed:", e);
                const errorMessage = "I'm having trouble finding that video right now. Let's try again in a moment.";
                const errorResponse: Message = { id: (Date.now() + 1).toString(), text: errorMessage, sender: 'sammi', timestamp: Date.now() };
                setMessages(prev => [...prev, errorResponse]);
            }
        } else if (videoLibraryToolCall) {
            setShowVideoLibrary(true);
            const sammiResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: "I've pulled up the video library for you. Choose what interests you and let's get moving!",
                sender: 'sammi',
                timestamp: Date.now(),
            };
            console.log("sendMessage: Adding video library response to messages");
            setMessages(prev => [...prev, sammiResponse]);
        } else {
            // Handle regular text response from OpenAI
            const responseText = response.choices?.[0]?.message?.content || response.text || "Sorry, I couldn't process that request.";
            
            const sammiResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: responseText,
                sender: 'sammi',
                timestamp: Date.now(),
            };
            
            const workoutPlan = parseWorkoutJson(responseText);
            if (workoutPlan) {
                sammiResponse.workoutPlan = workoutPlan;
            }
            
            console.log("sendMessage: Adding text response to messages");
            setMessages(prev => [...prev, sammiResponse]);
        }

    } catch (e) {
      console.error("Send message error:", e);
      console.error("Error details:", {
        name: e.name,
        message: e.message,
        stack: e.stack,
        userAgent: navigator.userAgent
      });
      
      let errorMessage = "I'm having a bit of trouble connecting right now. Let's take a moment and try again.";
      
      // Provide more specific error messages for mobile users
      if (e.message?.includes('fetch')) {
        errorMessage = "Network connection issue. Please check your internet connection and try again.";
      } else if (e.message?.includes('API') || e.message?.includes('key')) {
        errorMessage = "API configuration issue. Please refresh the page and try again.";
      } else if (e.message?.includes('CORS')) {
        errorMessage = "Browser security issue. Please try refreshing the page.";
      } else if (e.message?.includes('Failed to fetch') || e.message?.includes('network')) {
        errorMessage = "Network error: " + e.message;
      } else if (e.message?.includes('timeout')) {
        errorMessage = "Request timed out. Please try again.";
      } else {
        errorMessage = `Connection error: ${e.message || 'Unknown error'}`;
      }
      
      setError(errorMessage);
       const errorResponse: Message = { id: (Date.now() + 1).toString(), text: errorMessage, sender: 'sammi', timestamp: Date.now() };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  }, [generateWorkoutPlan, handleFindVideo, messages, currentUser, generateNutritionPlan, journalEntries]);

  const handleOnboardingSubmit = async (data: OnboardingData) => {
    if (!currentUser) {
        setError("An error occurred. Please try logging in again.");
        setIsOnboarding(false);
        return;
    }

    const updatedUser = { ...currentUser, profile: data };
    setCurrentUser(updatedUser);
    localStorage.setItem('soulGoodFitnessUser', JSON.stringify(updatedUser));
    
    setIsOnboarding(false);
    setMessages([]);
    setIsLoading(true);

    // Initialize the chat with the new profile.
    initChat([], updatedUser.profile);

    // Add a welcome message
    const welcomeMessage: Message = {
            id: `welcome-${Date.now()}`,
        text: `Welcome to Soul Good Fitness, ${updatedUser.name}! I'm Sammi, your personal fitness coach. I'm here to help you reach your goals. What would you like to work on today?`,
            sender: 'sammi',
            timestamp: Date.now(),
        };
        
    setMessages([welcomeMessage]);
        setIsLoading(false);
  };

  const handleStartWorkout = (plan: WorkoutPlan, messageId: string) => {
    setActiveWorkoutInfo({ plan, messageId });
  };

  const handleCloseWorkout = () => {
    setActiveWorkoutInfo(null);
  };

  const handleWorkoutComplete = useCallback(() => {
    if (!activeWorkoutInfo) return;

    const { messageId } = activeWorkoutInfo;

    setMessages(msgs =>
        msgs.map(msg =>
            msg.id === messageId ? { ...msg, isWorkoutCompleted: true } : msg
        )
    );
  }, [activeWorkoutInfo]);

  const handleSubmitFeedback = useCallback((feedbackData: { rpe: number; text: string }) => {
      if (!activeWorkoutInfo) return;
      
      const { messageId } = activeWorkoutInfo;
      const { rpe, text } = feedbackData;

      // Update the original workout message with the feedback data
      setMessages(prev =>
          prev.map(msg => 
              msg.id === messageId 
              ? { ...msg, rpe: rpe, feedback: text } 
              : msg
          )
      );
      
      // Add a celebration message instead of sending feedback to AI
      const celebrationMessage: Message = {
        id: `celebration-${Date.now()}`,
        text: `🎉 Amazing work completing your workout! You rated it ${rpe}/10. ${text ? 'Your feedback: "' + text + '"' : "Great job pushing through!"} Keep up the fantastic work! 💪`,
        sender: 'sammi',
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, celebrationMessage]);

      // Close the workout player UI
      handleCloseWorkout();
  }, [activeWorkoutInfo]);

  const handleSelectVideo = (video: Video) => {
    setShowVideoLibrary(false);
    setActiveVideo(video);
  };

  const handleCloseVideoLibrary = () => {
    setShowVideoLibrary(false);
  };

  const handleCloseVideoPlayer = () => {
      setActiveVideo(null);
  }
  
  const handleAddJournalEntry = (text: string) => {
    if (!text.trim()) return;
    const newEntry: JournalEntry = {
        id: Date.now().toString(),
        text: text.trim(),
        timestamp: Date.now()
    };
    setJournalEntries(prev => [newEntry, ...prev]);
  };
  
  const handleDayReview = () => {
    const journalContext = journalEntries.length > 0 
        ? `Also, consider my recent private journal entries for context if they're relevant:\n` + journalEntries.slice(0, 5).map(e => `- ${new Date(e.timestamp).toLocaleDateString()}: "${e.text}"`).join('\n')
        : '';
    
    const reviewPrompt = `Sammi, give me a review of my day's activities from our chat over the last 24 hours. Point out what I did well and get me fired up for tomorrow. ${journalContext}`;
    
    sendMessage(reviewPrompt, 'user');
  };

  useEffect(() => {
    // Mark initialization complete after first render
    setIsInitializing(false);
  }, []);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-orange-700 font-semibold">Loading Soul Good Boxing...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (isOnboarding) {
    return <OnboardingScreen onSubmit={handleOnboardingSubmit} currentUser={currentUser} />;
  }

  return (
    <>
      <div className="flex flex-col h-[100dvh] bg-gray-50 text-gray-800 font-sans">
        <Header currentUser={currentUser} onLogout={handleLogout} />
        <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-4 sm:px-6 pb-4 overflow-hidden">
          <ChatWindow
            ref={chatWindowRef}
            messages={displayedMessages}
            isLoading={isLoading}
            isGeneratingWorkout={isGeneratingWorkout}
            onStartWorkout={handleStartWorkout}
            currentUser={currentUser}
            onFindVideo={handleFindVideo}
          />
          <div className="flex-shrink-0 pt-4">
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isTopicsVisible ? 'max-h-48' : 'max-h-0'}`}>
                <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                    <TopicButton
                        topic="🥊 Workout of the Day"
                        onClick={() => {
                            sendMessage("Give me a workout of the day, based on my profile.", 'user');
                            scrollToEnd();
                        }}
                        disabled={isLoading}
                    />
                    <TopicButton
                        topic="🥗 Nutritional Tips"
                        onClick={() => {
                            sendMessage("Can you give me a quick nutritional tip for fitness?", 'user');
                            scrollToEnd();
                        }}
                        disabled={isLoading}
                    />
                    <TopicButton
                        topic="☀️ Day's Review"
                        onClick={() => {
                            handleDayReview();
                            scrollToEnd();
                        }}
                        disabled={isLoading}
                    />
                    <TopicButton
                        topic="📓 My Journal"
                        onClick={() => {
                            setShowJournal(true);
                            scrollToEnd();
                        }}
                        disabled={isLoading}
                    />
                    <TopicButton
                        topic="🍱 Today's Meal Plan"
                        onClick={() => {
                            sendMessage("Show me my meal plan for today. If a weekly plan was recently made, use that. Otherwise, create a new one for today.", 'user');
                            scrollToEnd();
                        }}
                        disabled={isLoading}
                    />
                    <TopicButton
                        topic="📅 Weekly Meal Plan"
                        onClick={() => {
                            sendMessage("Create a meal plan for the week.", 'user');
                            scrollToEnd();
                        }}
                        disabled={isLoading}
                    />
                  </div>
              </div>
              <div className="flex items-start gap-2">
                  <div className="flex-grow">
                    <MessageInput onSendMessage={(text) => sendMessage(text, 'user')} isLoading={isLoading} />
                  </div>
                   <button
                        onClick={() => setIsTopicsVisible(!isTopicsVisible)}
                        disabled={isLoading}
                        aria-label={isTopicsVisible ? 'Hide topics' : 'Show topics'}
                        className="flex-shrink-0 p-2 sm:p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-300 rounded-lg text-orange-700 hover:from-orange-100 hover:to-amber-100 hover:border-orange-400 transition-all duration-200 disabled:opacity-50 relative group"
                        title={isTopicsVisible ? 'Hide topics' : 'Show topics'}
                    >
                       {isTopicsVisible ? <ChevronUpIcon /> : <ChevronDownIcon />}
                       {/* Mobile tooltip */}
                       <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none sm:hidden whitespace-nowrap">
                           {isTopicsVisible ? 'Hide topics' : 'Show topics'}
                       </div>
                    </button>
              </div>
          </div>
        </div>
      </div>
      {activeWorkoutInfo && (
        <WorkoutPlayer 
            workout={activeWorkoutInfo.plan} 
            onClose={handleCloseWorkout}
            onComplete={handleWorkoutComplete}
            onSubmitFeedback={handleSubmitFeedback}
            onFindVideo={handleFindVideo}
        />
      )}
      {showVideoLibrary && (
        <VideoLibrary
            onClose={handleCloseVideoLibrary}
            onSelectVideo={handleSelectVideo}
        />
      )}
      {activeVideo && (
        <VideoPlayer video={activeVideo} onClose={handleCloseVideoPlayer} />
      )}
      {showJournal && (
        <Journal 
            entries={journalEntries}
            onClose={() => setShowJournal(false)}
            onAddEntry={handleAddJournalEntry}
        />
      )}
    </>
  );
};

export default App;
// Force deployment Sun Oct  5 22:37:22 EDT 2025
// Deployment timestamp: Sun Oct  5 22:43:32 EDT 2025
// Build trigger: 1759718733
// Fresh build trigger: 1759719761
