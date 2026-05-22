import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Download, Trash2, Edit, MapPin, Search, X } from "lucide-react";
import MapView from "@/components/MapView";
import ImportDialog from "@/components/ImportDialog";
import { Postcard } from "@/types/postcard";
import mockData from "@/data/mock-data.json";
import { loadAllPostcards } from "@/lib/data-loader";

import { useLanguage } from "../lib/i18n";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import heroImg from "@/assets/eop_hero_premium.png";

type View = "gallery" | "map";

const EOPHome = () => {
  const { t } = useLanguage();
  const [activeView, setActiveView] = useState<View>("gallery");
  const [postcards, setPostcards] = useState<Postcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPostcards = postcards.filter((card) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();

    const titleMatch = card.title?.toLowerCase().includes(q);
    const descMatch = card.description?.toLowerCase().includes(q);
    const latMatch = card.latitude?.toString().includes(q);
    const lngMatch = card.longitude?.toString().includes(q);

    // AI Vision fields search
    const vision = card.aiVisionResults;
    const transMatch = vision?.transcribed_text?.toLowerCase().includes(q);
    const visDescMatch = vision?.visual_description?.toLowerCase().includes(q);

    return titleMatch || descMatch || latMatch || lngMatch || transMatch || visDescMatch;
  });

  useEffect(() => {
    const load = async () => {
      const data = await loadAllPostcards();
      setPostcards(data);
      setIsLoading(false);
    };
    load();
  }, []);

  const handleImportOrUpdate = (newCards: Postcard[]) => {
    let updated = [...postcards];
    newCards.forEach(nc => {
      const idx = updated.findIndex(c => c.id === nc.id);
      if (idx > -1) {
        updated[idx] = nc;
      } else {
        updated.push(nc);
      }
    });
    setPostcards(updated);
    localStorage.setItem("geostories-postcards", JSON.stringify(updated));
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this story? This cannot be undone.")) return;
    const updated = postcards.filter(c => c.id !== id);
    setPostcards(updated);
    localStorage.setItem("geostories-postcards", JSON.stringify(updated));
  };

  const handleExportCard = (e: React.MouseEvent, card: Postcard) => {
    e.preventDefault();
    e.stopPropagation();
    const exportData = {
      ...card,
      exportedAt: new Date().toISOString(),
      license: "CC BY-NC 4.0 (Open Educational Resource)"
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eop-story-${card.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="eop-root">
      {/* ── NAV ── */}
      <header className="eop-nav">
        <Link to="/" className="eop-logo">
          <span className="eop-logo-dot" />
          <span>Echoes of the Past</span>
        </Link>
        <nav className="eop-nav-links">
          <LanguageSwitcher />
          <Link to="/settings" className="eop-nav-link">{t("nav_settings")}</Link>
          <Link to="/learn" className="eop-nav-link">{t("nav_learn")}</Link>
          <ImportDialog onImport={handleImportOrUpdate} />
        </nav>
      </header>

      {/* ── HERO ── */}
      <section className="eop-hero">
        <div className="eop-hero-inner">
          <h1 className="eop-hero-title">{t("home_hero_title")}</h1>
          <p className="eop-hero-sub">
            {t("home_hero_sub")}
          </p>
        </div>
        <div className="eop-hero-image">
          <img src={heroImg} alt="Echoes of the Past" />
        </div>
      </section>

      {/* ── TOGGLE BAR ── */}
      <div className="eop-toggle-bar">
        <div className="eop-toggle-left">
          <h2 className="eop-section-title">Geostories</h2>
          <span className="eop-count">
            {searchQuery.trim()
              ? `${filteredPostcards.length} of ${postcards.length} found`
              : `${postcards.length} entries`}
          </span>
        </div>
        <div className="eop-toggle-search">
          <div className="eop-toggle-search-wrapper">
            <input
              type="text"
              className="eop-toggle-search-input"
              placeholder={t("home_search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="eop-toggle-search-icon" />
            {searchQuery && (
              <button
                className="eop-toggle-search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X />
              </button>
            )}
          </div>
        </div>
        <div className="eop-toggle-btns">
          <button
            className={`eop-toggle ${activeView === "gallery" ? "active" : ""}`}
            onClick={() => setActiveView("gallery")}
          >
            Gallery
          </button>
          <button
            className={`eop-toggle ${activeView === "map" ? "active" : ""}`}
            onClick={() => setActiveView("map")}
          >
            Map
          </button>
        </div>
      </div>

      {/* ── GALLERY VIEW ── */}
      {activeView === "gallery" && (
        <section className="eop-gallery">
          {isLoading ? (
            <div className="eop-loading">
              <div className="eop-spinner" />
              <p>Loading archive…</p>
            </div>
          ) : postcards.length === 0 ? (
            <div className="eop-empty">
              <p>No stories yet.</p>
            </div>
          ) : filteredPostcards.length === 0 ? (
            <div className="eop-empty-search">
              <Search className="eop-empty-search-icon" />
              <h3 className="eop-empty-search-title">No matching stories</h3>
              <p className="eop-empty-search-desc">
                We couldn't find any results for "{searchQuery}". Try adjusting your keywords or search query.
              </p>
              <button className="eop-empty-search-btn" onClick={() => setSearchQuery("")}>
                Clear Search
              </button>
            </div>
          ) : (
            <div className="eop-grid">
              {filteredPostcards.map((card) => {
                const img = card.imageUrl || card.image_url || "";
                const href = card.detailUrl && card.detailUrl !== "#"
                  ? card.detailUrl
                  : `/postcards/${card.id}`;
                return (
                  <Link to={href} key={card.id} className="eop-card">
                    <div className="eop-card-img-wrap">
                      {img ? (
                        <img src={img} alt={card.title} className="eop-card-img" />
                      ) : (
                        <div className="eop-card-img-placeholder">
                          <span>No image</span>
                        </div>
                      )}
                    </div>
                    <div className="eop-card-body">
                      <p className="eop-card-label">
                        {card.latitude !== 0
                          ? `${card.latitude.toFixed(2)}°N, ${card.longitude.toFixed(2)}°E`
                          : "Location unknown"}
                      </p>
                      <h3 className="eop-card-title">{card.title}</h3>
                      <p className="eop-card-desc">{card.description}</p>
                    </div>
                    <div className="eop-card-arrow">→</div>
                    
                    <div className="eop-card-actions">
                      <ImportDialog 
                        onImport={handleImportOrUpdate} 
                        editingCard={card}
                        trigger={
                          <button 
                            onClick={(e) => e.stopPropagation()} // Prevent card navigation
                            className="eop-card-action-btn"
                            title="Edit"
                          >
                            <Edit style={{ width: 14, height: 14 }} />
                          </button>
                        }
                      />
                      <button 
                        onClick={(e) => handleExportCard(e, card)}
                        className="eop-card-action-btn"
                        title="Export JSON"
                      >
                        <Download style={{ width: 14, height: 14 }} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, card.id)}
                        className="eop-card-action-btn delete-btn"
                        title="Delete"
                      >
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ── MAP VIEW ── */}
      {activeView === "map" && (
        <section className="eop-map-section">
          <MapView postcards={filteredPostcards} />
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer className="eop-footer">
        <div className="eop-footer-inner">
          <span>© {new Date().getFullYear()} Small Academy — Erasmus+ Programme</span>
          <div className="eop-footer-links">
            <a href="https://github.com/SmallAcademy" target="_blank" rel="noreferrer">GitHub</a>
            <Link to="/settings">Settings</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EOPHome;
