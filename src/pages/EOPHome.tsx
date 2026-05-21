import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Download, Trash2, Edit, MapPin } from "lucide-react";
import MapView from "@/components/MapView";
import ImportDialog from "@/components/ImportDialog";
import { Postcard } from "@/types/postcard";
import mockData from "@/data/mock-data.json";
import { loadAllPostcards } from "@/lib/data-loader";

import { useLanguage } from "../lib/i18n";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

type View = "gallery" | "map";

const EOPHome = () => {
  const { t } = useLanguage();
  const [activeView, setActiveView] = useState<View>("gallery");
  const [postcards, setPostcards] = useState<Postcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
          <img src="/src/assets/eop_hero_premium.png" alt="Echoes of the Past" />
        </div>
      </section>

      {/* ── TOGGLE BAR ── */}
      <div className="eop-toggle-bar">
        <div className="eop-toggle-left">
          <h2 className="eop-section-title">Geostories</h2>
          <span className="eop-count">{postcards.length} entries</span>
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
              <p>No stories yet. <a href="/eop/upload/">Add the first one.</a></p>
            </div>
          ) : (
            <div className="eop-grid">
              {postcards.map((card) => {
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
                    
                    <div className="eop-card-actions" style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6, opacity: 0, transition: "opacity 0.2s" }}>
                      <ImportDialog 
                        onImport={handleImportOrUpdate} 
                        editingCard={card}
                        trigger={
                          <button 
                            onClick={(e) => e.stopPropagation()} // Prevent card navigation
                            className="eop-card-action-btn"
                            style={{ background: "rgba(255,255,255,0.9)", border: "1px solid var(--grey-5)", padding: 6, borderRadius: 6 }}
                            title="Edit"
                          >
                            <Edit style={{ width: 14, height: 14, color: "var(--grey-2)" }} />
                          </button>
                        }
                      />
                      <button 
                        onClick={(e) => handleExportCard(e, card)}
                        className="eop-card-action-btn"
                        style={{ background: "rgba(255,255,255,0.9)", border: "1px solid var(--grey-5)", padding: 6, borderRadius: 6 }}
                        title="Export JSON"
                      >
                        <Download style={{ width: 14, height: 14, color: "var(--grey-2)" }} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, card.id)}
                        className="eop-card-action-btn"
                        style={{ background: "rgba(255,255,255,0.9)", border: "1px solid var(--red)", color: "var(--red)", padding: 6, borderRadius: 6 }}
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
          <MapView postcards={postcards} />
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer className="eop-footer">
        <div className="eop-footer-inner">
          <span>© {new Date().getFullYear()} Small Academy — Erasmus+ Programme</span>
          <div className="eop-footer-links">
            <a href="https://github.com/SmallAcademy" target="_blank" rel="noreferrer">GitHub</a>
            <a href="/contact/">Contact</a>
            <Link to="/settings">Settings</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EOPHome;
