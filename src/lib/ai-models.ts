export interface AIModel {
  id: string;
  name: string;
  provider: "openai" | "gemini";
  description: string;
  isImage?: boolean;
}

export const TEXT_MODELS: AIModel[] = [
  { 
    id: "gpt-4o", 
    name: "GPT-4o (Omni)", 
    provider: "openai", 
    description: "Multimodal flagship model. Versatile for heritage preservation tasks combining vision, text, and real-time analysis." 
  },
  { 
    id: "gpt-4o-mini", 
    name: "GPT-4o mini", 
    provider: "openai", 
    description: "Cost-efficient, high-performance model. Efficient for scalable heritage tasks like metadata and narratives." 
  },
  { 
    id: "o1-mini", 
    name: "o1-mini", 
    provider: "openai", 
    description: "Advanced reasoning focused. Strong for intricate historical analysis and chronology reconstruction." 
  },
  { 
    id: "gemini-3-flash-preview", 
    name: "Gemini 3 Flash", 
    provider: "gemini", 
    description: "Frontier-class speed. Excels at rapid, large-scale multimodal historical data extraction and storytelling." 
  },
  { 
    id: "gemini-3.1-pro-preview", 
    name: "Gemini 3.1 Pro", 
    provider: "gemini", 
    description: "Advanced intelligence. Superior for deep, nuanced historical reasoning across vast multimodal sources." 
  },
];

export const IMAGE_MODELS: AIModel[] = [
  { 
    id: "gpt-image-2", 
    name: "GPT Image 2 (DALL·E)", 
    provider: "openai", 
    description: "State-of-the-art image generation. Successor to DALL-E 3 with exceptional structural clarity." 
  },
  { 
    id: "imagen-4.0-generate-001", 
    name: "Imagen 4 (Google)", 
    provider: "gemini", 
    description: "Google's latest flagship. Exceptional clarity, text rendering, and high-fidelity architectural details." 
  },
];

export const VIDEO_MODELS: AIModel[] = [
  {
    id: "veo-3.1-generate-preview",
    name: "Veo 3.1 (Google)",
    provider: "gemini",
    description: "Google's state-of-the-art video generator. Generates cinematic 4-second videos from text or image input."
  }
];
