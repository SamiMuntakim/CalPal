import { GoogleGenerativeAI } from "@google/generative-ai";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth } from "firebase/auth";
import app from "./firebaseConfig";
import { UserStats, NutritionGoals } from "../hooks/useProfile";

const storage = getStorage(app);
const auth = getAuth();

// Initialize the Gemini API with the API key from environment variables
let genAI: GoogleGenerativeAI;
try {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
  genAI = new GoogleGenerativeAI(apiKey);

  // Log initialization status
  if (apiKey) {
    console.log("Gemini API initialized with key");
  } else {
    console.warn("Gemini API initialized with empty key");
  }
} catch (error) {
  console.error("Failed to initialize Gemini API:", error);
  // @ts-ignore
  genAI = {
    getGenerativeModel: () => ({
      generateContent: async () => {
        throw new Error("Gemini API is not properly initialized");
      },
    }),
  };
}

interface AnalysisResult {
  title: string;
  items: string[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface ExerciseData {
  type: string;
  duration: number;
  description: string;
  userStats: UserStats;
  intensity: string;
}

export interface ExerciseResult {
  title: string;
  caloriesBurned: number;
  description: string;
}

export interface WeightTrendAnalysis {
  trend: string; // "losing", "gaining", "maintaining"
  averageWeeklyChange: number;
  feedback: string;
  recommendedActions: string[];
}

/**
 * Analyzes a food image using Google Gemini 2.0 Flash model
 * @param base64Image - Base64 encoded image
 * @returns Nutritional analysis of the food in the image
 */
export const analyzeFoodImage = async (
  base64Image: string
): Promise<AnalysisResult> => {
  try {
    // Check if API key is available
    if (!process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
      console.warn("Gemini API key is not configured");
      return createDefaultResult();
    }

    // Prepare the API endpoint - using gemini-2.0-flash model for image analysis
    const apiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    const url = `${apiUrl}?key=${process.env.EXPO_PUBLIC_GEMINI_API_KEY}`;

    // Prepare the request payload with the base64 image and prompt
    const payload = {
      contents: [
        {
          parts: [
            {
              text: `Analyze this food image and provide a detailed nutritional analysis. Follow these guidelines:

1. Identify all food items in the image and list them in the 'items' array.
2. For each food item, estimate:
   - Total calories (kcal)
   - Protein content (g)
   - Carbohydrate content (g)
   - Fat content (g)

3. Consider these factors in your estimation:
   - Portion sizes relative to common serving sizes
   - Cooking methods (fried, baked, raw, etc.)
   - Visible ingredients and their quantities
   - Standard nutritional values for similar dishes

4. Return ONLY a valid JSON object with these fields:
   {
     "title": "Meal Title",
     "items": ["food item 1", "food item 2", ...],
     "calories": number,
     "protein": number,
     "carbs": number,
     "fats": number
   }

5. Ensure all numbers are realistic and consistent with standard nutritional values.
6. Do not include any explanation or additional text outside the JSON object.`,
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 1,
        maxOutputTokens: 1024,
      },
    };

    console.log("Sending request to Gemini API...");

    // Make the API request
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API error response:", errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log("Received response from Gemini API");

    // Extract the text content from the response
    const textContent = data.candidates[0].content.parts[0].text;
    console.log("Raw response:", textContent);

    // Extract the JSON portion from the text response
    const jsonMatch =
      textContent.match(/```json\n([\s\S]*?)\n```/) ||
      textContent.match(/```([\s\S]*?)```/) ||
      textContent.match(/{[\s\S]*?}/);

    let parsedResult: AnalysisResult;

    if (jsonMatch) {
      try {
        // Clean up the JSON string and parse it
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        console.log("Extracted JSON:", jsonStr);
        parsedResult = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error("Error parsing JSON from Gemini response:", parseError);
        // Fallback to default values
        parsedResult = createDefaultResult();
      }
    } else {
      console.warn("Could not extract JSON from Gemini response");
      parsedResult = createDefaultResult();
    }

    // Ensure all required fields are present with numeric values
    return {
      title:
        typeof parsedResult.title === "string"
          ? parsedResult.title
          : "Unknown Meal",
      items: Array.isArray(parsedResult.items)
        ? parsedResult.items
        : ["Unknown food item"],
      calories:
        typeof parsedResult.calories === "number" ? parsedResult.calories : 0,
      protein:
        typeof parsedResult.protein === "number" ? parsedResult.protein : 0,
      carbs: typeof parsedResult.carbs === "number" ? parsedResult.carbs : 0,
      fats: typeof parsedResult.fats === "number" ? parsedResult.fats : 0,
    };
  } catch (error) {
    console.error("Food analysis error:", error);
    return createDefaultResult();
  }
};

/**
 * Gets personalized nutrition recommendations based on user stats
 * @param userStats - User's physical stats and goals
 * @param geminiData - Formatted data specifically for Gemini API
 * @returns Recommended nutrition goals
 */
export const getNutritionRecommendations = async (
  userStats: UserStats,
  geminiData?: any
): Promise<NutritionGoals> => {
  try {
    // Check if API key is available
    if (!process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
      console.warn("Gemini API key is not configured");
      return createDefaultNutritionGoals();
    }

    // Prepare the API endpoint
    const apiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    const url = `${apiUrl}?key=${process.env.EXPO_PUBLIC_GEMINI_API_KEY}`;

    // Create a detailed prompt with all user stats
    let prompt;

    if (geminiData) {
      // Use the formatted data specifically for Gemini
      prompt = `
      Create a personalized nutrition plan based on the following information:
      - Age: ${geminiData.age}
      - Sex (biological): ${geminiData.sex}
      - Height: ${geminiData.height}
      - Weight: ${geminiData.weight}
      - Activity Level: ${geminiData.activityLevel}
      - Goal: ${geminiData.goal}
      
      I need a daily nutrition plan with specific macronutrient targets. Please provide:
      - Total daily calories
      - Protein in grams
      - Carbohydrates in grams
      - Fats in grams
      
      Return ONLY a valid JSON object with the following fields:
      {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fats": number
      }
      
      Do not include any explanation, text, or other information outside of the JSON object.
      `;
    } else {
      // Use the original approach with userStats
      prompt = `
      Based on the following user information, provide personalized daily nutrition recommendations:
      - Starting weight: ${userStats.startingWeight} kg
      - Current weight: ${userStats.currentWeight} kg
      - Goal weight: ${userStats.goalWeight} kg
      - Weekly goal: ${userStats.weeklyGoal} (lose, maintain, or gain weight)
      - Activity level: ${userStats.activityLevel}
      - Height: ${userStats.height} cm
      - Age: ${userStats.age}
      - Gender: ${userStats.gender}

      Return ONLY a valid JSON object with recommended daily nutrition goals with the following fields:
      - calories (number): Total daily calories
      - protein (number): Daily protein in grams
      - carbs (number): Daily carbs in grams
      - fats (number): Daily fats in grams

      Do not include any explanation, text, or other information outside of the JSON object.
      `;
    }

    // Prepare the request payload
    const payload = {
      contents: [
        {
          parts: [
            {
              text: prompt.trim(),
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topK: 32,
        topP: 1,
        maxOutputTokens: 1024,
      },
    };

    console.log("Requesting nutrition recommendations from Gemini API...");

    // Make the API request
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API error response:", errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log("Received nutrition recommendations from Gemini API");

    // Extract the text content from the response
    const textContent = data.candidates[0].content.parts[0].text;
    console.log("Raw response:", textContent);

    // Extract the JSON portion from the text response
    const jsonMatch =
      textContent.match(/```json\n([\s\S]*?)\n```/) ||
      textContent.match(/```([\s\S]*?)```/) ||
      textContent.match(/{[\s\S]*?}/);

    let parsedResult: NutritionGoals;

    if (jsonMatch) {
      try {
        // Clean up the JSON string and parse it
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        console.log("Extracted JSON:", jsonStr);
        parsedResult = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error(
          "Error parsing JSON from nutrition recommendations:",
          parseError
        );
        // Fallback to default values
        parsedResult = createDefaultNutritionGoals();
      }
    } else {
      console.warn("Could not extract JSON from Gemini API response");
      parsedResult = createDefaultNutritionGoals();
    }

    // Ensure all required fields are present with numeric values
    return {
      calories:
        typeof parsedResult.calories === "number"
          ? parsedResult.calories
          : 2000,
      protein:
        typeof parsedResult.protein === "number" ? parsedResult.protein : 150,
      carbs: typeof parsedResult.carbs === "number" ? parsedResult.carbs : 200,
      fats: typeof parsedResult.fats === "number" ? parsedResult.fats : 65,
    };
  } catch (error) {
    console.error("Error getting nutrition recommendations:", error);
    return createDefaultNutritionGoals();
  }
};

// Create a default result for fallback
const createDefaultResult = (): AnalysisResult => {
  return {
    title: "Unknown Meal",
    items: ["Unknown food item"],
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  };
};

// Create default nutrition goals for fallback
const createDefaultNutritionGoals = (): NutritionGoals => {
  return {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fats: 65,
  };
};

export const analyzeExercise = async (
  exerciseData: ExerciseData
): Promise<ExerciseResult> => {
  try {
    // Check if API key is available
    if (!process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
      throw new Error("Gemini API key is not configured");
    }

    const prompt = `Calculate calories burned for this exercise:
    Type: ${exerciseData.type}
    Duration: ${exerciseData.duration} minutes
    Intensity: ${exerciseData.intensity || "Moderate"}
    Description: ${exerciseData.description}
    User Stats:
    - Weight: ${exerciseData.userStats.currentWeight} kg
    - Height: ${exerciseData.userStats.height} cm
    - Age: ${exerciseData.userStats.age}
    - Gender: ${exerciseData.userStats.gender}
    - Activity Level: ${exerciseData.userStats.activityLevel}

    Return a JSON object with:
    - title: A descriptive title for the exercise that includes intensity level
    - caloriesBurned: Estimated calories burned (number)
    - description: A brief description of the exercise

    Consider the intensity level (${
      exerciseData.intensity || "Moderate"
    }), duration, and user's physical characteristics in your calculation.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format from Gemini");
    }

    const parsedResult = JSON.parse(jsonMatch[0]);

    return {
      title:
        parsedResult.title ||
        `${exerciseData.type} (${exerciseData.intensity || "Moderate"})`,
      caloriesBurned: parsedResult.caloriesBurned || 0,
      description: parsedResult.description || exerciseData.description,
    };
  } catch (error) {
    console.error("Exercise analysis error:", error);
    return {
      title: `${exerciseData.type} (${exerciseData.intensity || "Moderate"})`,
      caloriesBurned: 0,
      description: exerciseData.description,
    };
  }
};

/**
 * Analyzes weight trends using Gemini AI
 * @param weightData - Array of weight entries sorted by date
 * @param goalWeight - User's goal weight
 * @param weeklyGoal - User's weekly goal (lose, maintain, gain)
 * @returns Analysis of weight trends and personalized feedback
 */
export const analyzeWeightTrends = async (
  weightData: { weight: number; date: Date }[],
  goalWeight: number,
  weeklyGoal: string
): Promise<WeightTrendAnalysis> => {
  try {
    if (weightData.length < 2) {
      return {
        trend: "maintaining",
        averageWeeklyChange: 0,
        feedback:
          "Not enough data to analyze trends. Keep logging your weight regularly.",
        recommendedActions: ["Continue logging your weight daily or weekly"],
      };
    }

    // Check if API key is available
    if (!process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
      throw new Error("Gemini API key is not configured");
    }

    // Format weight data for the prompt
    const formattedWeightData = weightData.map((entry) => ({
      weight: entry.weight,
      date: entry.date.toISOString().split("T")[0], // Format as YYYY-MM-DD
    }));

    // Create a detailed prompt with all user stats
    const prompt = `
    Analyze the following weight tracking data and provide insights and recommendations.
    Weight data (ordered from oldest to newest):
    ${JSON.stringify(formattedWeightData)}
    
    Goal weight: ${goalWeight} kg
    Weekly goal: ${weeklyGoal} (lose, maintain, or gain weight)

    Return a valid JSON object with the following fields:
    - trend: Either "losing", "gaining", or "maintaining" based on the overall trend
    - averageWeeklyChange: Average weight change per week in kg (positive for gain, negative for loss)
    - feedback: A personalized message about their progress
    - recommendedActions: An array of 2-3 specific actions they could take based on their progress and goal

    Make sure your analysis is helpful, accurate, and motivational.
    `;

    // Prepare the request payload
    const payload = {
      contents: [
        {
          parts: [
            {
              text: prompt.trim(),
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topK: 32,
        topP: 1,
        maxOutputTokens: 1024,
      },
    };

    console.log("Requesting weight trend analysis from Gemini API...");

    // Make the API request
    const apiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    const url = `${apiUrl}?key=${process.env.EXPO_PUBLIC_GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API error response:", errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log("Received weight trend analysis from Gemini API");

    // Extract the text content from the response
    const textContent = data.candidates[0].content.parts[0].text;
    console.log("Raw response:", textContent);

    // Extract the JSON portion from the text response
    const jsonMatch =
      textContent.match(/```json\n([\s\S]*?)\n```/) ||
      textContent.match(/```([\s\S]*?)```/) ||
      textContent.match(/{[\s\S]*?}/);

    let parsedResult: WeightTrendAnalysis;

    if (jsonMatch) {
      try {
        // Clean up the JSON string and parse it
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        console.log("Extracted JSON:", jsonStr);
        parsedResult = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error("Error parsing JSON from Gemini response:", parseError);
        // Fallback to default values
        parsedResult = createDefaultWeightAnalysis();
      }
    } else {
      console.warn("Could not extract JSON from Gemini response");
      parsedResult = createDefaultWeightAnalysis();
    }

    return parsedResult;
  } catch (error) {
    console.error("Weight trend analysis error:", error);
    return createDefaultWeightAnalysis();
  }
};

/**
 * Creates a default weight trend analysis
 */
const createDefaultWeightAnalysis = (): WeightTrendAnalysis => {
  return {
    trend: "maintaining",
    averageWeeklyChange: 0,
    feedback:
      "We couldn't analyze your weight trends at this time. Keep logging your weight regularly.",
    recommendedActions: [
      "Continue logging your weight daily or weekly",
      "Stay consistent with your nutrition plan",
      "Make sure to track all your meals and exercises",
    ],
  };
};
