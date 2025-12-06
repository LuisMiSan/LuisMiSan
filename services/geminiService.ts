import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, Language, AdminSettings } from "../types";

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

export const analyzeCompanyUrl = async (
  url: string, 
  language: Language, 
  pastAnalysesContext: string = '',
  settings: AdminSettings
): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // We use gemini-2.5-flash for speed and reasoning capabilities.
  const modelId = "gemini-2.5-flash";

  const langInstruction = language === 'es' 
    ? "CRITICAL: The Output Language MUST be SPANISH (Español). Even if the source website or knowledge base is in English, you MUST translate and generate the JSON response values (Summary, Industry, Challenges, Titles, Descriptions, Steps) entirely in SPANISH." 
    : "CRITICAL: The Output Language MUST be ENGLISH.";

  const prompt = `
    I need you to act as: ${settings.roleDefinition}
    
    ${langInstruction}

    INPUT CONTEXT:
    1. TARGET URL: "${url}"
    
    2. INTERNAL KNOWLEDGE BASE (PREVIOUS ANALYSES):
    "${pastAnalysesContext}"
    
    INSTRUCTION FOR KNOWLEDGE BASE:
    - Review the "INTERNAL KNOWLEDGE BASE" above. 
    - If there are companies in the same or similar industry, use their successful automation ideas as inspiration, but refine them to be specific to the current target.
    - If the industry is different, ensure the new suggestions are as high-quality and specific as the previous ones.
    - Use this data to ensure consistency and learn from previous workflows.

    STEP 1: RESEARCH
    Use Google Search to analyze the target company URL.
    Find out:
    - What is the company name?
    - What industry/sector are they in?
    - A brief summary of what they do.
    - An estimate of their employee count.
    - Infer their "AI Maturity" (None, Beginner, Intermediate, Advanced) based on their tech stack, job postings, or modernity of their site.
    - Identify 2-3 potential operational bottlenecks or challenges common in this specific industry.

    STEP 2: IDEATION
    Based strictly on the research above, generate 6 specific, scalable automation workflows suitable for this business.
    
    CRITICAL TECH STACK INSTRUCTIONS:
    ${settings.techFocus}

    ADDITIONAL CUSTOM INSTRUCTIONS:
    ${settings.customInstructions || 'None'}

    Make it specific to their industry (e.g., if it's a law firm, suggest an 'AI Legal Research Agent' via n8n; if e-commerce, an 'Inventory prediction API agent').

    STEP 3: OUTPUT
    Return the result as a strictly valid JSON object. Do not add conversational text outside the JSON.
    
    The JSON structure must be:
    {
      "profile": {
        "name": "String",
        "industry": "String (Translate to Spanish if language is ES)",
        "summary": "String (Translate to Spanish if language is ES)",
        "employeeCountEstimate": "String",
        "aiMaturityLevel": "String (One of: None, Beginner, Intermediate, Advanced)",
        "keyChallenges": ["String (Translate to Spanish)", "String"]
      },
      "automations": [
        {
          "title": "String (Translate to Spanish if language is ES)",
          "description": "String (Explain the workflow logic and why it scales. Translate to Spanish if language is ES)",
          "impact": "High" | "Medium" | "Low",
          "difficulty": "Easy" | "Moderate" | "Advanced",
          "tools": ["n8n", "OpenAI API", "Anthropic API", "Vector DB", "Specific API"],
          "implementationSteps": ["Step 1 (In Spanish)", "Step 2 (In Spanish)"]
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