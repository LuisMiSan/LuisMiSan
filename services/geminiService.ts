import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, Language } from "../types";

// Helper to clean JSON string if it's wrapped in markdown
const cleanJsonString = (text: string): string => {
  let clean = text.trim();
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json/, '').replace(/```$/, '');
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```/, '').replace(/```$/, '');
  }
  return clean;
};

export const analyzeCompanyUrl = async (url: string, language: Language): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // We use gemini-2.5-flash for speed and reasoning capabilities.
  const modelId = "gemini-2.5-flash";

  const langInstruction = language === 'es' 
    ? "CRITICAL: All generated text content (summaries, titles, descriptions, steps, industry) MUST be in SPANISH." 
    : "CRITICAL: All generated text content MUST be in ENGLISH.";

  const prompt = `
    I need you to act as an expert Business Process Automation Consultant.
    
    ${langInstruction}

    STEP 1: RESEARCH
    Use Google Search to analyze the following company URL: "${url}".
    Find out:
    - What is the company name?
    - What industry/sector are they in?
    - A brief summary of what they do.
    - An estimate of their employee count.
    - Infer their "AI Maturity" (None, Beginner, Intermediate, Advanced) based on their tech stack, job postings, or modernity of their site.
    - Identify 2-3 potential operational bottlenecks or challenges common in this specific industry.

    STEP 2: IDEATION
    Based strictly on the research above, generate 6 practical, low-code/no-code automation ideas suitable for this specific business. 
    Focus on high-impact, low-cost solutions using tools like Zapier, Make, OpenAI API, Chatbots, Airtable, etc.
    Avoid generic advice. Make it specific to their industry (e.g., if it's a dentist, suggest appointment reminders; if it's e-commerce, suggest abandoned cart agents).

    STEP 3: OUTPUT
    Return the result as a strictly valid JSON object. Do not add conversational text outside the JSON.
    
    The JSON structure must be:
    {
      "profile": {
        "name": "String",
        "industry": "String",
        "summary": "String",
        "employeeCountEstimate": "String",
        "aiMaturityLevel": "String (One of: None, Beginner, Intermediate, Advanced)",
        "keyChallenges": ["String", "String"]
      },
      "automations": [
        {
          "title": "String",
          "description": "String (Explain what it does and why it helps)",
          "impact": "High" | "Medium" | "Low",
          "difficulty": "Easy" | "Moderate" | "Advanced",
          "tools": ["Tool1", "Tool2"],
          "implementationSteps": ["Step 1", "Step 2"]
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
    
    if (!text) {
      throw new Error("No response received from Gemini.");
    }

    let parsedData;
    try {
      parsedData = JSON.parse(cleanJsonString(text));
    } catch (e) {
      console.error("JSON Parse Error:", e);
      console.log("Raw Text:", text);
      throw new Error("Failed to parse the analysis. The AI response was not valid JSON.");
    }

    // Extract grounding metadata (sources)
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk) => chunk.web)
      .filter((web) => web !== undefined && web !== null)
      .map((web) => ({ uri: web.uri || '', title: web.title || 'Source' })) || [];

    return {
      profile: parsedData.profile,
      automations: parsedData.automations,
      sources: sources
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};