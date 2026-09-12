export interface Postcard {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  image_url?: string;
  secondaryImages?: string[]; // For front/back views
  latitude: number;
  longitude: number;
  detailUrl?: string;
  aiVisionResults?: {
    transcribed_text?: string;
    visual_description?: string;
    historical_context?: string;
    [key: string]: unknown;
  };
}
