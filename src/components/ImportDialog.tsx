import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2, Sparkles, ClipboardCopy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Postcard } from "@/types/postcard";

interface ImportDialogProps {
  onImport: (postcards: Postcard[]) => void;
}

const JSON_FORMAT_PROMPT = `
You are a data formatting assistant for GeoStories, a historical postcard mapping app.

Convert my data into an array of postcard objects with this exact structure:

[
  {
    "id": "unique-string-id",
    "title": "Descriptive title of the postcard",
    "description": "One or more sentences describing the historical scene or location",
    "image_url": "https://direct-link-to-image.jpg",
    "latitude": 48.8584,
    "longitude": 2.2945
  }
]

Rules:
- "id" must be unique per entry (use a UUID or slug)
- "latitude" and "longitude" must be numbers (not strings)
- "image_url" must be a publicly accessible direct image URL
- Return ONLY the JSON array, no prose or code fences

Here is my data to convert:
[PASTE YOUR DATA HERE]
`.trim();

const ImportDialog = ({ onImport }: ImportDialogProps) => {
  const [jsonInput, setJsonInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(JSON_FORMAT_PROMPT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleImport = async () => {
    if (!jsonInput.trim()) {
      toast({
        title: "Empty input",
        description: "Please paste some JSON data to import.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/format-postcard-json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ json: jsonInput }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to format JSON");
      }

      const { formatted } = await response.json();
      const postcards = Array.isArray(formatted) ? formatted : [formatted];

      onImport(postcards);
      setOpen(false);
      setJsonInput("");

      toast({
        title: "Import successful!",
        description: `Imported ${postcards.length} postcard${postcards.length > 1 ? "s" : ""}.`,
      });
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Please check your JSON format.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-accent hover:bg-accent/90 text-primary">
          <Upload className="w-4 h-4" />
          Import Postcards
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <Sparkles className="w-5 h-5 text-accent" />
            Import Postcards with AI
          </DialogTitle>
          <DialogDescription>
            Paste your JSON data below. Our AI will automatically format it to match the required structure.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Paste your JSON here:</label>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="flex items-center gap-1.5 text-xs border border-border rounded-lg px-2.5 py-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                title="Copy formatting instructions to paste into ChatGPT, Claude, etc."
              >
                {copied ? (
                  <><Check className="w-3 h-3 text-green-500" /><span className="text-green-600">Copied!</span></>
                ) : (
                  <><ClipboardCopy className="w-3 h-3" />Copy format guide for AI</>
                )}
              </button>
            </div>
            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={`[\n  {\n    "postcard_id": "pc-001",\n    "title": "Historic Location",\n    "description": "A beautiful scene...",\n    "image_url": "https://...",\n    "latitude": 48.8584,\n    "longitude": 2.2945\n  }\n]`}
              className="min-h-[280px] font-mono text-sm"
            />
          </div>

          <div className="rounded-lg bg-muted/50 p-4 text-sm">
            <p className="font-medium mb-1">💡 Two ways to import</p>
            <p className="text-muted-foreground text-xs">
              <strong>Option A</strong> — paste any JSON and click Import; the AI edge function reformats it automatically.<br />
              <strong>Option B</strong> — click <em>"Copy format guide for AI"</em> above, paste into ChatGPT or Claude with your data, then paste the cleaned JSON back here.
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={isProcessing} className="gap-2">
              {isProcessing ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Processing with AI...</>
              ) : (
                <><Sparkles className="w-4 h-4" />Import</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDialog;
