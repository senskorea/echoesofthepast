export interface AIModel {
  id: string;
  name: string;
  provider: "openai" | "gemini";
  description: string;
  isImage?: boolean;
}

export const TEXT_MODELS: AIModel[] = [
  { 
    id: "gpt-5-mini",
    name: "GPT-5 mini",
    provider: "openai", 
    description: "Multimodal flagship model. Versatile for heritage preservation tasks combining vision, text, and real-time analysis." 
  },
  { 
    id: "gpt-4.1-mini",
    name: "GPT-4.1 mini",
    provider: "openai", 
    description: "Cost-efficient, high-performance model. Efficient for scalable heritage tasks like metadata and narratives." 
  },
  { 
    id: "gemini-3.6-flash",
    name: "Gemini 3.6 Flash",
    provider: "gemini", 
    description: "Frontier-class speed. Excels at rapid, large-scale multimodal historical data extraction and storytelling." 
  },
];

export const IMAGE_MODELS: AIModel[] = [
  { 
    id: "gpt-image-2.5-flare",
    name: "GPT Image 2.5 Flare",
    provider: "openai", 
    description: "Fast, high-quality image generation for everyday heritage work."
  },
  { 
    id: "gemini-3.1-flash-image",
    name: "Gemini 3.1 Flash Image",
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
