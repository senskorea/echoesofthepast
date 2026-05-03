import { useState, useEffect } from "react";
import MapView from "@/components/MapView";
import ImportDialog from "@/components/ImportDialog";
import SettingsPanel from "@/components/SettingsPanel";
import mockData from "@/data/mock-data.json";
import { Postcard } from "@/types/postcard";

const Index = () => {
  const [postcards, setPostcards] = useState<Postcard[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("geostories-postcards");
    if (stored) {
      try {
        setPostcards(JSON.parse(stored));
      } catch {
        setPostcards(mockData as Postcard[]);
      }
    } else {
      setPostcards(mockData as Postcard[]);
    }
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
