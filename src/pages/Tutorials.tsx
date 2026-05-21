import { Link } from "react-router-dom";
import { ArrowLeft, PlayCircle } from "lucide-react";

const Tutorials = () => {
  return (
    <div className="eop-root" style={{ minHeight: "100vh", paddingBottom: 60 }}>
      {/* ── NAV ── */}
      <header className="eop-nav">
        <Link to="/" className="eop-logo">
          <span className="eop-logo-dot" />
          <span>Echoes of the Past</span>
        </Link>
        <nav className="eop-nav-links">
          <Link to="/" className="eop-nav-link" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> Archive
          </Link>
        </nav>
      </header>

      {/* ── HEADER ── */}
      <div className="pd-layout" style={{ marginTop: 40, display: "block", maxWidth: 900, margin: "40px auto 0" }}>
        <h1 className="pd-title" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <PlayCircle style={{ width: 28, height: 28, color: "var(--grey-2)" }} /> Tutorials & Guides
        </h1>
        <p className="pd-description" style={{ marginBottom: 40, fontSize: "1.1rem" }}>
          Learn how to use the Echoes of the Past platform to digitise, analyze, and creatively reimagine historical postcards.
        </p>

        {/* ── VIDEO EMBED ── */}
        <div style={{ background: "white", padding: 24, borderRadius: 16, border: "1px solid var(--grey-5)", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: 16, fontFamily: "var(--font-sans)" }}>Platform Overview</h2>
          <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", borderRadius: 12, overflow: "hidden", background: "var(--grey-6)" }}>
            <iframe 
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
              src="https://www.youtube.com/embed/Zy9NTqAUbj0?si=p7-mC5zJjU1bXz1V" 
              title="YouTube video player" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowFullScreen
            ></iframe>
          </div>
          <p style={{ marginTop: 16, fontSize: "0.95rem", color: "var(--grey-3)", lineHeight: 1.5 }}>
            This introductory video covers the core features of the platform, including how to import stories, configure your AI models, and use the AI Studio to generate new architectural renders and narratives.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Tutorials;
