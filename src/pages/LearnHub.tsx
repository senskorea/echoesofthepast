import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, CheckCircle, GraduationCap, ChevronRight, MessageCircle, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { MOOC_CONTENT, Module, MOOC_CURRICULUM_PROMPT } from "../data/learning-content";
import { useLanguage } from "../lib/i18n";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

const LearnHub = () => {
  const { t, lang } = useLanguage();
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [copied, setCopied] = useState(false);
  const [openTranscripts, setOpenTranscripts] = useState<Record<string, boolean>>({});
  const [quizAnswers, setQuizAnswers] = useState<Record<string, Record<number, number>>>(() => {
    const saved = localStorage.getItem("eop-quiz-answers");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return {}; }
    }
    return {};
  });

  const handleQuizSelect = (moduleId: string, qIndex: number, optionIndex: number) => {
    setQuizAnswers(prev => {
      const next = {
        ...prev,
        [moduleId]: {
          ...(prev[moduleId] || {}),
          [qIndex]: optionIndex
        }
      };
      localStorage.setItem("eop-quiz-answers", JSON.stringify(next));
      return next;
    });
  };

  const handleClearAnswer = (moduleId: string, qIndex: number) => {
    setQuizAnswers(prev => {
      const next = { ...prev };
      if (next[moduleId]) {
        const modAnswers = { ...next[moduleId] };
        delete modAnswers[qIndex];
        next[moduleId] = modAnswers;
      }
      localStorage.setItem("eop-quiz-answers", JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    const saved = localStorage.getItem("eop-completed-modules");
    if (saved) setCompletedModules(JSON.parse(saved));
  }, []);

  const toggleComplete = (id: string) => {
    const newCompleted = completedModules.includes(id)
      ? completedModules.filter(m => m !== id)
      : [...completedModules, id];
    setCompletedModules(newCompleted);
    localStorage.setItem("eop-completed-modules", JSON.stringify(newCompleted));
  };

  const handleCopyCurriculum = () => {
    navigator.clipboard.writeText(MOOC_CURRICULUM_PROMPT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const progress = Math.round((completedModules.length / MOOC_CONTENT.length) * 100);

  return (
    <div className="eop-root" style={{ minHeight: "100vh", background: "var(--grey-6)" }}>
      {/* ── NAV ── */}
      <header className="eop-nav">
        <Link to="/" className="eop-logo">
          <span className="eop-logo-dot" />
          <span>Echoes of the Past</span>
        </Link>
        <nav className="eop-nav-links">
          <LanguageSwitcher />
          <Link to="/" className="eop-nav-link" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> {t("nav_archive")}
          </Link>
        </nav>
      </header>

      <div className="pd-layout" style={{ maxWidth: 1000, margin: "40px auto 80px", padding: "0 24px" }}>
        {/* ── HERO ── */}
        <div style={{ marginBottom: 48, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <p className="eop-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <GraduationCap style={{ width: 14, height: 14 }} /> Erasmus+ Learning Hub
            </p>
            <h1 className="pd-title" style={{ fontSize: "2.5rem", marginBottom: 8 }}>Interactive AI Hub</h1>
            <p className="pd-description" style={{ maxWidth: 600 }}>
              Master the tools of digital preservation and historical analysis through our comprehensive 5-module curriculum.
            </p>
            <button 
              onClick={handleCopyCurriculum}
              style={{ 
                marginTop: 20, 
                display: "flex", 
                alignItems: "center", 
                gap: 8, 
                padding: "10px 16px", 
                borderRadius: 12, 
                fontSize: "0.85rem",
                fontWeight: 600,
                background: "white",
                border: "1px solid var(--grey-5)",
                color: "var(--grey-2)",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
              }}
            >
              {copied ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
              {copied ? "Curriculum Copied!" : "Copy Curriculum Guide"}
            </button>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--grey-3)", marginBottom: 8, fontWeight: 500 }}>Overall Progress — {progress}%</p>
            <div style={{ width: 200, height: 8, background: "white", borderRadius: 4, overflow: "hidden", border: "1px solid var(--grey-5)" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: "var(--grey-2)", transition: "width 0.5s ease" }} />
            </div>
          </div>
        </div>

        {selectedModule ? (
          /* ── MODULE DETAIL VIEW ── */
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button 
              onClick={() => setSelectedModule(null)}
              style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--grey-2)", fontSize: "0.9rem", marginBottom: 24, background: "none", border: "none", cursor: "pointer" }}
            >
              <ArrowLeft style={{ width: 16, height: 16 }} /> Back to Curriculum
            </button>

            <div style={{ background: "white", borderRadius: 20, border: "1px solid var(--grey-5)", padding: 32, boxShadow: "0 10px 30px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
                <div>
                  <p className="eop-label">Module {selectedModule.number}</p>
                  <h2 style={{ fontSize: "1.8rem", fontWeight: 500, fontFamily: "var(--font-serif)" }}>{selectedModule.title}</h2>
                </div>
                <button 
                  onClick={() => toggleComplete(selectedModule.id)}
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 8, 
                    padding: "10px 20px", 
                    borderRadius: 12, 
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    border: "1px solid var(--grey-5)",
                    background: completedModules.includes(selectedModule.id) ? "#ecfdf5" : "white",
                    color: completedModules.includes(selectedModule.id) ? "#059669" : "var(--grey-2)"
                  }}
                >
                  {completedModules.includes(selectedModule.id) ? <CheckCircle style={{ width: 18, height: 18 }} /> : null}
                  {completedModules.includes(selectedModule.id) ? "Module Completed" : "Mark as Complete"}
                </button>
              </div>

              {selectedModule.lessons.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 40 }}>
                  {selectedModule.lessons.map(lesson => (
                    <div key={lesson.id}>
                      <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", borderRadius: 16, overflow: "hidden", background: "var(--grey-6)", marginBottom: 24 }}>
                        <iframe 
                          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
                          src={`https://www.youtube.com/embed/${lesson.youtubeId}`}
                          title={lesson.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen
                        ></iframe>
                      </div>
                      <h3 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: 12 }}>{lesson.title}</h3>
                      <p style={{ color: "var(--grey-2)", lineHeight: 1.6, marginBottom: 24 }}>{lesson.description}</p>
                      
                      <div style={{ background: "var(--grey-6)", borderRadius: 12 }}>
                        <div 
                          style={{ padding: 24, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                          onClick={() => setOpenTranscripts(prev => ({ ...prev, [lesson.id]: !prev[lesson.id] }))}
                        >
                          <h4 style={{ fontSize: "0.9rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--grey-3)", margin: 0 }}>Transcript ({lang})</h4>
                          {openTranscripts[lesson.id] ? <ChevronUp style={{ width: 16, height: 16, color: "var(--grey-3)" }} /> : <ChevronDown style={{ width: 16, height: 16, color: "var(--grey-3)" }} />}
                        </div>
                        {openTranscripts[lesson.id] && (
                          <div style={{ padding: "0 24px 24px 24px", borderTop: "1px solid var(--grey-5)" }}>
                            <p style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "var(--grey-2)", whiteSpace: "pre-wrap", margin: 0, paddingTop: 16 }}>
                              {lesson.transcript[lang as keyof typeof lesson.transcript] || "Transcript not yet available in this language."}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {selectedModule.quiz && selectedModule.quiz.length > 0 && (
                    <div style={{ marginTop: 60, paddingTop: 40, borderTop: "2px solid var(--grey-6)" }}>
                      <h3 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: 24, fontFamily: "var(--font-serif)", color: "var(--grey-1)" }}>Module Assessment</h3>
                      <p style={{ color: "var(--grey-3)", marginBottom: 32 }}>Complete these questions to track your progress toward the 60% KPI.</p>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                        {selectedModule.quiz.map((q, qIndex) => {
                          const selectedOption = quizAnswers[selectedModule.id]?.[qIndex];
                          const isAnswered = selectedOption !== undefined;
                          const isCorrect = selectedOption === q.correctAnswer;
                          
                          return (
                            <div key={qIndex} style={{ background: "var(--grey-6)", padding: 24, borderRadius: 12 }}>
                              <p style={{ fontWeight: 500, fontSize: "1.05rem", marginBottom: 16, color: "var(--grey-1)" }}>
                                {qIndex + 1}. {q.question}
                              </p>
                              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {q.options.map((opt, optIndex) => {
                                  let bg = "white";
                                  let border = "1px solid var(--grey-5)";
                                  let color = "var(--grey-2)";
                                  
                                  if (isAnswered) {
                                    if (optIndex === q.correctAnswer) {
                                      bg = "#ecfdf5";
                                      border = "1px solid #10b981";
                                      color = "#065f46";
                                    } else if (optIndex === selectedOption) {
                                      bg = "#fef2f2";
                                      border = "1px solid #ef4444";
                                      color = "#991b1b";
                                    }
                                  }

                                  return (
                                    <button
                                      key={optIndex}
                                      disabled={isAnswered}
                                      onClick={() => handleQuizSelect(selectedModule.id, qIndex, optIndex)}
                                      style={{
                                        padding: "12px 16px",
                                        borderRadius: 8,
                                        background: bg,
                                        border: border,
                                        color: color,
                                        textAlign: "left",
                                        cursor: isAnswered ? "default" : "pointer",
                                        transition: "all 0.2s",
                                        fontSize: "0.95rem"
                                      }}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                              {isAnswered && (q as any).explanation && (
                                <div style={{ marginTop: 16, padding: 16, background: isCorrect ? "#ecfdf5" : "#fef2f2", borderRadius: 8, borderLeft: `4px solid ${isCorrect ? '#10b981' : '#ef4444'}` }}>
                                  <p style={{ margin: 0, fontSize: "0.9rem", color: isCorrect ? "#065f46" : "#991b1b" }}>
                                    <strong>{isCorrect ? "Correct!" : "Incorrect."}</strong> {(q as any).explanation}
                                  </p>
                                  {!isCorrect && (
                                    <button 
                                      onClick={() => handleClearAnswer(selectedModule.id, qIndex)}
                                      style={{ marginTop: 12, fontSize: "0.85rem", fontWeight: 600, color: "#991b1b", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                                    >
                                      Try Again
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "60px 0", color: "var(--grey-3)" }}>
                  <BookOpen style={{ width: 48, height: 48, margin: "0 auto 16px", opacity: 0.3 }} />
                  <p>Pedagogical content for this module is currently being finalized.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── DASHBOARD GRID ── */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
            {MOOC_CONTENT.map(module => {
              const isCompleted = completedModules.includes(module.id);
              return (
                <div 
                  key={module.id} 
                  className="pd-saved-asset"
                  style={{ 
                    background: "white", 
                    padding: 32, 
                    cursor: "pointer", 
                    transition: "transform 0.2s, box-shadow 0.2s",
                    border: isCompleted ? "1px solid #d1fae5" : "1px solid var(--grey-5)",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%"
                  }}
                  onClick={() => setSelectedModule(module)}
                >
                  {isCompleted && (
                    <div style={{ position: "absolute", top: 16, right: 16, color: "#10b981" }}>
                      <CheckCircle style={{ width: 20, height: 20 }} />
                    </div>
                  )}
                  <p className="eop-label" style={{ marginBottom: 12 }}>Module {module.number}</p>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 500, fontFamily: "var(--font-serif)", marginBottom: 16, color: "var(--grey-1)" }}>{module.title}</h3>
                  <p style={{ fontSize: "0.9rem", color: "var(--grey-3)", lineHeight: 1.6, flexGrow: 1 }}>{module.shortDesc}</p>
                  <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", fontWeight: 600, color: "var(--grey-2)" }}>
                    Enter Module <ChevronRight style={{ width: 14, height: 14 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnHub;
