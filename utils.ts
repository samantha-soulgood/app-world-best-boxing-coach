import type { WorkoutPlan } from './types';

/**
 * Parses a string to find and extract a JSON object. It first looks for a
 * markdown code block, and if that fails, it looks for the first and last
 * curly braces to extract a potential JSON object.
 * @param text The input string from the AI.
 * @returns A parsed WorkoutPlan object or null if no valid JSON is found.
 */
export const parseWorkoutJson = (text: string): WorkoutPlan | null => {
  let jsonString: string | null = null;

  // 1. First, try to find a markdown-fenced JSON block.
  const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = text.match(jsonRegex);

  if (match && match[1]) {
    jsonString = match[1];
  } else {
    // 2. If no markdown block, fall back to finding the first '{' and last '}'
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace > firstBrace) {
      jsonString = text.substring(firstBrace, lastBrace + 1);
    }
  }

  // 3. If we have a potential JSON string (from either method), try to parse it.
  if (jsonString) {
    try {
      const parsedJson = JSON.parse(jsonString);
      // Simple validation to check for the expected structure
      if (parsedJson.summary && parsedJson.workout && Array.isArray(parsedJson.workout.phases)) {
        return parsedJson as WorkoutPlan;
      }
    } catch (e) {
      console.error("Failed to parse workout JSON:", e);
      return null;
    }
  }

  // If all attempts fail, return null.
  return null;
};


/**
 * Parses a duration string (e.g., "5 minutes", "90 seconds") into seconds.
 * @param durationStr The input string.
 * @returns The total number of seconds.
 */
export const parseDurationToSeconds = (durationStr: string): number => {
    if (!durationStr) return 0;

    let totalSeconds = 0;
    const minutesMatch = durationStr.match(/(\d+)\s*min/i);
    const secondsMatch = durationStr.match(/(\d+)\s*sec/i);

    if (minutesMatch && minutesMatch[1]) {
        totalSeconds += parseInt(minutesMatch[1], 10) * 60;
    }
    if (secondsMatch && secondsMatch[1]) {
        totalSeconds += parseInt(secondsMatch[1], 10);
    }

    // If no units found, assume it's just a number of seconds
    if (totalSeconds === 0 && /^\d+$/.test(durationStr.trim())) {
        return parseInt(durationStr.trim(), 10);
    }

    return totalSeconds;
};