
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
// OpenAI integration - no client library needed, using direct API calls
import type { Message, Sender, OnboardingData, User, WorkoutPlan, Video, JournalEntry } from './types';
import { SAMMI_PERSONA } from './constants';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
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
    name: 'createWorkoutPlan',
    description: 'Creates a detailed, boxing-inspired workout plan when the user explicitly asks for one.',
    parameters: {
        type: 'object',
        properties: {
            duration: {
                type: 'string',
                description: 'The desired total duration of the workout, e.g., "30 minutes". If not specified, a standard workout of the day is created.'
            },
        },
    },
};

const findBoxingVideoFunction = {
    name: 'findBoxingVideo',
    description: 'Finds a relevant boxing tutorial video on YouTube when a user asks for one.',
    parameters: {
        type: 'object',
        properties: {
            topic: {
                type: 'string',
                description: 'The specific boxing technique or topic the user wants a video for (e.g., "jab", "footwork", "uppercut").'
            }
        },
        required: ['topic']
    },
};

const showVideoLibraryFunction = {
    name: 'showVideoLibrary',
    description: 'Shows the user the library of pre-selected video drills and tutorials when they ask to see the video list or library.',
    parameters: {
        type: 'object',
        properties: {},
    },
};

const createNutritionPlanFunction = {
    name: 'createNutritionPlan',
    description: 'Creates a personalized nutrition plan when a user asks for a diet plan, meal plan, or a structured list of what to eat.',
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
    },
};


