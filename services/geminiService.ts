import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateWorkflowPlan = async (prompt: string): Promise<{ title: string; description: string; nodes: string[]; cronSchedule?: string; tags: string[] }> => {
  try {
    const modelId = 'gemini-2.5-flash';
    
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Create a structured automation workflow plan based on this user request: "${prompt}". 
      Return a JSON object with a short catchy title, a professional description, a list of generic service nodes required (e.g., "Webhook", "Gmail", "Notion"), a valid cron expression if a frequency/time is mentioned (e.g. "0 9 * * 1"), and a list of 2-3 short categorization tags (e.g. "Sales", "Reporting").`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            nodes: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            cronSchedule: { type: Type.STRING, nullable: true, description: "Standard cron expression if frequency is specified" },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "description", "nodes", "tags"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);

  } catch (error) {
    console.error("Error generating workflow:", error);
    // Fallback for demo if API fails
    return {
      title: "New Automation",
      description: "A custom workflow generated based on your input.",
      nodes: ["Start", "Action", "End"],
      tags: ["Custom"]
    };
  }
};