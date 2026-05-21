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
  aiVisionResults?: any; // To store what the AI "sees"
}
