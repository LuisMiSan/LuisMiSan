import { NutritionAnalysis } from "../types";

export const analyzeFoodImage = async (base64Image: string): Promise<NutritionAnalysis> => {
  try {
    const response = await fetch("/api/analyze-food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageData: base64Image }),
    });

    if (!response.ok) throw new Error("Server error");
    return await response.json();
  } catch (error) {
    console.error("Analysis failed", error);
    throw error;
  }
};

export const sendChatMessage = async (history: {role: string, parts: {text: string}[]}[], message: string): Promise<string> => {
    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ history, message }),
        });

        if (!response.ok) throw new Error("Assistant unavailable");
        const data = await response.json();
        return data.text || "Lo siento, no pude procesar eso.";
    } catch (error) {
        console.error("Chat error", error);
        return "Hubo un error al conectar con el asistente.";
    }
}

export const getQuickTip = async (): Promise<string> => {
    try {
        const response = await fetch("/api/quick-tip");
        if (!response.ok) throw new Error("Failed to fetch tip");
        const data = await response.json();
        return data.text || "Come más verduras hoy.";
    } catch (error) {
        return "Bebe suficiente agua.";
    }
}
