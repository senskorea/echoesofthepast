import { useState, useEffect } from "react";
import MapView from "@/components/MapView";
import ImportDialog from "@/components/ImportDialog";
import SettingsPanel from "@/components/SettingsPanel";
import mockData from "@/data/mock-data.json";
import { Postcard } from "@/types/postcard";

const Index = () => {
  const [postcards, setPostcards] = useState<Postcard[]>([]);

  useEffect(() => {
    const loadPostcards = async () => {
      // 1. Try to load from LocalStorage first (for newly imported data)
      const stored = localStorage.getItem("geostories-postcards");
      if (stored) {
        try {
          setPostcards(JSON.parse(stored));
          return;
        } catch (e) {
          console.error("Failed to parse stored postcards", e);
        }
      }

      // 2. Try to fetch from the Static JSON file
      try {
        const response = await fetch("/eop/get_postcards.json");
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setPostcards(data);
            return;
          }
        }
      } catch (e) {
        console.log("Synced EOP data not found, falling back to mock data.");
      }

      // 3. Fallback to mock data
      setPostcards(mockData as Postcard[]);
    };

    loadPostcards();
  }, []);

  const handleImport = (newPostcards: Postcard[]) => {
    const updated = [...postcards, ...newPostcards];
    setPostcards(updated);
    localStorage.setItem("geostories-postcards", JSON.stringify(updated));
  };

  return (
    <>
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
        <ImportDialog onImport={handleImport} />
        <SettingsPanel />
      </div>
      <MapView postcards={postcards} />
    </>
  );
};

export default Index;