const App: React.FC = () => {
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

  const displayedMessages = useMemo(() => {
    return pruneHistoryToLast24Hours(messages);
  }, [messages]);

  const initChat = (historyMessages: Message[], userProfile?: OnboardingData) => {
    try {
      if (!process.env.API_KEY) {
        console.error("API_KEY environment variable not set");
        console.error("Available env vars:", Object.keys(process.env).filter(key => key.includes('API') || key.includes('OPENAI')));
        throw new Error("API_KEY environment variable not set");
      }
      
      console.log("InitChat - OpenAI integration ready");
      console.log("InitChat - API Key available:", !!process.env.API_KEY);
      console.log("InitChat - API Key length:", process.env.API_KEY?.length || 0);
      
      // OpenAI uses direct API calls - no client initialization needed
      setError(null);
      console.log("OpenAI chat initialized successfully");
    } catch (e) {
      console.error(e);
      setError("Failed to initialize the AI. Please check the API key.");
    }
  };

  useEffect(() => {
    const storedUserJson = localStorage.getItem('soulGoodBoxingUser');
    if (storedUserJson) {
      const user: User = JSON.parse(storedUserJson);
      const storedMessages = localStorage.getItem(`chatHistory_${user.id}`);
      const storedJournal = localStorage.getItem(`journalEntries_${user.id}`);

      if (storedJournal) {
          setJournalEntries(JSON.parse(storedJournal));
      }

      if (storedMessages) {
        const allMessages: Message[] = JSON.parse(storedMessages);
        const recentMessages = pruneHistoryToLastNCompletedWorkouts(allMessages, 14);

        setMessages(recentMessages);
        setCurrentUser(user);
        initChat(recentMessages, user.profile);
      } else {
        // This case handles a user who logged in but didn't finish onboarding
        setCurrentUser(user);
        setIsOnboarding(!user.profile); // Go to onboarding if profile is missing
        setMessages([]);
      }
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
    const storedUserJson = localStorage.getItem('soulGoodBoxingUser');
    let fullUser = user;
    if(storedUserJson){
        const storedUser = JSON.parse(storedUserJson);
        if(storedUser.id === user.id && storedUser.profile){
            fullUser = storedUser;
        }
    }
    
    localStorage.setItem('soulGoodBoxingUser', JSON.stringify(fullUser));
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
    localStorage.removeItem('soulGoodBoxingUser');
    setCurrentUser(null);
    setMessages([]);
    setJournalEntries([]);
    chatRef.current = null;
    setIsOnboarding(false);
  };
  
  const generateNutritionPlan = useCallback(async (options: {
      goal?: string;
      dietaryRestrictions?: string;
      duration?: string;
      userInfo?: OnboardingData;
      journalEntries?: JournalEntry[];
  }): Promise<string> => {
      if (!aiRef.current) {
          throw new Error("AI Client not initialized.");
      }

      const { goal, dietaryRestrictions, duration, userInfo, journalEntries } = options;
      
      let prompt = `Your task is to act as Sammi, a boxing coach, and create a practical, personalized nutritional plan for a client. The output MUST be well-structured markdown.\n\n`;

      // User Profile Section
      prompt += '## User Profile\n';
      if (userInfo) {
          prompt += `- Primary Goal: ${userInfo.goals || 'Not specified'}\n`;
          prompt += `- Activity Level: ${userInfo.activityLevel || 'Not specified'}\n`;
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
          prompt += "3.  **Boxing Context:** Frame advice for an athlete. Mention things like pre-workout fuel or post-workout recovery when appropriate.\n";
          prompt += "4.  **Tone:** Maintain Sammi's energetic, motivating, and no-nonsense voice.\n";
          prompt += "5.  **Sign-off:** End with a sharp, boxing-related sign-off like 'Stay hungry, champ.' or 'Fuel up, fight hard.'\n";
      } else { // For a single day plan
          prompt += "1.  **Structure:** Organize the plan with Level 3 Markdown Headings (e.g., `### Breakfast`) for 'Breakfast', 'Lunch', 'Dinner', and 'Snacks'. Provide 2-3 simple meal/snack ideas as an unordered list (`-`) for each.\n";
          prompt += "2.  **Personalization:** Tailor suggestions to the user's profile. Briefly explain the benefit of a food choice in the context of their training (e.g., 'Greek yogurt: excellent source of protein for muscle recovery.').\n";
          prompt += "3.  **Boxing Context:** Frame advice for an athlete. Mention pre-workout fuel or post-workout recovery.\n";
          prompt += "4.  **Tone:** Maintain Sammi's energetic, motivating, and no-nonsense voice.\n";
          prompt += "5.  **Sign-off:** End with a sharp, boxing-related sign-off like 'Stay hungry, champ.' or 'Fuel up, fight hard.'\n";
      }

      const response = await aiRef.current.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
              systemInstruction: SAMMI_PERSONA,
          },
      });

      return response.text;
  }, [currentUser?.profile]);

  const generateWorkoutPlan = useCallback(async (options: {
      duration?: string;
      lastWorkoutMessage?: Message;
      userInfo?: OnboardingData;
      journalEntries?: JournalEntry[];
  }): Promise<WorkoutPlan> => {
    if (!aiRef.current) {
        throw new Error("AI Client not initialized.");
    }

    const { duration, lastWorkoutMessage, userInfo, journalEntries } = options;
    
    let prompt = 'Your task is to create a personalized, boxing-inspired workout plan.\n\n';

    // User Profile Section
    prompt += '## User Profile\n';
    if (userInfo) {
        prompt += `- Activity Level: ${userInfo.activityLevel || 'Not specified'}\n`;
        prompt += `- Injuries/Concerns: ${userInfo.injuries || 'None'}\n`;
        prompt += `- Goals: ${userInfo.goals || 'Not specified'}\n`;
        prompt += `- Equipment: ${userInfo.equipment || 'Bodyweight only'}\n\n`;
    } else {
        prompt += '- No user profile data available. Create a general workout.\n\n';
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
        const lastWorkoutExercises = lastWorkoutMessage.workoutPlan.workout.phases
            .flatMap(phase => phase.exercises.map(ex => ex.name.toLowerCase()))
            .filter(name => name !== 'rest'); // Don't include 'Rest' in the list
        const uniqueLastExercises = [...new Set(lastWorkoutExercises)];
        prompt += `- Exercises from last workout to vary from: ${uniqueLastExercises.join(', ')}\n`;

    } else {
        prompt += `This is the user's first workout. Create a plan based on their profile.\n`;
    }

    if (duration) {
        prompt += `- Target Duration: ${duration}\n`;
    }

    // Instructions and Constraints Section
    prompt += '\n## Instructions & Constraints\n';
    prompt += "1.  **Safety First:** If the user has listed injuries, you MUST provide safe modifications or avoid exercises that would strain these areas. Modifications MUST be clearly stated in the exercise's `notes` field. For example, for a 'knee injury', a 'Squat' could be modified with a note like 'Partial Squat: only go as deep as is comfortable without pain.'\n";
    prompt += "2.  **Adapt to Requests & Injuries:**\n    - If the user's request is specific (e.g., 'upper body workout'), the 'Main Workout' phase MUST reflect this focus.\n    - Adapt intelligently to injuries. If an upper body injury is noted, create a lower-body and core-focused workout. If a lower body injury is noted, create an upper-body and core-focused workout. The goal is to train around the injury safely.\n";
    prompt += "3.  **Workout Structure:** The workout MUST strictly follow this structure: \n    - A 'Warm-up' phase with 4-6 dynamic exercises.\n    - A 'Main Workout' circuit repeated for 3 rounds, with 3-4 exercises per round.\n    - A 'Core Finisher' circuit repeated for 2 rounds, with 3-4 core exercises.\n    - A 'Cool-down' phase with 3-4 static stretches.\n";
    prompt += "4.  **Duration is Mandatory:** EVERY exercise, including warm-ups, main exercises, core work, and cool-down stretches, MUST have a valid `duration` string (e.g., \"45 seconds\", \"1 minute\"). For exercises based on repetitions (e.g., '10 reps'), provide a reasonable estimated duration. For exercises that are purely timed (like planks), `reps` should be 'N/A' and `sets` should be 1.\n";
    prompt += "5.  **Rest Periods:** You MUST add a separate exercise object named 'Rest' with its own duration after each work exercise in the 'Main Workout' and 'Core Finisher' phases. Do not add rest in the 'Warm-up' or 'Cool-down' phases.\n";
    prompt += "6.  **Exercise Variety:** To keep workouts engaging, you MUST ensure variety. For the 'Warm-up', 'Main Workout', and 'Core Finisher' phases, at least 50% of the exercises MUST be different from the exercises in the user's last workout (provided in the 'Workout Request' section). You can reuse foundational exercises like 'Jumping Jacks' or 'Plank' but should prioritize introducing new movements or variations.\n";
    prompt += "7.  **Apply Progressive Overload:** The new workout MUST be a slight progression in difficulty from the last one. Refer to the user's last workout details and their RPE/feedback. Apply one or more of the following principles subtly:\n    - For strength exercises, increase reps by 1-2 (e.g., '10 Push-ups' becomes '12 Push-ups').\n    - For timed exercises, increase duration by 5-15 seconds (e.g., '45 second Plank' becomes '1 minute Plank').\n    - If an exercise from the last workout is repeated, suggest a harder variation or add a note about increasing weight if applicable (e.g., 'Bodyweight Squat' could become 'Jump Squat', or a note 'Use slightly heavier dumbbells if available' can be added).\n    - Slightly decrease rest time between exercises (e.g., from '30 seconds' to '25 seconds').\n    This progression should be challenging but achievable. If the user's last RPE was very high (9-10), the progression should be minimal or focus on form improvement rather than increased load.\n";


    const response = await aiRef.current.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: workoutSchema,
            systemInstruction: SAMMI_PERSONA,
        },
    });
    const workoutJsonString = response.text;
     if (!workoutJsonString) {
      throw new Error("AI returned an empty response for the workout plan.");
    }
    return JSON.parse(workoutJsonString);
  }, []);

  const handleFindVideo = useCallback(async (topic: string): Promise<Video | null> => {
      if (!aiRef.current) {
          throw new Error("AI Client not initialized.");
      }
      try {
        const prompt = `Find a high-quality, embeddable YouTube video tutorial for boxing ${topic}, preferably taught by a female instructor. Prioritize reputable trainers.`;

        const response = await aiRef.current.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            },
        });

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (groundingChunks) {
            for (const chunk of groundingChunks) {
                if (chunk.web?.uri) {
                    const videoId = getYouTubeIdFromUrl(chunk.web.uri);
                    if (videoId) {
                        return { id: videoId, title: chunk.web.title || `Boxing: ${topic}`, watchUrl: chunk.web.uri };
                    }
                }
            }
        }
        
        const textResponse = response.text;
        const urlRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11})/g;
        const match = textResponse.match(urlRegex);
        if (match && match[0]) {
            const url = match[0];
            const videoId = getYouTubeIdFromUrl(url);
            if (videoId) {
                 return { id: videoId, title: `Boxing Tutorial: ${topic}`, watchUrl: url };
            }
        }

        console.warn("Could not find a YouTube video for the topic:", topic);
        return null;

      } catch (error) {
          console.error("Error finding video with Google Search:", error);
          return null;
      }
  }, []);

  // Direct API call for OpenAI
  const sendDirectApiCall = async (text: string): Promise<any> => {
    console.log("sendDirectApiCall: Making direct OpenAI API call");
    console.log("sendDirectApiCall: Request text:", text);
    
    const requestBody = {
      model: "llama-3.1-70b-versatile", // Groq model - much faster and free tier available
      messages: [
        {
          role: "system",
          content: SAMMI_PERSONA
        },
        {
          role: "user", 
          content: text
        }
      ],
      temperature: 0.9,
      max_tokens: 2048,
      tools: [{
        type: "function",
        function: createWorkoutPlanFunction
      }, {
        type: "function", 
        function: findBoxingVideoFunction
      }, {
        type: "function",
        function: showVideoLibraryFunction
      }, {
        type: "function",
        function: createNutritionPlanFunction
      }]
    };
    
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
      console.error("sendDirectApiCall: Error response:", errorText);
      throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log("sendDirectApiCall: Success response:", result);
    return result;
  };
  
  const sendMessage = useCallback(async (text: string, sender: Sender) => {
    if (!text.trim()) return;

    console.log("Sending message:", { text: text.trim(), sender, timestamp: Date.now() });
    console.log("User agent:", navigator.userAgent);
    console.log("API Key available:", !!process.env.API_KEY);
    console.log("API Key length:", process.env.API_KEY?.length || 0);
    console.log("Connection type:", navigator.connection?.effectiveType || 'unknown');
    console.log("Online status:", navigator.onLine);

    const userMessage: Message = { id: Date.now().toString(), text, sender, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

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
        // Parse OpenAI response format
        const toolCalls = response.choices?.[0]?.message?.tool_calls || [];
        const workoutToolCall = toolCalls.find(tc => tc.function?.name === 'createWorkoutPlan');
        const videoToolCall = toolCalls.find(tc => tc.function?.name === 'findBoxingVideo');
        const videoLibraryToolCall = toolCalls.find(tc => tc.function?.name === 'showVideoLibrary');
        const nutritionToolCall = toolCalls.find(tc => tc.function?.name === 'createNutritionPlan');


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
                
                setMessages(prev => [...prev, sammiResponse]);

            } catch (e) {
                console.error("Nutrition plan generation from tool call failed:", e);
                const errorMessage = "My bad, champ. Got my signals crossed on that meal plan. Let's try that again.";
                setError(errorMessage);
                const errorResponse: Message = { id: (Date.now() + 1).toString(), text: errorMessage, sender: 'sammi', timestamp: Date.now() };
                setMessages(prev => [...prev, errorResponse]);
            }
        } else if (workoutToolCall) {
            setIsGeneratingWorkout(true);
            try {
                const args = JSON.parse(workoutToolCall.function.arguments);
                const duration = args.duration as string | undefined;
                
                const lastCompletedWorkoutMessage = messages
                  .slice()
                  .reverse()
                  .find(msg => msg.workoutPlan && msg.isWorkoutCompleted);

                const workoutPlan = await generateWorkoutPlan({ duration, lastWorkoutMessage: lastCompletedWorkoutMessage, userInfo: currentUser?.profile, journalEntries });
                
                const sammiResponse: Message = {
                    id: (Date.now() + 1).toString(),
                    text: workoutPlan.summary,
                    sender: 'sammi',
                    workoutPlan: workoutPlan,
                    timestamp: Date.now(),
                };
                
                setMessages(prev => [...prev, sammiResponse]);

            } catch (e) {
                console.error("Workout generation from tool call failed:", e);
                const errorMessage = "Sorry, champ. I hit a snag putting that workout together. My wires must've gotten crossed. Let's try that again.";
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
                    setActiveVideo(foundVideo);
                    const sammiResponse: Message = {
                        id: (Date.now() + 1).toString(),
                        text: `Alright, I found a solid video on "${topic}". I've pulled it up for you. Give it a watch and let's get those reps in! Stay sharp!`,
                        sender: 'sammi',
                        timestamp: Date.now(),
                    };
                    setMessages(prev => [...prev, sammiResponse]);

                } else {
                    const sammiResponse: Message = {
                        id: (Date.now() + 1).toString(),
                        text: `Looks like my usual go-to for "${topic}" isn't pulling up a direct hit right now, but don't sweat it! We can try searching for something else, or I can walk you through it. Let's keep those hands up!`,
                        sender: 'sammi',
                        timestamp: Date.now(),
                    };
                    setMessages(prev => [...prev, sammiResponse]);
                }
            } catch (e) {
                console.error("Video search from tool call failed:", e);
                const errorMessage = "I couldn't look up that video for you, champ. The connection must be on the ropes. Let's try again in a sec.";
                const errorResponse: Message = { id: (Date.now() + 1).toString(), text: errorMessage, sender: 'sammi', timestamp: Date.now() };
                setMessages(prev => [...prev, errorResponse]);
            }
        } else if (videoLibraryToolCall) {
            setShowVideoLibrary(true);
            const sammiResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: "Okay, champ. I've pulled up the video library for you. Pick a drill and let's get to work!",
                sender: 'sammi',
                timestamp: Date.now(),
            };
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
      
      let errorMessage = "Sorry, champ. I'm having a bit of trouble connecting. Let's take a quick breather and try again in a moment.";
      
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
    localStorage.setItem('soulGoodBoxingUser', JSON.stringify(updatedUser));
    
    setIsOnboarding(false);
    setMessages([]);
    setIsLoading(true);

    // Initialize the chat with the new profile.
    initChat([], updatedUser.profile);

    try {
        if (!chatRef.current) throw new Error("Chat session not initialized.");
        
        // This internal prompt is sent to the AI but not displayed to the user.
        // It instructs the AI to generate a personalized welcome message.
        const internalPrompt = `INTERNAL SYSTEM PROMPT: You are Sammi. The user (${updatedUser.name}) just finished their onboarding. Their profile details are now in your system instructions. Your task is to craft a welcome message. Greet them by name, briefly and naturally acknowledge theirmain goal or experience level, and ask what they want to do first. This is your first interaction with them.`;
        
        const response = await chatRef.current.sendMessage({ message: internalPrompt });
        
        const sammiMessage: Message = {
            id: `welcome-${Date.now()}`,
            text: response.text,
            sender: 'sammi',
            timestamp: Date.now(),
        };
        
        // The chat history for the AI now includes the internal prompt and its response.
        // We only display the response to the user.
        setMessages([sammiMessage]);

    } catch (e) {
      console.error("Failed to fetch welcome message:", e);
      const errorMessage = "Sorry, champ. I'm having a bit of trouble connecting. Let's take a quick breather and try again in a moment.";
      setError(errorMessage);
       const errorResponse: Message = { id: (Date.now() + 1).toString(), text: errorMessage, sender: 'sammi', timestamp: Date.now() };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
        setIsLoading(false);
    }
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
      
      // Create a new follow-up message from the user to send to the AI
      const feedbackMessageText = `My feedback for the last workout (rated ${rpe}/10): ${text || "No additional comments."}`;
      sendMessage(feedbackMessageText, 'user');

      // Close the workout player UI
      handleCloseWorkout();
  }, [activeWorkoutInfo, sendMessage]);

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

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (isOnboarding) {
    return <OnboardingScreen onSubmit={handleOnboardingSubmit} currentUser={currentUser} />;
  }

  return (
    <>
      <div className="flex flex-col h-[100dvh] bg-zinc-900 text-gray-100 font-sans">
        <Header currentUser={currentUser} onLogout={handleLogout} />
        <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-4 sm:px-6 pb-4 overflow-hidden">
          <ChatWindow
            messages={displayedMessages}
            isLoading={isLoading}
            isGeneratingWorkout={isGeneratingWorkout}
            onStartWorkout={handleStartWorkout}
            currentUser={currentUser}
          />
          <div className="flex-shrink-0 pt-4">
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isTopicsVisible ? 'max-h-48' : 'max-h-0'}`}>
                <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                    <TopicButton
                        topic="🥊 Workout of the Day"
                        onClick={() => sendMessage("Give me a workout of the day, based on my profile.", 'user')}
                        disabled={isLoading}
                    />
                    <TopicButton
                        topic="🥗 Nutritional Tips"
                        onClick={() => sendMessage("Can you give me a quick nutritional tip for boxing?", 'user')}
                        disabled={isLoading}
                    />
                    <TopicButton
                        topic="☀️ Day's Review"
                        onClick={handleDayReview}
                        disabled={isLoading}
                    />
                    <TopicButton
                        topic="📓 My Journal"
                        onClick={() => setShowJournal(true)}
                        disabled={isLoading}
                    />
                    <TopicButton
                        topic="🍱 Today's Meal Plan"
                        onClick={() => sendMessage("Show me my meal plan for today. If a weekly plan was recently made, use that. Otherwise, create a new one for today.", 'user')}
                        disabled={isLoading}
                    />
                    <TopicButton
                        topic="📅 Weekly Meal Plan"
                        onClick={() => sendMessage("Create a meal plan for the week.", 'user')}
                        disabled={isLoading}
                    />
                    <TopicButton
                        topic="🏃‍♀️ Show Video Drills"
                        onClick={() => sendMessage("Show me the video library.", 'user')}
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
                        className="flex-shrink-0 p-4 bg-zinc-800/80 border border-zinc-700 rounded-xl text-fuchsia-300 hover:bg-zinc-700 hover:text-fuchsia-200 transition-all duration-200 disabled:opacity-50"
                    >
                       {isTopicsVisible ? <ChevronUpIcon /> : <ChevronDownIcon />}
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
