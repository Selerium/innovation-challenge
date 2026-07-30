const API_KEY = process.env.GEMINI_API_KEY || "";
const MODEL = "gemini-2.0-flash";
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
};

type GeminiContent = {
  role?: string;
  parts: { text: string }[];
};

type GeminiResponse = {
  candidates?: {
    content: { parts: { text: string }[] };
    finishReason?: string;
  }[];
  promptFeedback?: any;
};

export async function chat(
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<string> {
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const contents: GeminiContent[] = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body: Record<string, any> = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };

  if (systemPrompt) {
    body.systemInstruction = {
      parts: [{ text: systemPrompt }],
    };
  }

  const res = await fetch(`${BASE_URL}?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${err}`);
  }

  const data: GeminiResponse = await res.json();

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned empty response");
  }

  return text;
}
