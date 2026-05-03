import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, Sparkles, Loader2 } from "lucide-react";
import mockData from "@/data/mock-data.json";
import { Postcard } from "@/types/postcard";

const PostcardDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [postcard, setPostcard] = useState<Postcard | undefined>();
  const [aiStory, setAiStory] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Load from localStorage or use mock data
    const stored = localStorage.getItem("geostories-postcards");
    let allPostcards: Postcard[] = mockData as Postcard[];
    
    if (stored) {
      try {
        allPostcards = JSON.parse(stored);
      } catch {
        allPostcards = mockData as Postcard[];
      }
    }
    
    const foundPostcard = allPostcards.find((p) => p.id === id);
    setPostcard(foundPostcard);

    // Check for cached story
    if (foundPostcard) {
      const cachedStory = localStorage.getItem(`story-${id}`);
      if (cachedStory) {
        setAiStory(cachedStory);
      } else {
        generateStory(foundPostcard);
      }
    }
  }, [id]);

  const generateStory = async (postcardData: Postcard) => {
    setIsGenerating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-story`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ postcard: postcardData }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate story");
      }

      const { story } = await response.json();
      setAiStory(story);
      localStorage.setItem(`story-${id}`, story);
    } catch (error) {
      console.error("Story generation error:", error);
      setAiStory("Unable to generate story at this time. Please try again later.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!postcard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold mb-4">Story Not Found</h1>
          <button
            onClick={() => navigate("/")}
            className="text-accent hover:underline font-body"
          >
            Return to Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-primary hover:text-accent transition-colors font-body group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Map</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <article className="animate-fade-in">
            {/* Image */}
            <div className="vintage-card overflow-hidden mb-8">
              <img
                src={postcard.image_url}
                alt={postcard.title}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            </div>

            {/* Title & Location */}
            <div className="mb-8 animate-slide-up">
              <h1 className="font-heading text-4xl md:text-5xl font-bold text-primary mb-4">
                {postcard.title}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-5 h-5 text-accent" />
                <span className="font-body">
                  {postcard.latitude.toFixed(4)}°N, {postcard.longitude.toFixed(4)}°E
                </span>
              </div>
            </div>

            {/* Original Description */}
            <div className="vintage-card p-8 animate-slide-up mb-6">
              <h2 className="font-heading text-2xl font-semibold mb-4 text-primary">
                About This Postcard
              </h2>
              <p className="font-body text-lg leading-relaxed text-foreground">
                {postcard.description}
              </p>
            </div>

            {/* AI-Generated Story */}
            <div className="vintage-card p-8 animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-accent" />
                <h2 className="font-heading text-2xl font-semibold text-primary">
                  The Story
                </h2>
              </div>
              {isGenerating ? (
                <div className="flex items-center gap-3 text-muted-foreground py-8">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <p className="font-body">Crafting a historical narrative...</p>
                </div>
              ) : (
                <p className="font-body text-lg leading-relaxed text-foreground whitespace-pre-line">
                  {aiStory}
                </p>
              )}
            </div>

            {/* Map Preview */}
            <div className="mt-8 vintage-card p-6 animate-slide-up">
              <h3 className="font-heading text-xl font-semibold mb-4 text-primary">
                Location on Map
              </h3>
              <div className="bg-secondary/30 rounded-lg p-4 text-center">
                <MapPin className="w-12 h-12 text-accent mx-auto mb-2" />
                <p className="text-muted-foreground font-body">
                  Interactive map view available on the main page
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="mt-4 bg-primary text-primary-foreground px-6 py-2 rounded-lg font-body hover:opacity-90 transition-opacity"
                >
                  View on Map
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};

export default PostcardDetail;
