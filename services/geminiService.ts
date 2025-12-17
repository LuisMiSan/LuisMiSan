import { GoogleGenAI, Type, Modality, Chat, Content, LiveServerMessage } from "@google/genai";
import type { AnalysisResult, GroundedAnswer } from '../types';

// Fix: Always use process.env.API_KEY directly when initializing the GoogleGenAI client as per the coding guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        problemAnalysis: {
            type: Type.OBJECT,
            properties: {
                identifiedProblem: { type: Type.STRING },
                impact: { type: Type.STRING },
            },
            required: ['identifiedProblem', 'impact'],
        },
        shortTermSolution: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                steps: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            step: { type: Type.INTEGER },
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                        },
                        required: ['step', 'title', 'description']
                    }
                },
                isPremium: { type: Type.BOOLEAN }
            },
            required: ['title', 'summary', 'steps']
        },
        longTermSolution: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                summary: { type: Type.STRING },
                steps: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            step: { type: Type.INTEGER },
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                        },
                        required: ['step', 'title', 'description']
                    }
                },
                isPremium: { type: Type.BOOLEAN }
            },
            required: ['title', 'summary', 'steps']
        }
    },
    required: ['problemAnalysis', 'shortTermSolution', 'longTermSolution']
};

export const analyzeProblemWithThinking = async (description: string, area: string, systemInstruction?: string): Promise<AnalysisResult> => {
    const prompt = `Analiza el siguiente problema en el área de ${area}: "${description}"`;
    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 },
            systemInstruction: systemInstruction || "Eres un consultor experto.",
            responseMimeType: "application/json",
            responseSchema: analysisSchema,
        },
    });

    return JSON.parse(response.text || "{}") as AnalysisResult;
};

export const analyzeProblemWithSearch = async (description: string, area: string): Promise<GroundedAnswer> => {
    const prompt = `Basado en información web, analiza este problema en ${area}: "${description}"`;
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.map(chunk => chunk.web)
        .filter(web => web?.uri && web?.title) as { uri: string, title: string }[] || [];

    return { answer: response.text || "", sources };
};

export const getTtsAudio = async (text: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Lee: ${text}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export const startChat = (history: Content[], instruction: string): Chat => {
    return ai.chats.create({
        model: 'gemini-3-flash-preview',
        history,
        config: { systemInstruction: instruction },
    });
};

// Fix: Removing incorrect 'LiveSession' import and using 'any' for general promise type as per standard usage
export const connectToLiveSession = (callbacks: any, instruction: string): Promise<any> => {
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
            systemInstruction: instruction,
            inputAudioTranscription: {},
            outputAudioTranscription: {},
        },
    });
};