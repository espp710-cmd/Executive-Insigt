import React, { useState, useEffect } from "react";
import { Question, CandidateResponse } from "./types";
import AdminPanel from "./components/AdminPanel";
import { 
  Briefcase, 
  ChevronRight, 
  Plus, 
  HelpCircle, 
  FileText, 
  CheckCircle, 
  Bell, 
  User, 
  ArrowLeft, 
  ArrowRight, 
  Lock, 
  Clock, 
  Share2, 
  BookOpen, 
  Settings, 
  Layout,  
  Copy, 
  Mail, 
  Sparkles, 
  Award, 
  Check, 
  Layers, 
  RefreshCcw, 
  Eye, 
  Volume2, 
  AlertCircle,
  Download,
  Instagram
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
  scale: number;
}

function Confetti() {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);

  useEffect(() => {
    const colors = ["#fbbf24", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#f59e0b", "#14b8a6"];
    const pts = Array.from({ length: 60 }).map((_, idx) => ({
      id: idx,
      x: Math.random() * 100, // horizontal start percent
      y: Math.random() * -30 - 10, // vertical start offset above threshold
      rotation: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 6,
      delay: Math.random() * 1.5,
      scale: Math.random() * 0.5 + 0.5,
    }));
    setParticles(pts);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[120]">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ 
            x: `${p.x}%`, 
            y: `${p.y}%`, 
            rotate: 0,
            scale: p.scale,
            opacity: 1 
          }}
          animate={{
            y: "115%",
            x: `${p.x + (Math.random() * 16 - 8)}%`,
            rotate: p.rotation + 540,
            opacity: [1, 1, 0.8, 0],
          }}
          transition={{
            duration: Math.random() * 2.5 + 2,
            delay: p.delay,
            ease: "easeOut",
          }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.id % 2 === 0 ? "50%" : p.id % 3 === 0 ? "1px" : "50% 10% 50% 10%",
          }}
        />
      ))}
    </div>
  );
}

export default function App() {
  // Navigation & Symmetrical topbar tabs
  const [activeTab, setActiveTab] = useState<"simulation" | "study" | "admin">("simulation");

  // App mode & security password states
  const [appMode, setAppMode] = useState<"pengunjung" | "admin">("pengunjung");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pwdInput, setPwdInput] = useState("");
  const [pwdError, setPwdError] = useState("");

  // Simulation status states
  const [step, setStep] = useState<"welcome" | "survey" | "completed" | "share">("welcome");
  const [candidateName, setCandidateName] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [surveyLength, setSurveyLength] = useState<number>(5); // default tests 5 questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [typedAnswer, setTypedAnswer] = useState("");
  
  // Storage for user answers
  const [responses, setResponses] = useState<CandidateResponse[]>([]);

  // AI analysis evaluation states
  const [aiAnalysis, setAiAnalysis] = useState<{
    ratingText: string;
    generalOverview: string;
    strengths: string[];
    improvements: string[];
    recommendation: string;
    score?: number;
  } | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null);

  // Symmetrical scroll to top effect or focus to active question
  useEffect(() => {
    if (step === "survey") {
      const t = setTimeout(() => {
        const qCard = document.getElementById("active-question-card");
        if (qCard) {
          qCard.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 80);
      return () => clearTimeout(t);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
      const t = setTimeout(() => {
        window.scrollTo({ top: 0 });
      }, 150);
      return () => clearTimeout(t);
    }
  }, [step, currentIndex]);
  
  // Interactive guideline toggle
  const [showExplanation, setShowExplanation] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Star rating and feedback comment states
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [userComment, setUserComment] = useState<string>("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);

  // Policy, Terms, Help, and About modals triggers
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  
  // Database context
  const [allQuestionsCount, setAllQuestionsCount] = useState(10);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // Load questions count from backend
  const loadDatabaseMetrics = async () => {
    try {
      const res = await fetch("/api/questions");
      if (res.ok) {
        const data = await res.json();
        setAllQuestionsCount(data.length);
      }
    } catch (err) {
      console.warn("Failed to contact database metrics on mount:", err);
    }
  };

  useEffect(() => {
    loadDatabaseMetrics();
  }, [activeTab]);

  // Start the interview simulation survey
  const startSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim()) return;

    setIsLoadingQuestions(true);
    try {
      // Pull random questions from backend
      const res = await fetch(`/api/questions/random?limit=${surveyLength}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
        setCurrentIndex(0);
        setSelectedScore(null);
        setTypedAnswer("");
        setResponses([]);
        setShowExplanation(false);
        setStep("survey");

        // Log this login event to backend as requested
        try {
          await fetch("/api/login-logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: candidateName.trim(),
              company: targetCompany.trim() || "Umum / Fresh Graduate",
              role: "candidate"
            })
          });
        } catch (err) {
          console.warn("Could not log candidate login:", err);
        }
      } else {
        alert("Gagal memuat pertanyaan dari server.");
      }
    } catch (err) {
      alert("Kesalahan koneksi saat menghubungi server simulasi.");
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Handle rating radio checking
  const handleScoreSelect = (score: number) => {
    setSelectedScore(score);
  };

  // Move back in survey
  const handleBack = () => {
    if (currentIndex > 0) {
      const previousIndex = currentIndex - 1;
      setCurrentIndex(previousIndex);
      // Restore previous score and typed answer
      const previousResponse = responses.find(r => r.questionId === questions[previousIndex].id);
      setSelectedScore(previousResponse ? previousResponse.score : null);
      setTypedAnswer(previousResponse ? (previousResponse.responseText || "") : "");
      setShowExplanation(false);
    } else {
      setStep("welcome");
    }
  };

  // Move forward or complete survey
  const handleNext = () => {
    const currentQuestion = questions[currentIndex];
    
    // Save or update response
    const newResponse: CandidateResponse = {
      questionId: currentQuestion.id,
      questionText: currentQuestion.text,
      category: currentQuestion.category,
      score: 5,
      responseText: typedAnswer
    };

    const updatedResponses = [...responses];
    const existingIndex = updatedResponses.findIndex(r => r.questionId === currentQuestion.id);
    
    if (existingIndex !== -1) {
      updatedResponses[existingIndex] = newResponse;
    } else {
      updatedResponses.push(newResponse);
    }
    
    setResponses(updatedResponses);

    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      
      // Load selected rating if already rated earlier
      const nextResponse = updatedResponses.find(r => r.questionId === questions[nextIndex].id);
      setSelectedScore(5);
      setTypedAnswer(nextResponse ? (nextResponse.responseText || "") : "");
      setShowExplanation(false);
    } else {
      // Finished simulation!
      setStep("completed");
      const avg = parseFloat((updatedResponses.reduce((acc, curr) => acc + curr.score, 0) / updatedResponses.length).toFixed(1));
      fetchAIAnalysis(updatedResponses, avg);
    }
  };

  const fetchAIAnalysis = async (currentResponses: CandidateResponse[], avg: number) => {
    setIsGeneratingAI(true);
    setAiAnalysisError(null);
    setAiAnalysis(null);
    try {
      const res = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: candidateName,
          responses: currentResponses,
          overallScore: avg
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data);
      } else {
        const errData = await res.json().catch(() => ({}));
        setAiAnalysisError(errData.error || "Gagal memuat analisis AI.");
      }
    } catch (err) {
      setAiAnalysisError("Gagal menghubungi server untuk analisis AI.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const calculateAverageConfidence = () => {
    if (responses.length === 0) return 0;
    const sum = responses.reduce((acc, curr) => acc + curr.score, 0);
    return parseFloat((sum / responses.length).toFixed(1));
  };

  const getInterpretationText = (avg: number) => {
    if (avg >= 4.5) return "Sangat Siap Kerja! Portofolio pemahaman Anda luar biasa.";
    if (avg >= 3.5) return "Cukup Matang. Siap menghadapi wawancara dengan sedikit sentuhan taktis.";
    if (avg >= 2.5) return "Kesiapan Rata-rata. Perlu banyak latihan skenario STAR dan melatih kepercayaan diri.";
    return "Butuh Pendampingan Lebih. Sangat disarankan mempelajari bank soal dan panduan HRD kembali.";
  };

  // Copy shareable link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Return categories frequency
  const getCategoryStats = () => {
    const stats: Record<string, { count: number; sum: number }> = {};
    responses.forEach(r => {
      if (!stats[r.category]) {
        stats[r.category] = { count: 0, sum: 0 };
      }
      stats[r.category].count += 1;
      stats[r.category].sum += r.score;
    });
    return Object.entries(stats).map(([name, val]) => ({
      name,
      avg: parseFloat((val.sum / val.count).toFixed(1))
    }));
  };

  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [showIGModal, setShowIGModal] = useState(false);

  // Helper for initiating secure, clean file downloads in sandboxed preview iframe contexts
  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const verifyPasswordAndEnterAdmin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pwdInput === "1011") {
      setAppMode("admin");
      setActiveTab("admin");
      setShowPasswordModal(false);
      setPwdInput("");
      setPwdError("");

      // Log admin login to backend as requested
      try {
        fetch("/api/login-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "Admin Panel Access",
            role: "admin"
          })
        });
      } catch (err) {
        console.warn("Could not log admin login:", err);
      }
    } else {
      setPwdError("Sandi salah! Silakan coba lagi.");
    }
  };

  const exportReport = async (type: string) => {
    setIsExporting(type);
    
    // De-activate and modify modern CSS color spaces oklch/oklab from document temporarily
    // because html2canvas's internal stylesheet parser fails on oklch/oklab functions with nested parenthesis
    const styleTags = Array.from(document.getElementsByTagName("style"));
    const savedStyles = styleTags.map(tag => ({
      tag,
      originalHTML: tag.innerHTML
    }));

    // Define and configure CSSOM / style API wrappers to intercept oklch/oklab color retrievals
    const cssRuleProto = typeof CSSRule !== "undefined" ? CSSRule.prototype : null;
    const cssStyleDeclProto = typeof CSSStyleDeclaration !== "undefined" ? CSSStyleDeclaration.prototype : null;

    const originalCssTextDesc = cssRuleProto ? Object.getOwnPropertyDescriptor(cssRuleProto, "cssText") : null;
    const originalGetPropertyValue = cssStyleDeclProto ? cssStyleDeclProto.getPropertyValue : null;
    const originalGetComputedStyle = window.getComputedStyle;

    const cleanColor = (val: any): any => {
      if (!val || typeof val !== "string") return val;
      if (!val.includes("oklch") && !val.includes("oklab")) return val;

      let result = "";
      let i = 0;
      while (i < val.length) {
        if (val.substring(i, i + 6) === "oklch(" || val.substring(i, i + 6) === "oklab(") {
          i += 6;
          let parenCount = 1;
          while (i < val.length && parenCount > 0) {
            if (val[i] === "(") {
              parenCount++;
            } else if (val[i] === ")") {
              parenCount--;
            }
            i++;
          }
          result += "rgb(59, 130, 246)"; // Standard bootstrap/tailwind blue fallback
        } else {
          result += val[i];
          i++;
        }
      }
      return result;
    };

    try {
      // 1. Sanitize standard <style> tags innerHTML
      styleTags.forEach(tag => {
        let cssText = tag.innerHTML;
        if (cssText.includes("oklch") || cssText.includes("oklab")) {
          tag.innerHTML = cleanColor(cssText);
        }
      });

      // 2. Intercept CSSRule.prototype.cssText safely
      if (cssRuleProto && originalCssTextDesc) {
        Object.defineProperty(cssRuleProto, "cssText", {
          get() {
            try {
              const txt = originalCssTextDesc.get ? originalCssTextDesc.get.call(this) : "";
              return cleanColor(txt);
            } catch (e) {
              return "";
            }
          },
          configurable: true
        });
      }

      // 3. Intercept CSSStyleDeclaration.prototype.getPropertyValue safely without breaking proxies
      if (cssStyleDeclProto && originalGetPropertyValue) {
        cssStyleDeclProto.getPropertyValue = function(this: any, property: string) {
          try {
            const val = originalGetPropertyValue.call(this, property);
            return cleanColor(val);
          } catch (e) {
            try {
              const directVal = this[property];
              if (typeof directVal === "string") {
                return cleanColor(directVal);
              }
            } catch (err) {}
            return "";
          }
        };
      }

      // 4. Intercept window.getComputedStyle safely with Proxy wrapper, binding style methods back to original target to avoid receiver error (Illegal invocation)
      window.getComputedStyle = function(el: Element, pseudo?: string) {
        const style = originalGetComputedStyle(el, pseudo);
        return new Proxy(style, {
          get(target, prop) {
            const val = Reflect.get(target, prop);
            if (typeof val === "function") {
              return val.bind(target);
            }
            if (typeof val === "string") {
              return cleanColor(val);
            }
            return val;
          }
        });
      };

      let targetId = "eval-report-card";
      if (type === "ig") targetId = "ig-story-card";
      if (type === "certificate_pdf" || type === "certificate_jpg") targetId = "certificate-card";

      const element = document.getElementById(targetId);
      if (!element) {
        alert("Elemen kartu laporan tidak ditemukan.");
        return;
      }

      // Optimize html2canvas configuration for frames context rendering with explicit properties
      const canvas = await html2canvas(element, {
        scale: (type === "ig" || type === "certificate_pdf" || type === "certificate_jpg") ? 2.0 : 1.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: type === "ig" ? "#020617" : ((type === "certificate_pdf" || type === "certificate_jpg") ? "#fffdf5" : "#ffffff"),
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      if (type === "png" || type === "ig") {
        canvas.toBlob((blob) => {
          if (blob) {
            const fileName = type === "ig"
              ? `IG_Story_Evaluasi_${candidateName.trim().replace(/\s+/g, "_") || "Kandidat"}.png`
              : `Kartu_Laporan_Evaluasi_${candidateName.trim().replace(/\s+/g, "_") || "Kandidat"}.png`;
            downloadBlob(blob, fileName);
            if (type === "ig") {
              setShowIGModal(true);
            }
          } else {
            alert("Gagal mengkonversi gambar kartu.");
          }
        }, "image/png");
      } else if (type === "certificate_jpg") {
        canvas.toBlob((blob) => {
          if (blob) {
            const fileName = `Sertifikat_Simulasi_${candidateName.trim().replace(/\s+/g, "_") || "Kandidat"}.jpg`;
            downloadBlob(blob, fileName);
          } else {
            alert("Gagal mengkonversi gambar sertifikat.");
          }
        }, "image/jpeg", 0.95);
      } else if (type === "certificate_pdf") {
        const pdf = new jsPDF("l", "mm", "a4");
        const imgWidth = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
        const pdfBlob = pdf.output("blob");
        downloadBlob(pdfBlob, `Sertifikat_Simulasi_${candidateName.trim().replace(/\s+/g, "_") || "Kandidat"}.pdf`);
      } else {
        const pdf = new jsPDF("p", "mm", "a4");
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        const pdfBlob = pdf.output("blob");
        downloadBlob(pdfBlob, `Kartu_Laporan_Evaluasi_${candidateName.trim().replace(/\s+/g, "_") || "Kandidat"}.pdf`);
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("Terjadi kesalahan saat mengunduh dokumen laporan: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      // Restore dynamic color interception mechanisms and style tags back to original states
      if (cssRuleProto && originalCssTextDesc) {
        Object.defineProperty(cssRuleProto, "cssText", originalCssTextDesc);
      }
      if (cssStyleDeclProto && originalGetPropertyValue) {
        cssStyleDeclProto.getPropertyValue = originalGetPropertyValue;
      }
      window.getComputedStyle = originalGetComputedStyle;

      savedStyles.forEach(item => {
        item.tag.innerHTML = item.originalHTML;
      });
      setIsExporting(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] flex flex-col font-sans relative">
      
      {/* HEADER SECTION - Symmetrical modern navbar identical to designs */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-50 h-16 shadow-xs">
        <div className="max-w-[1280px] w-full mx-auto px-4 md:px-8 h-full flex items-center justify-between">
          
          {/* Logo Brand Title */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setStep("welcome"); setActiveTab("simulation"); }}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
            <span className="font-serif text-lg md:text-xl font-bold tracking-tight text-slate-800 hover:opacity-100 transition-opacity">
              Executive <span className="text-blue-600 font-extrabold font-sans">Insights</span>
            </span>
          </div>

          {/* Symmetrical Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/50">
            <button
              onClick={() => { setActiveTab("simulation"); }}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === "simulation" 
                  ? "bg-white text-blue-600 shadow-sm border border-slate-200/60" 
                  : "text-slate-600 hover:text-slate-950"
              }`}
            >
              <Layout size={14} className="text-blue-500" />
              Sesi Simulasi
            </button>
            {appMode === "admin" && (
              <button
                onClick={() => { setActiveTab("admin"); }}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === "admin" 
                    ? "bg-white text-blue-600 shadow-sm border border-slate-200/60" 
                    : "text-slate-600 hover:text-slate-950"
                }`}
              >
                <Settings size={14} className="text-blue-500" />
                Atur Pertanyaan (Backend)
              </button>
            )}
          </nav>

          {/* Right Symmetrical controls */}
          <div className="flex items-center gap-2">
            
            {/* Mode Switcher Badge/Button */}
            {appMode === "admin" && (
              <div className="flex items-center gap-1.5">
                <span className="hidden lg:inline-flex items-center bg-amber-50 text-amber-800 text-[9px] font-bold px-2 py-1 rounded border border-amber-200 tracking-wider uppercase animate-pulse">
                  🛡️ Mode Admin Aktif
                </span>
                <button 
                  onClick={() => {
                    setAppMode("pengunjung");
                    if (activeTab === "admin") {
                      setActiveTab("simulation");
                    }
                  }}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold rounded-lg border border-rose-200/60 transition-all cursor-pointer active:scale-95"
                >
                  Keluar Admin
                </button>
              </div>
            )}
            
             {/* Notification bell removed as requested */}
            
            {/* Dynamic User Avatar adapting to first abjad character as requested */}
            <button className="flex items-center gap-1.5 p-1.5 pl-3 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors">
              <span className="hidden md:inline text-xs font-semibold text-slate-700 max-w-20 truncate">
                {candidateName.trim() ? candidateName.trim() : "Interviewee"}
              </span>
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-mono uppercase">
                {candidateName.trim() ? candidateName.trim().charAt(0).toUpperCase() : "I"}
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE COMPANION TAB NAVIGATION */}
      <div className="flex md:hidden border-b border-slate-200 bg-white p-2 sticky top-16 z-40 gap-1 overflow-x-auto justify-center">
        <button
          onClick={() => setActiveTab("simulation")}
          className={`flex-1 text-center py-2 px-3 text-xs font-bold rounded-lg transition-all ${
            activeTab === "simulation" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Sesi Simulasi
        </button>
        {appMode === "admin" && (
          <button
            onClick={() => setActiveTab("admin")}
            className={`flex-1 text-center py-2 px-3 text-xs font-bold rounded-lg transition-all ${
              activeTab === "admin" ? "bg-blue-600 text-white shadow-md shadow-blue-500/10" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Backend ⚙️
          </button>
        )}
      </div>

      {/* MAIN CANVAS LAYOUT WITH WATERMARK GRID BACKGROUND */}
      <main className={`flex-grow canvas-bg flex flex-col justify-start items-center px-4 md:px-8 ${activeTab === "admin" ? "py-2 pt-0 pb-10" : "py-10"}`}>
        
        {/* TAB 1: INTERACTIVE SIMULATION SURVEY ROAD */}
        {activeTab === "simulation" && (
          <div className="w-full max-w-4xl mx-auto flex flex-col justify-start items-center">
            
            {/* Elegant steppers/sequence timeline tracker */}
            <div className="w-full max-w-2xl bg-white border border-slate-200/90 rounded-2xl p-4 mb-8 flex items-center justify-between shadow-xs">
              
              {/* Step 1: Data Diri */}
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs font-mono border-2 transition-all ${
                  step === "welcome"
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-emerald-50 border-emerald-300 text-emerald-700"
                }`}>
                  {step === "welcome" ? "1" : "✓"}
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Tahap 1</p>
                  <p className={`text-xs font-bold leading-tight ${step === "welcome" ? "text-blue-600 font-extrabold" : "text-slate-705 font-semibold"}`}>Pengisian Data Diri</p>
                </div>
              </div>

              {/* Progress line */}
              <div className="hidden sm:block flex-grow h-px bg-slate-205 mx-4 max-w-16" />

              {/* Step 2: Sesi Soal */}
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs font-mono border-2 transition-all ${
                  step === "survey"
                    ? "bg-blue-600 border-blue-600 text-white font-extrabold"
                    : step === "completed" || step === "share"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                    : "bg-slate-50 border-slate-205 text-slate-400"
                }`}>
                  {step === "completed" || step === "share" ? "✓" : "2"}
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Tahap 2</p>
                  <p className={`text-xs font-bold leading-tight ${step === "survey" ? "text-blue-600 font-extrabold" : (step === "completed" || step === "share") ? "text-slate-705 font-semibold" : "text-slate-400"}`}>Sesi Soal</p>
                </div>
              </div>

              {/* Progress line */}
              <div className="hidden sm:block flex-grow h-px bg-slate-205 mx-4 max-w-16" />

              {/* Step 3: Nilai */}
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs font-mono border-2 transition-all ${
                  step === "completed" || step === "share"
                    ? "bg-blue-600 border-blue-600 text-white font-extrabold"
                    : "bg-slate-50 border-slate-205 text-slate-400"
                }`}>
                  3
                </div>
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Tahap 3</p>
                  <p className={`text-xs font-bold leading-tight ${(step === "completed" || step === "share") ? "text-blue-600 font-extrabold" : "text-slate-400"}`}>Nilai & Sertifikat</p>
                </div>
              </div>

            </div>
            
            {/* STEP 1: WELCOME SCREEN (Matches design screenshot #2) */}
            {step === "welcome" && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl text-center space-y-6"
              >
                {/* Visual support watermark icon block */}
                <div className="absolute top-24 left-10 opacity-5 hidden xl:block select-none pointer-events-none">
                  <span className="text-9xl">🏢</span>
                </div>
                <div className="absolute bottom-24 right-10 opacity-5 hidden xl:block select-none pointer-events-none">
                  <span className="text-9xl">🎓</span>
                </div>

                {/* Verified badge chip */}
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-200/80 text-blue-700 rounded-full tracking-wide text-xs font-bold uppercase shadow-xs">
                    <Sparkles size={14} className="text-blue-600" />
                    <span>Latihan Simulasi Fresh Graduate</span>
                  </div>

                  <h1 className="font-serif text-3xl md:text-5xl text-slate-900 leading-tight tracking-tight font-bold max-w-lg mx-auto">
                    Kesiapan Interview Baru Menanti 👋
                  </h1>

                  <p className="text-md md:text-lg text-slate-600 max-w-md mx-auto leading-relaxed">
                    Ukur kematangan Anda menjawab pertanyaan HRD, pelajari skenario jawaban ideal, dan tingkatkan daya tawar profesional Anda! ✨
                  </p>
                </div>

                {/* Primary Interactive Container */}
                <div className="bg-white rounded-xl border border-slate-200/85 p-6 md:p-10 soft-elevation text-left space-y-6 relative z-10">
                  <form onSubmit={startSimulation} className="space-y-6">
                    
                    {/* Candidate Input */}
                    <div className="space-y-2">
                      <label htmlFor="input-candidate-name" className="text-xs font-bold text-slate-800 uppercase tracking-widest block">
                        Masukkan Nama Lengkap Anda
                      </label>
                      <div className="relative">
                        <input
                          id="input-candidate-name"
                          type="text"
                          required
                          value={candidateName}
                          onChange={(e) => setCandidateName(e.target.value)}
                          placeholder="Contoh: Budi Santoso"
                          className="w-full h-14 px-5 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-slate-900/15 focus:border-slate-800 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Target Company Input as requested */}
                    <div className="space-y-2">
                      <label htmlFor="input-target-company" className="text-xs font-bold text-slate-850 uppercase tracking-widest block">
                        Perusahaan Target Yang Mau Dimasuki
                      </label>
                      <div className="relative">
                        <input
                          id="input-target-company"
                          type="text"
                          required
                          value={targetCompany}
                          onChange={(e) => setTargetCompany(e.target.value)}
                          placeholder="Contoh: PT GoTo Gojek Tokopedia, Shopee, Bank Indonesia"
                          className="w-full h-14 px-5 bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-slate-900/15 focus:border-slate-800 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Question Pool Length Selector */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-widest block">
                        Jumlah Soal Wawancara ({surveyLength} Soal)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[3, 5, 10].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setSurveyLength(num)}
                            className={`py-3 text-xs font-bold rounded-lg border transition-all ${
                              surveyLength === num 
                                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10" 
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {num === 10 ? "Full 10 Soal" : `${num} Soal Random`}
                          </button>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        *Soal akan diambil secara acak dari database agar tidak membosankan (ga itu-itu aja).
                      </p>
                    </div>

                    {/* Start Action */}
                    <button
                      type="submit"
                      disabled={isLoadingQuestions}
                      className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 active:scale-98 shadow-md disabled:bg-slate-400"
                    >
                      {isLoadingQuestions ? "Menyiapkan Sesi..." : "Mulai Simulasi Wawancara"}
                      <ArrowRight size={16} />
                    </button>
                  </form>

                  {/* Trust metrics indicators block */}
                  <div className="pt-6 border-t border-slate-100 flex justify-center gap-6 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-400" />
                      <span>Estimasi {surveyLength * 1} Menit</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: ACTIVE SURVEY INTERACTIVE RATING (Matches design screenshot #1) */}
            {step === "survey" && questions[currentIndex] && (
              <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
                
                {/* Custom Sidebar Question Number Grid Boxes on Left/Right side */}
                <div className="lg:col-span-3 bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-xs sticky top-20">
                  <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase flex items-center gap-1.5 border-b border-slate-100 pb-3">
                    <span>📋</span> Sesi Simulasi [{currentIndex + 1}/{questions.length}]
                  </h3>
                  <div className="grid grid-cols-5 gap-2">
                    {questions.map((q, idx) => {
                      const isAnswered = responses.some(r => r.id === q.id && r.answer && r.answer.trim().length > 0) || (idx === currentIndex && typedAnswer.trim().length > 0);
                      const isActive = idx === currentIndex;
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => {
                            // Automatically save current input before jumping
                            if (typedAnswer.trim().length > 0) {
                              const alreadyResponseIndex = responses.findIndex(r => r.id === questions[currentIndex].id);
                              if (alreadyResponseIndex !== -1) {
                                responses[alreadyResponseIndex].answer = typedAnswer;
                              } else {
                                responses.push({
                                  id: questions[currentIndex].id,
                                  question: questions[currentIndex].text,
                                  score: null,
                                  justification: "",
                                  rating: questions[currentIndex].category,
                                  answer: typedAnswer
                                });
                              }
                            }
                            setCurrentIndex(idx);
                            // Load previous typing if any
                            const previousResponse = responses.find(r => r.id === questions[idx].id);
                            setTypedAnswer(previousResponse ? previousResponse.answer : "");
                          }}
                          className={`h-11 rounded-xl text-xs font-mono font-bold flex items-center justify-center transition-all cursor-pointer border ${
                            isActive
                              ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10 scale-105"
                              : isAnswered
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                              : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                          }`}
                        >
                          {String(idx + 1).padStart(2, "0")}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-[10px] space-y-1.5 pt-2 border-t border-slate-100 text-slate-500 font-medium">
                    <p className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-blue-600 rounded-sm inline-block" />
                      <span>Sesi Aktif</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-emerald-50 border border-emerald-200 rounded-sm inline-block" />
                      <span>Sudah Terjawab</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-slate-50 border border-slate-200 rounded-sm inline-block" />
                      <span>Belum Terjawab</span>
                    </p>
                  </div>
                </div>

                <motion.div 
                  key={currentIndex}
                  id="active-question-card"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="lg:col-span-9 w-full space-y-6"
                >
                
                {/* Progression Track Header */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end px-1">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Simulasi HRD Kesiapan Karir
                    </span>
                    <span className="font-serif text-lg md:text-xl font-bold text-slate-950">
                      {currentIndex + 1} <span className="text-slate-400 font-sans text-xs font-medium">/ {questions.length}</span>
                    </span>
                  </div>
                  {/* Custom progress tracking line */}
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-blue-600 rounded-full"
                      animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                      transition={{ type: "spring", stiffness: 100, damping: 16 }}
                    />
                  </div>
                </div>

                {/* Primary Card */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 md:p-10 soft-elevation space-y-8 relative overflow-hidden">
                  
                  {/* Decorative background circle accent */}
                  <div className="absolute -top-16 -right-16 w-56 h-56 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>
                  
                  {/* Active Question Meta ID Badging */}
                  <div className="relative z-10">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded-lg text-xs tracking-wider border border-blue-200/60">
                        Pertanyaan {String(currentIndex + 1).padStart(2, "0")}
                      </span>
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md">
                        {questions[currentIndex].category}
                      </span>
                      <div className="h-px flex-grow bg-slate-100"></div>
                    </div>

                    {/* Question Content in large serif display typography */}
                    <h2 className="font-serif text-2xl md:text-3xl text-slate-900 leading-snug font-bold my-6">
                      {questions[currentIndex].text}
                    </h2>
                  </div>
                  
                  {/* WRITTEN ANSWER INPUT (Added to fix "kolom jawaban agar sesuai dengan apa yang ditanyakan") */}
                  <div className="space-y-3 bg-slate-50/40 p-5 rounded-2xl border border-slate-100">
                    <label htmlFor="written-answer" className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                      <span>✍️</span> Kolom Jawaban Anda (Ketik Skenario Draft Jawaban Anda):
                    </label>
                    <textarea
                      id="written-answer"
                      rows={4}
                      value={typedAnswer}
                      onChange={(e) => setTypedAnswer(e.target.value)}
                      placeholder="Tuliskan respon lisan atau ide poin-poin jawaban Anda di sini sebelum mengakhiri. Gunakan kerangka STAR (Situation, Task, Action, Result) untuk struktur yang kokoh..."
                      className="w-full p-4 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-hidden text-slate-800 text-sm font-medium bg-white transition-all resize-y shadow-xs"
                    />
                    <div className="flex justify-between items-center text-[11px] text-slate-400 font-medium">
                      <span>Latihlah agar jawaban terdengar profesional, jujur, dan berorientasi solusi.</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-mono">{typedAnswer.length} karakter</span>
                    </div>
                  </div>

                  {/* Navigation Toolbar (Matches designs #1 strictly) */}
                  <div className="flex flex-col md:flex-row justify-between items-center gap-3 pt-6 border-t border-slate-100 pb-2">
                    <button
                      onClick={handleBack}
                      className="w-full md:w-auto px-6 py-3 border border-slate-200 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 active:scale-97"
                    >
                      <ArrowLeft size={16} />
                      Kembali
                    </button>
                    
                    <button
                      onClick={handleNext}
                      className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-97"
                    >
                      {currentIndex === questions.length - 1 ? "Selesaikan Evaluasi" : "Simpan & Lanjut"}
                      <ArrowRight size={16} />
                    </button>
                  </div>

                </div>

                {/* Subtext warning tag */}
                <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-1">
                  <Lock size={12} className="text-slate-400" />
                  <span>Materi simulasi dievaluasi mandiri untuk meningkatkan kesiapan karir internal Anda.</span>
                </p>
              </motion.div>
              </div>
            )}

            {/* STEP 3: COMPLETED REPORT / ACHIEVEMENTS CONFIRMATION (Matches screenshot #3) */}
            {step === "completed" && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-3xl text-center space-y-8"
              >
                
                {/* Verified user animation circle banner */}
                <div className="relative inline-block mt-4">
                  <div className="bg-white rounded-full p-6 border border-slate-100 shadow-md flex items-center justify-center">
                    <CheckCircle size={64} className="text-blue-600" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-blue-600 border-2 border-white text-md p-2 rounded-full shadow-md">
                    🏆
                  </div>
                </div>

                {/* Warm Greeting Feedback */}
                <div className="space-y-3">
                  <h1 className="font-serif text-3xl md:text-4xl text-slate-900 tracking-tight leading-tight font-bold">
                    Terima Kasih Atas Partisipasi Anda! 🤝
                  </h1>
                  <p className="text-sm md:text-md text-slate-600 max-w-md mx-auto leading-relaxed">
                    Sesi pengujian selesai, <span className="font-bold text-slate-900">{candidateName}</span>. Wawasan dan penilaian jujur Anda sangat berguna mengevaluasi kesiapan karir kerja.
                  </p>
                </div>

                {/* EXPORT DOCUMENT TRIGGER BUTTONS */}
                <div className="bg-blue-50/50 border border-blue-100/80 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-left shadow-xs">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
                      <span>🏆</span> Unduh Sertifikat Simulasi Wawancara Kerja
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Dapatkan rangkuman pencapaian skor dan predikat kelayakan Anda dalam file Sertifikat PDF formal standar HRD.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2.5 shrink-0">
                    <button
                      onClick={() => setShowCertificateModal(true)}
                      disabled={isGeneratingAI}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5 active:scale-97 border-none"
                    >
                      <Eye size={14} className="text-white" />
                      Pratinjau Sertifikat
                    </button>
                    <button
                      onClick={() => exportReport("certificate_pdf")}
                      disabled={isGeneratingAI || isExporting !== null}
                      className="px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-90 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5 active:scale-97 border-none"
                    >
                      <Award size={14} className="text-white" />
                      {isGeneratingAI ? "Menilai AI..." : isExporting === "certificate_pdf" ? "Mengekspor PDF..." : "Unduh Sertifikat (PDF)"}
                    </button>
                    <button
                      onClick={() => exportReport("certificate_jpg")}
                      disabled={isGeneratingAI || isExporting !== null}
                      className="px-4 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:opacity-90 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5 active:scale-97 border-none"
                    >
                      <Download size={14} className="text-white" />
                      {isGeneratingAI ? "Menilai AI..." : isExporting === "certificate_jpg" ? "Mengekspor JPG..." : "Unduh Sertifikat (JPG)"}
                    </button>
                  </div>
                </div>

                {/* KARTU LAPORAN PORTION (This is captured for PDF/PNG download) */}
                <div id="eval-report-card" className="bg-white rounded-2xl border border-slate-200/95 shadow-lg p-6 md:p-8 text-left space-y-5 relative overflow-hidden">
                  
                  {/* Watermark branding header for formal documents */}
                  <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <div className="w-4 h-4 bg-white rounded-sm"></div>
                      </div>
                      <div>
                        <span className="font-serif text-md font-bold tracking-tight text-slate-800">
                          Executive <span className="text-blue-600">Insights</span>
                        </span>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Laporan Evaluasi Karir</p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs font-bold text-slate-800">KARTU HASIL SIMULASI WAWANCARA</p>
                      <p className="text-[10px] text-slate-400 font-mono">Dibuat: {new Date().toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>

                  {/* Candidate Bio Block */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Nama Kandidat</p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{candidateName}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Aspek Pengujian (Sesi Terjawab)</p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{responses.length} Pertanyaan HRD</p>
                    </div>
                  </div>

                  {/* Bento Performance Block */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Left: Overall Completion Status */}
                    <div className="bg-slate-50/30 p-5 border border-slate-200/60 rounded-xl flex flex-col justify-between space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="bg-blue-50 text-blue-800 px-2.5 py-0.5 font-bold rounded text-[9px] uppercase tracking-wide border border-blue-100">
                          SKOR KELAYAKAN KERJA
                        </span>
                        <Award size={16} className="text-blue-600" />
                      </div>
                      <div>
                        {isGeneratingAI ? (
                          <p className="text-3xl font-extrabold text-blue-600 font-mono animate-pulse">MENILAI...</p>
                        ) : (
                          <p className="text-3xl font-extrabold text-blue-600 font-mono">
                            {aiAnalysis?.score || 85} <span className="text-xs text-slate-400 font-normal">/ 100</span>
                          </p>
                        )}
                        <p className="text-xs font-bold text-slate-800 mt-1">
                          Berdasarkan ulasan AI untuk draf {responses.length} jawaban Anda.
                        </p>
                      </div>
                    </div>

                    {/* Right: AI Quick Verdict */}
                    <div className="bg-slate-50/30 p-5 border border-slate-200/60 rounded-xl flex flex-col justify-between space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="bg-emerald-50 text-emerald-800 px-2.5 py-0.5 font-bold rounded text-[9px] uppercase tracking-wide border border-emerald-100">
                          VERDIKT UTAMA AI
                        </span>
                        <Sparkles size={16} className="text-emerald-600" />
                      </div>
                      <div>
                        {isGeneratingAI ? (
                          <div className="space-y-2 animate-pulse">
                            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                            <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                          </div>
                        ) : aiAnalysisError ? (
                          <p className="text-xs text-red-500 font-semibold">{aiAnalysisError}</p>
                        ) : (
                          <>
                            <p className="text-xs font-bold text-slate-900 leading-tight">{aiAnalysis?.ratingText || "Mengevaluasi..."}</p>
                            <p className="text-[10px] text-slate-500 mt-1">Sertifikat hasil evaluasi karir profesional siap diunduh.</p>
                          </>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* AI Deep Analysis Section */}
                  <div className="bg-blue-50/20 p-5 border border-blue-100/50 rounded-xl space-y-3">
                    <h4 className="text-xs font-extrabold text-blue-950 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles size={13} className="text-blue-600" /> Hasil Analisis Evaluasi AI mendalam:
                    </h4>
                    
                    {isGeneratingAI ? (
                      <div className="space-y-2 animate-pulse py-2">
                        <div className="h-3 bg-slate-200 rounded w-full"></div>
                        <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                        <div className="h-3 bg-slate-200 rounded w-4/5"></div>
                      </div>
                    ) : aiAnalysisError ? (
                      <div className="text-xs text-slate-600 space-y-2">
                        <p className="text-red-500 font-semibold">{aiAnalysisError}</p>
                        <button 
                          onClick={() => fetchAIAnalysis(responses, calculateAverageConfidence())} 
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold"
                        >
                          Coba Lagi Analisis AI
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 text-xs text-slate-700">
                        <p className="leading-relaxed font-normal">{aiAnalysis?.generalOverview || `Mengumpulkan data draf jawaban kandidat. Hasil evaluasi AI akan memberikan skor kelayakan kerja skala 10-100 serta menyajikan kritik konstruktif dan tajam untuk menyempurnakan struktur jawaban Anda.`}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                          <div className="bg-white p-3 rounded-lg border border-slate-150 shadow-2xs space-y-1.5">
                            <h5 className="font-bold text-[10px] text-emerald-800 uppercase tracking-wider">🌟 Sektor Kelebihan:</h5>
                            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                              {(aiAnalysis?.strengths || ["Responsif dalam simulasi", "Pemetaan draf terstruktur"]).map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="bg-white p-3 rounded-lg border border-slate-150 shadow-2xs space-y-1.5">
                            <h5 className="font-bold text-[10px] text-amber-800 uppercase tracking-wider">⚠️ Area Pengembangan:</h5>
                            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
                              {(aiAnalysis?.improvements || ["Perjelas metode STAR saat perkenalan", "Sebutkan angka konkret"]).map((imp, i) => (
                                <li key={i}>{imp}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="bg-amber-50/40 p-3 rounded-lg border border-amber-100/50 mt-1">
                          <p className="font-bold text-[10px] text-amber-900 uppercase tracking-wider mb-0.5">📌 Rekomendasi Taktis HRD:</p>
                          <p className="text-[11px] text-slate-600 italic leading-relaxed">
                            {aiAnalysis?.recommendation || "Latihlah artikulasi draf jawaban menggunakan kerangka Situation-Task-Action-Result agar meyakinkan rekruter institusi."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Compact Responses List row-based scoring breakdown inside card */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <h4 className="font-serif text-xs font-bold text-slate-800 flex items-center gap-1">
                      <span>📋</span> Ringkasan Daftar Jawaban Simulasi Wawancara
                    </h4>
                    
                    <div className="grid grid-cols-1 gap-2">
                      {responses.map((resp, idx) => (
                        <div key={resp.questionId} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-slate-50/50 border border-slate-100 rounded-xl gap-2 text-xs">
                          <div className="space-y-0.5 max-w-lg">
                            <p className="font-bold text-slate-900">
                              #{idx + 1}. <span className="text-slate-500 font-normal uppercase text-[9px] tracking-wider font-mono px-1.5 py-0.2 bg-slate-200/50 rounded">{resp.category}</span> {resp.questionText}
                            </p>
                            <p className="text-[11px] text-slate-600 line-clamp-1 italic">
                              Jawaban Anda: {resp.responseText?.trim() ? `"${resp.responseText}"` : "Tidak ada jawaban tertulis"}
                            </p>
                          </div>
                          <span className="shrink-0 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold border border-emerald-150 rounded-lg text-xs tracking-wide">
                            ✓ Terjawab
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Watermarked quote footer inside card */}
                  <div className="border-t border-slate-100 pt-3.5 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400 font-medium">
                    <span>Laporan Resmi &bull; Executive Insights AI Analyzer</span>
                    <span className="italic mt-1 sm:mt-0">"Melangkah siap dengan pondasi evaluasi jujur."</span>
                  </div>

                </div>

                {/* HIDDEN PORTRAIT 9:16 INSTAGRAM STORY CARD FOR EXPORT */}
                <div 
                  id="ig-story-card" 
                  style={{ width: "400px", height: "711px", position: "absolute", left: "-9999px", top: "-9999px" }} 
                  className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-8 flex flex-col justify-between text-white font-sans overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-xs"></div>
                      </div>
                      <div>
                        <span className="font-serif text-sm font-bold tracking-tight text-white">
                          Executive <span className="text-blue-400">Insights</span>
                        </span>
                        <p className="text-[8px] text-slate-400 uppercase tracking-widest font-bold">Laporan Karir AI</p>
                      </div>
                    </div>
                    <span className="text-[9px] bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-400/20">
                      Instagram Story
                    </span>
                  </div>

                  <div className="space-y-6 my-auto text-left py-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-blue-300 uppercase font-bold tracking-wider">Hasil Evaluasi Simulasi</p>
                      <h1 className="text-3xl font-serif font-extrabold text-white leading-tight tracking-tight leading-none">
                        {candidateName || "Kandidat"}
                      </h1>
                      <p className="text-xs text-slate-400">Dibuat pada: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between relative overflow-hidden">
                      <div className="space-y-1">
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Skor Kelayakan AI</p>
                        <p className="text-4xl font-extrabold text-blue-400 leading-none mt-1 font-mono">
                          {aiAnalysis?.score || 85} <span className="text-xs font-normal text-slate-450">/ 100</span>
                        </p>
                        <p className="text-[11px] text-slate-300 font-semibold bg-white/5 px-2 py-0.5 rounded border border-white/10 mt-2 inline-block">
                          {responses.length} Pertanyaan Kerja
                        </p>
                      </div>
                      <div className="text-5xl opacity-40">🏆</div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider flex items-center gap-1">
                        <span>✨</span> Hasil Analisis AI:
                      </p>
                      <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-xs space-y-2">
                        <h4 className="font-bold text-white text-xs">{aiAnalysis?.ratingText || "Kesiapan Teruji"}</h4>
                        <p className="text-slate-350 leading-relaxed text-[11px] text-justify">
                          {aiAnalysis?.generalOverview || `Simulasi ${responses.length} pertanyaan wawancara selesai. Menunjukkan motivasi serta pemikiran analitis yang adaptif untuk tantangan karir junior.`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                    <span>Latih Kesiapan Anda Hari Ini!</span>
                    <span className="text-blue-400 font-bold">Executive Insights AI</span>
                  </div>
                </div>

                {/* HIDDEN LANDSCAPE A4 CERTIFICATE CARD FOR EXPORT */}
                <div 
                  id="certificate-card" 
                  style={{ width: "842px", height: "595px", position: "absolute", left: "-9999px", top: "-9999px" }} 
                  className="p-16 flex flex-col justify-between text-[#0A192F] bg-[#fafaff] border-[14px] border-[#0A192F] outline outline-1 outline-[#C5A059] outline-offset-[-15px] relative rounded-none select-none text-left overflow-hidden"
                >
                  {/* Repeated linework geometric watermark */}
                  <div className="absolute inset-x-8 inset-y-8 border border-[#C5A059]/10 pointer-events-none overflow-hidden opacity-30 select-none">
                    <svg className="w-full h-full text-[#C5A059]/5" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                      <defs>
                        <pattern id="grid-pattern-hidden" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                          <circle cx="20" cy="20" r="1.5" fill="currentColor" />
                        </pattern>
                        <pattern id="diagonal-pattern-hidden" width="80" height="80" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                          <line x1="0" y1="0" x2="0" y2="80" stroke="currentColor" strokeWidth="0.5" />
                          <line x1="0" y1="0" x2="80" y2="0" stroke="currentColor" strokeWidth="0.5" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid-pattern-hidden)" />
                      <rect width="100%" height="100%" fill="url(#diagonal-pattern-hidden)" opacity="0.30" />
                    </svg>
                  </div>

                  {/* Geometric sharp corner brackets */}
                  <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-[#C5A059] pointer-events-none" />
                  <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-[#C5A059] pointer-events-none" />
                  <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-[#C5A059] pointer-events-none" />
                  <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-[#C5A059] pointer-events-none" />

                  {/* Header / Seal block */}
                  <div className="text-center space-y-1 z-10">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xl">🏆</span>
                      <span className="font-sans text-[9px] font-bold tracking-[0.25em] text-[#C5A059] uppercase">
                        Executive Insights AI &bull; HR Assessor
                      </span>
                    </div>
                    <h1 className="font-serif-caslon text-3xl font-black text-[#0A192F] tracking-[0.06em] uppercase">
                      SERTIFIKAT PENGHARGAAN
                    </h1>
                    {/* Geometric elegant divider */}
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-24 h-px bg-gradient-to-r from-transparent to-[#C5A059]"></div>
                      <div className="w-1.5 h-1.5 bg-[#C5A059] transform rotate-45"></div>
                      <div className="w-24 h-px bg-gradient-to-l from-transparent to-[#C5A059]"></div>
                    </div>
                  </div>

                  {/* Recipient block */}
                  <div className="text-center space-y-2.5 my-auto z-10">
                    <p className="font-serif-caslon italic text-center text-xs text-slate-500">Sertifikat ini secara resmi dianugerahkan kepada:</p>
                    <h2 className="font-serif-caslon text-[28px] font-bold text-[#0A192F] tracking-wide border-b border-[#C5A059]/40 pb-1.5 inline-block px-12 capitalize my-1">
                      {candidateName || "Kandidat Profesional"}
                    </h2>
                    
                    <div className="flex flex-col items-center gap-1">
                      <div className="px-3.5 py-0.5 border border-[#C5A059]/30 bg-[#fafaff] text-[#0A192F] text-[10px] font-bold uppercase tracking-wider">
                        Penilaian : {aiAnalysis?.ratingText || "Sangat Siap & Potensial"}
                      </div>
                      <p className="font-sans text-[11px] text-[#44474d] max-w-xl mx-auto leading-relaxed px-4">
                        Atas pencapaian luar biasa dalam menyelesaikan seluruh rangkaian simulasi penilaian wawancara kerja profesional secara komprehensif menggunakan sistem penilaian kompetensi HRD terintegrasi berbasis kecerdasan buatan.
                      </p>
                    </div>
                  </div>

                  {/* Target Company & Performance Scores */}
                  <div className="border border-[#C5A059]/30 bg-[#fafaff] py-3.5 px-6 grid grid-cols-[1.4fr_0.85fr_0.9fr_0.85fr] gap-2 text-center mx-8 my-1 z-10">
                    <div className="space-y-0.5 flex flex-col justify-center min-w-0">
                      <span className="text-[8px] text-[#C5A059] uppercase tracking-widest font-bold block">PERUSAHAAN IMPIAN</span>
                      <p className="text-[11px] font-bold text-[#0A192F] leading-normal break-words uppercase px-1">
                        {targetCompany || "UMUM / FRESH GRADUATE"}
                      </p>
                    </div>
                    <div className="space-y-0.5 border-s border-slate-200">
                      <span className="text-[8px] text-slate-400 uppercase tracking-widest font-bold block">ASPEK TERUJI</span>
                      <p className="text-[11px] font-bold text-[#0A192F]">
                        {responses.length} Pertanyaan HRD
                      </p>
                    </div>
                    <div className="space-y-0.5 border-s border-slate-200">
                      <span className="text-[8px] text-slate-400 uppercase tracking-widest font-bold block">SKOR KELAYAKAN</span>
                      <p className="text-[12px] font-extrabold text-[#C5A059] font-mono">
                        {aiAnalysis?.score || 85} / 100
                      </p>
                    </div>
                    <div className="space-y-0.5 border-s border-slate-200">
                      <span className="text-[8px] text-slate-400 uppercase tracking-widest font-bold block">STATUS EVALUASI</span>
                      <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                        100% SELESAI
                      </p>
                    </div>
                  </div>

                  {/* Signature and Verification blocks footer */}
                  <div className="flex justify-between items-end text-[9px] text-[#0A192F]/80 font-medium px-4 z-10">
                    <div className="text-left space-y-0.5">
                      <span className="text-[8px] text-[#C5A059] uppercase tracking-widest font-bold block">SYSTEM VERIFICATION</span>
                      <p className="font-mono text-slate-400 text-[8px]">ID: EI-{Date.now().toString().slice(-8)}</p>
                      <p className="text-[8px] text-slate-400">Diterbit: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                    </div>
                    
                    <div className="relative flex items-center justify-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#E2C98A] via-[#C5A059] to-[#9E7F40] rounded-full flex items-center justify-center p-0.5 shadow-md relative select-none">
                        <div className="w-full h-full rounded-full border-2 border-dashed border-[#0A192F]/25 flex items-center justify-center text-center">
                          <div className="flex flex-col items-center justify-center -space-y-0.5">
                            <span className="text-sm">🏆</span>
                            <span className="text-[6px] font-extrabold text-[#0A192F] uppercase tracking-[0.1em]">VERIFIED</span>
                          </div>
                      </div>
                      </div>
                    </div>

                    <div className="text-right flex flex-col justify-end items-end">
                      <div className="w-48 text-center">
                        <p className="font-serif italic text-xs text-amber-700 h-4 tracking-wider select-none font-medium mb-1.5">Dinar Maulidan</p>
                        <div className="border-t border-[#0A192F] w-full pt-1">
                          <p className="font-sans text-[9px] font-bold text-[#0A192F] uppercase tracking-widest leading-none">DINAR MAULIDAN</p>
                          <p className="font-sans text-[6px] text-slate-400 tracking-wider uppercase mt-1 leading-none">MANAGING DIRECTOR &bull; EXECUTIVE INSIGHTS</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* INSTAGRAM SHARE SUCCESS DIALOG DIALOGUE */}
                <AnimatePresence>
                  {showIGModal && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-[100] p-4"
                      onClick={() => setShowIGModal(false)}
                    >
                      <motion.div 
                        initial={{ scale: 0.95, y: 15 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 15 }}
                        className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl border border-slate-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="w-16 h-16 bg-gradient-to-tr from-pink-500 via-red-500 to-amber-500 text-white rounded-full flex items-center justify-center text-3xl mx-auto shadow-lg shadow-pink-500/10">
                          📸
                        </div>
                        <div className="space-y-1.5">
                          <h3 className="font-serif text-lg font-bold text-slate-900">Instagram Story Siap!</h3>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Gambar format portrait (9:16) bertema <strong className="text-slate-800">Executive Insights AI</strong> telah berhasil disimpan di perangkat Anda.
                          </p>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-[11px] text-slate-600 text-left space-y-1">
                          <p className="font-bold text-slate-800 font-semibold mb-1 border-b border-slate-200 pb-0.5">Cara Upload ke IG Stories:</p>
                          <p>1. Buka aplikasi <strong className="text-slate-800 font-semibold">Instagram</strong> Anda.</p>
                          <p>2. Swipe kanan untuk membuat <strong className="text-slate-800 font-semibold">Story Baru</strong>.</p>
                          <p>3. Pilih gambar rating simulasi yang baru saja diunduh.</p>
                          <p>4. Bubuhkan tautan evaluasi ini dan bagikan!</p>
                        </div>
                        <button 
                          onClick={() => setShowIGModal(false)}
                          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
                        >
                          Mengerti & Oke
                        </button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Primary CTA controls (Matches screen #3 strictly) */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <button
                    onClick={() => setStep("share")}
                    className="w-full sm:w-auto px-10 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs leading-none transition-all shadow-sm active:scale-97 flex items-center justify-center gap-2"
                  >
                    Bagikan Evaluasi Sesi
                    <Share2 size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setStep("welcome");
                      setCandidateName("");
                    }}
                    className="w-full sm:w-auto px-10 py-4 border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold rounded-lg text-xs leading-none transition-all active:scale-98 flex items-center justify-center gap-2"
                  >
                    Simulasi Baru
                    <RefreshCcw size={14} />
                  </button>
                </div>

                {/* INTERACTIVE STAR RATING AND FEEDBACK COMMENT FORM */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 text-left max-w-xl mx-auto space-y-4 shadow-xs mt-6">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>⭐</span> Berikan Rating & Masukan Anda
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Bantu kami menyempurnakan Website Interview ini dengan memberikan ulasan rating bintang dan saran terbaik Anda.
                  </p>

                  {feedbackSubmitted ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-emerald-50 border border-emerald-150 p-4 rounded-xl text-center text-emerald-800 space-y-1"
                    >
                      <p className="text-xs font-bold font-serif">Apresiasi Tinggi dari Kami! 👍</p>
                      <p className="text-[11px] text-emerald-700">Ulasan & rating {userRating} bintang Anda telah kami simpan. Masukan Anda sungguh berharga!</p>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      {/* Stars selection container */}
                      <div className="flex items-center gap-1.5 justify-center py-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setUserRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(star)}
                            className="bg-transparent hover:scale-110 active:scale-95 transition-all outline-none border-none cursor-pointer"
                          >
                            <span 
                              className={`text-3xl transition-colors ${
                                star <= (hoverRating || userRating) 
                                  ? "text-amber-400 font-bold" 
                                  : "text-slate-200"
                              }`}
                            >
                              ★
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* User written comment text area */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">Tulis komentar / masukan</label>
                        <textarea
                          rows={3}
                          value={userComment}
                          onChange={(e) => setUserComment(e.target.value)}
                          placeholder="Tuliskan pengalaman Anda menggunakan website interview berbasis AI ini atau saran perbaikan..."
                          className="w-full p-3 border border-slate-200 rounded-lg text-xs hover:border-slate-300 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none bg-slate-50"
                        />
                      </div>

                      {/* Submit comment button */}
                      <button
                        type="button"
                        onClick={async () => {
                          if (userRating === 0) {
                            alert("Silakan pilih rating bintang terlebih dahulu.");
                            return;
                          }
                          setFeedbackSubmitted(true);
                          try {
                            await fetch("/api/feedback-logs", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                username: candidateName.trim() || "Anonim",
                                rating: userRating,
                                comment: userComment.trim()
                              })
                            });
                          } catch (err) {
                            console.warn("Failed to submit feedback to backend:", err);
                          }
                        }}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm cursor-pointer border-none"
                      >
                        Kirim Ulasan Anda
                      </button>
                    </div>
                  )}
                </div>

                {/* Watermarked quote */}
                <p className="text-xs italic text-slate-500 pt-3">
                  ✨ \"Kejujuran evaluasi adalah pondasi kokoh menuju kesuksesan wawancara nyata.\" — Executive Insights
                </p>

              </motion.div>
            )}

            {/* STEP 4: SHARE VIEW (Matches screenshot #4) */}
            {step === "share" && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center"
              >
                
                {/* Floating graphic emojis as requested and styled */}
                <div className="absolute top-20 left-10 md:left-40 opacity-20 pointer-events-none select-none animate-bounce" style={{ animationDuration: "10s" }}>
                  <span className="text-6xl text-slate-900 drop-shadow-md">🚀</span>
                </div>
                <div className="absolute bottom-40 right-10 opacity-20 pointer-events-none select-none" style={{ animationDuration: "8s" }}>
                  <span className="text-7xl text-slate-900 drop-shadow-md">✨</span>
                </div>
                <div className="absolute top-1/2 left-20 opacity-25 pointer-events-none select-none">
                  <span className="text-5xl text-slate-900">🤝</span>
                </div>
                <div className="absolute bottom-16 left-1/3 opacity-20 pointer-events-none select-none">
                  <span className="text-4xl">🖋️</span>
                </div>

                {/* Left Side Info */}
                <div className="md:col-span-7 flex flex-col gap-4 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 bg-slate-200 text-slate-800 px-4 py-1 rounded-full w-fit mx-auto md:mx-0 text-xs font-bold uppercase tracking-wider">
                    Sinergi & Karir
                  </div>
                  <h1 className="font-serif text-3xl md:text-5xl text-slate-900 tracking-tight leading-tight font-extrabold">
                    Ajak Rekan Kerja Anda! 📢
                  </h1>
                  <p className="text-md md:text-lg text-slate-600 leading-relaxed max-w-md">
                    Semakin banyak fresh graduate yang mencoba simulasi interaktif ini, semakin siap kelompok kita bersaing di rekrutmen industri kerja nasional. ✨
                  </p>

                  <div className="mt-8 hidden md:block">
                    <button
                      onClick={() => setStep("welcome")}
                      className="group flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-950 transition-colors"
                    >
                      <ArrowLeft size={16} />
                      Kembali ke Beranda
                    </button>
                  </div>
                </div>

                {/* Right Side Share Card Option Panel */}
                <div className="md:col-span-5">
                  <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-md flex flex-col gap-4">
                    <h3 className="font-serif text-lg font-bold text-slate-950 pb-2 border-b border-slate-100">
                      Pilih Metode Bagikan
                    </h3>

                    {/* Options list */}
                    <div className="space-y-2.5">
                      {/* WhatsApp Option */}
                      <a
                        href={`https://api.whatsapp.com/send?text=Halo!+Saya+baru+saja+mencoba+Simulasi+Wawancara+HRD+Fresh+Graduate+di+Executive+Insights.+Sangat+membantu!+Yuk+coba+di+sini:+${encodeURIComponent(window.location.origin)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all active:scale-[0.98] group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">💬</span>
                          <span className="text-xs font-bold text-slate-800">Share ke WhatsApp</span>
                        </div>
                        <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
                      </a>

                      {/* Instagram Option */}
                      <button
                        onClick={() => exportReport("ig")}
                        disabled={isExporting !== null}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all active:scale-[0.98] group text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📸</span>
                          <span className="text-xs font-bold text-slate-800">
                            {isExporting === "ig" ? "Mengekspor Story..." : "Share ke Instagram"}
                          </span>
                        </div>
                        <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
                      </button>

                      {/* Email Option */}
                      <a
                        href={`mailto:?subject=Simulasi Pertanyaan HRD Fresh Graduate&body=Halo, coba latihan simulasi interview HRD interaktif ini untuk mengasah pemahaman kita menjawab wawancara di: ${window.location.origin}`}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all active:scale-[0.98] group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📧</span>
                          <span className="text-xs font-bold text-slate-800">Kirim via Email</span>
                        </div>
                        <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-900 transition-colors" />
                      </a>

                      {/* Copy Link Option */}
                      <div className="relative">
                        <button
                          onClick={handleCopyLink}
                          className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all active:scale-[0.98] group"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🔗</span>
                            <span className="text-xs font-bold text-slate-800">Copy Link</span>
                          </div>
                          <Copy size={16} className="text-slate-400 group-hover:text-slate-800 transition-colors" />
                        </button>

                        <AnimatePresence>
                          {copied && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] uppercase tracking-wide font-bold py-1 px-3.5 rounded-full shadow-md z-30"
                            >
                              Tersalin!
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* bottom support panel */}
                    <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3">
                      <div className="w-10 h-10 shrink-0 bg-white rounded-full flex items-center justify-center shadow-xs text-xl">
                        🤝
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        <strong>Kolega Berdaya</strong> adalah impian perkantoran modern. Bagikan demi perluasan literasi karir.
                      </p>
                    </div>

                  </div>

                  {/* Return link for mobile screen view */}
                  <div className="mt-6 block md:hidden text-center">
                    <button
                      onClick={() => setStep("welcome")}
                      className="text-xs font-bold text-slate-700 underline"
                    >
                      Kembali ke Beranda
                    </button>
                  </div>
                </div>

              </motion.div>
            )}

          </div>
        )}

        {/* TAB 2: LIBRARY / STUDY POOL INDEX LISTING */}
        {activeTab === "study" && (
          <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-slate-950">
                    📚 Bank Soal & Bedah Materi HRD
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Berikut adalah daftar koleksi pertanyaan interview fresh graduate yang terdaftar di database backend kami.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setStep("welcome");
                    setActiveTab("simulation");
                  }}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-1 shrink-0"
                >
                  <Layout size={12} /> Mulai Simulasi
                </button>
              </div>
            </div>

            {/* Questions Pool Grid */}
            <StudyPoolContainer />
          </div>
        )}

        {/* TAB 3: ADMIN CONTROL BOARD CRUD (Connected directly to customized server) */}
        {activeTab === "admin" && (
          <div className="w-full max-w-4xl mx-auto space-y-4">
            {/* Live Backend Indicator Section in Admin Panel as requested */}
            <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-lg font-bold">
                  🛡️
                </div>
                <div>
                  <h3 className="font-serif text-xs sm:text-sm font-bold text-slate-900">Panel Kontrol Developer</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Pengelolaan bank soal wawancara fresh graduate terpusat.</p>
                </div>
              </div>
              
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg px-2.5 py-1.5 border border-blue-150 shrink-0">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                Live Backend API Aktif
              </div>
            </div>

            <AdminPanel onQuestionsUpdated={loadDatabaseMetrics} />
          </div>
        )}

      </main>

      {/* FOOTER SECTION (Shared across all pages) */}
      <footer className="bg-white border-t border-slate-200/80 py-8 w-full">
        <div className="max-w-[1280px] w-full mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <span className="font-serif text-md font-bold text-slate-900">
              Executive Insights
            </span>
            <p className="text-xs text-slate-500 mt-1">
              © 2026 Executive Insights Corp. Developed by <a href="https://www.instagram.com/dinnr_2" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">Dinar Maulidan</a>. All rights reserved.
            </p>
          </div>

          <div className="flex flex-wrap justify-center md:justify-end gap-x-6 gap-y-2 items-center">
            <button 
              onClick={() => setShowAboutModal(true)}
              className="text-xs text-slate-500 hover:text-slate-950 hover:underline transition-all cursor-pointer bg-transparent border-none py-0 px-0"
            >
              Tentang Kami
            </button>
            <button 
              onClick={() => setShowPrivacyModal(true)}
              className="text-xs text-slate-500 hover:text-slate-950 hover:underline transition-all cursor-pointer bg-transparent border-none py-0 px-0"
            >
              Kebijakan Privasi
            </button>
            <button 
              onClick={() => setShowTermsModal(true)}
              className="text-xs text-slate-500 hover:text-slate-950 hover:underline transition-all cursor-pointer bg-transparent border-none py-0 px-0"
            >
              Ketentuan Layanan
            </button>
            <button 
              onClick={() => setShowHelpModal(true)}
              className="text-xs text-slate-500 hover:text-slate-950 hover:underline transition-all cursor-pointer bg-transparent border-none py-0 px-0"
            >
              Pusat Bantuan
            </button>
            <a 
              className="text-xs text-blue-600 font-bold hover:underline transition-all cursor-pointer text-lg leading-none" 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                if (appMode === "admin") {
                  setActiveTab("admin");
                } else {
                  setShowPasswordModal(true);
                }
              }}
              title="Atur Pertanyaan (Admin)"
            >
              ⚙️
            </a>
          </div>
        </div>
      </footer>

      {/* PASSWORD DIALOG MODAL FOR ADMIN MODE (Required password: 1011) */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-150 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚙️</span>
                  <h3 className="font-serif text-md font-bold text-slate-900">Masuk Mode Admin</h3>
                </div>
                <button 
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPwdInput("");
                    setPwdError("");
                  }}
                  className="text-slate-400 hover:text-slate-900 font-bold text-lg leading-none cursor-pointer p-1"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={verifyPasswordAndEnterAdmin} className="space-y-4">
                <p className="text-xs text-slate-650 leading-relaxed">
                  Gunakan otentikasi administrator untuk mengelola database bank soal interview fresh graduate.
                </p>

                <div className="space-y-1.5">
                  <label htmlFor="admin-security-pass" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Sandi Akses Kontrol:
                  </label>
                  <input
                    id="admin-security-pass"
                    type="password"
                    required
                    value={pwdInput}
                    onChange={(e) => {
                      setPwdInput(e.target.value);
                      setPwdError("");
                    }}
                    placeholder="Masukkan Kata Sandi"
                    className="w-full text-center tracking-widest font-mono font-bold text-lg px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                  <p className="text-[10px] text-slate-400 italic">
                    *Akses terbatas bagi manajemen dan administrator Executive Insights.
                  </p>
                </div>

                {pwdError && (
                  <p className="text-xs text-rose-600 font-bold text-center bg-rose-50 border border-rose-100/50 p-2.5 rounded-lg animate-shake">
                    {pwdError}
                  </p>
                )}

                <div className="flex justify-end gap-1.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPwdInput("");
                      setPwdError("");
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-150 rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-md shadow-blue-500/15 cursor-pointer"
                  >
                    Masuk
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REAL-TIME DOWNLOAD LOADER TRIGGER */}
      <AnimatePresence>
        {isExporting !== null && (
          <div className="fixed inset-0 z-[140] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full p-8 text-center space-y-6 shadow-2xl border border-slate-100"
            >
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-amber-100 animate-pulse"></div>
                <div className="absolute inset-x-0 inset-y-0 rounded-full border-4 border-transparent border-t-amber-500 border-r-amber-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-3xl">🏆</div>
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-lg font-bold text-slate-900">
                  Mempersiapkan Unduhan
                </h3>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest font-mono">
                  Loading Unduh Sertifikat
                </p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Harap tunggu, sistem kami sedang merender sertifikat penghargaan resmi Anda ke dalam format resolusi tinggi ({isExporting.replace("certificate_", "").toUpperCase()}).
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PRATINJAU SERTIFIKAT MODAL (A4 Ratio with Confetti) */}
      <AnimatePresence>
        {showCertificateModal && (
          <div className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl relative border border-slate-100 my-8 space-y-6"
            >
              {/* Confetti effect inside certificate modal */}
              <Confetti />

              {/* Modal controls */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎓</span>
                  <h3 className="font-serif text-lg font-bold text-slate-900">Sertifikat Penghargaan Resmi</h3>
                </div>
                <button 
                  onClick={() => setShowCertificateModal(false)}
                  className="text-slate-400 hover:text-slate-900 font-bold text-xl leading-none cursor-pointer p-2 hover:bg-slate-50 rounded-full transition-colors border-none bg-transparent"
                >
                  &times;
                </button>
              </div>

              {/* Visual Simulated Certificate - High Fidelity Responsive Element */}
              <div className="overflow-x-auto p-1 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner flex justify-center">
                <div 
                  className="p-16 flex flex-col justify-between text-[#0A192F] bg-[#fafaff] border-[14px] border-[#0A192F] outline outline-1 outline-[#C5A059] outline-offset-[-15px] relative rounded-none select-none text-left overflow-hidden shrink-0"
                  style={{ width: "800px", height: "565px" }} 
                >
                  {/* Repeated linework geometric watermark */}
                  <div className="absolute inset-x-8 inset-y-8 border border-[#C5A059]/10 pointer-events-none overflow-hidden opacity-30 select-none">
                    <svg className="w-full h-full text-[#C5A059]/5" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                      <defs>
                        <pattern id="grid-pattern-preview" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                          <circle cx="20" cy="20" r="1.5" fill="currentColor" />
                        </pattern>
                        <pattern id="diagonal-pattern-preview" width="80" height="80" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                          <line x1="0" y1="0" x2="0" y2="80" stroke="currentColor" strokeWidth="0.5" />
                          <line x1="0" y1="0" x2="80" y2="0" stroke="currentColor" strokeWidth="0.5" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid-pattern-preview)" />
                      <rect width="100%" height="100%" fill="url(#diagonal-pattern-preview)" opacity="0.30" />
                    </svg>
                  </div>

                  {/* Geometric sharp corner brackets */}
                  <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-[#C5A059] pointer-events-none" />
                  <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-[#C5A059] pointer-events-none" />
                  <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-[#C5A059] pointer-events-none" />
                  <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-[#C5A059] pointer-events-none" />

                  {/* Header / Seal block */}
                  <div className="text-center space-y-1 z-10">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xl leading-none">🏆</span>
                      <span className="font-sans text-[8px] font-bold tracking-[0.25em] text-[#C5A059] uppercase">
                        Executive Insights AI &bull; HR Assessor
                      </span>
                    </div>
                    <h1 className="font-serif-caslon text-2xl font-black text-[#0A192F] tracking-[0.06em] uppercase">
                      SERTIFIKAT PENGHARGAAN
                    </h1>
                    {/* Geometric elegant divider */}
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-20 h-px bg-gradient-to-r from-transparent to-[#C5A059]"></div>
                      <div className="w-1.5 h-1.5 bg-[#C5A059] transform rotate-45"></div>
                      <div className="w-20 h-px bg-gradient-to-l from-transparent to-[#C5A059]"></div>
                    </div>
                  </div>

                  {/* Recipient block */}
                  <div className="text-center space-y-2 my-auto z-10">
                    <p className="font-serif-caslon italic text-center text-[11px] text-slate-500">Sertifikat ini secara resmi dianugerahkan kepada:</p>
                    <h2 className="font-serif-caslon text-2xl font-bold text-[#0A192F] tracking-wide border-b border-[#C5A059]/40 pb-1.5 inline-block px-10 capitalize my-1">
                      {candidateName || "Kandidat Profesional"}
                    </h2>
                    
                    <div className="flex flex-col items-center gap-1">
                      <div className="px-3 py-0.5 border border-[#C5A059]/30 bg-[#fafaff] text-[#0A192F] text-[9px] font-bold uppercase tracking-wider">
                        Penilaian : {aiAnalysis?.ratingText || "Sangat Siap & Potensial"}
                      </div>
                      <p className="font-sans text-[10px] text-[#44474d] max-w-lg mx-auto leading-relaxed px-4">
                        Atas pencapaian luar biasa dalam menyelesaikan seluruh rangkaian simulasi penilaian wawancara kerja profesional secara komprehensif menggunakan sistem penilaian kompetensi HRD terintegrasi berbasis kecerdasan buatan.
                      </p>
                    </div>
                  </div>

                  {/* Target Company & Performance Scores */}
                  <div className="border border-[#C5A059]/30 bg-[#fafaff] py-3 px-6 grid grid-cols-[1.4fr_0.85fr_0.9fr_0.85fr] gap-2 text-center mx-6 my-1 z-10">
                    <div className="space-y-0.5 flex flex-col justify-center min-w-0">
                      <span className="text-[7px] text-[#C5A059] uppercase tracking-widest font-bold block">PERUSAHAAN IMPIAN</span>
                      <p className="text-[10px] font-bold text-[#0A192F] leading-normal break-words uppercase px-1">
                        {targetCompany || "UMUM / FRESH GRADUATE"}
                      </p>
                    </div>
                    <div className="space-y-0.5 border-s border-slate-200">
                      <span className="text-[7px] text-slate-400 uppercase tracking-widest font-bold block">ASPEK TERUJI</span>
                      <p className="text-[10px] font-bold text-[#0A192F]">
                        {responses.length} Pertanyaan HRD
                      </p>
                    </div>
                    <div className="space-y-0.5 border-s border-slate-200">
                      <span className="text-[7px] text-slate-400 uppercase tracking-widest font-bold block">SKOR KELAYAKAN</span>
                      <p className="text-[11px] font-extrabold text-[#C5A059] font-mono">
                        {aiAnalysis?.score || 85} / 100
                      </p>
                    </div>
                    <div className="space-y-0.5 border-s border-slate-200">
                      <span className="text-[7px] text-slate-400 uppercase tracking-widest font-bold block">STATUS EVALUASI</span>
                      <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                        100% SELESAI
                      </p>
                    </div>
                  </div>

                  {/* Signature and Verification blocks footer */}
                  <div className="flex justify-between items-end text-[8px] text-[#0A192F]/80 font-medium px-4 z-10">
                    <div className="text-left space-y-0.5">
                      <span className="text-[7px] text-[#C5A059] uppercase tracking-widest font-bold block">SYSTEM VERIFICATION</span>
                      <p className="font-mono text-slate-400 text-[8px]">ID: EI-{Date.now().toString().slice(-8)}</p>
                      <p className="text-[8px] text-slate-400">Diterbit: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                    </div>
                    
                    <div className="relative flex items-center justify-center">
                      <div className="w-14 h-14 bg-gradient-to-br from-[#E2C98A] via-[#C5A059] to-[#9E7F40] rounded-full flex items-center justify-center p-0.5 shadow-md relative select-none">
                        <div className="w-full h-full rounded-full border border-dashed border-[#0A192F]/25 flex items-center justify-center text-center">
                          <div className="flex flex-col items-center justify-center -space-y-0.5">
                            <span className="text-xs">🏆</span>
                            <span className="text-[5px] font-extrabold text-[#0A192F] uppercase tracking-[0.1em]">VERIFIED</span>
                          </div>
                      </div>
                      </div>
                    </div>

                    <div className="text-right flex flex-col justify-end items-end">
                      <div className="w-44 text-center">
                        <p className="font-serif italic text-[11px] text-amber-700 h-3.5 tracking-wider select-none font-medium mb-1">Dinar Maulidan</p>
                        <div className="border-t border-[#0A192F] w-full pt-1">
                          <p className="font-sans text-[8px] font-bold text-[#0A192F] uppercase tracking-widest leading-none">DINAR MAULIDAN</p>
                          <p className="font-sans text-[5.5px] text-slate-400 tracking-wider uppercase mt-0.5 leading-none font-sans">MANAGING DIRECTOR &bull; EXECUTIVE INSIGHTS</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Export actions in preview */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-4 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCertificateModal(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50 transition-colors cursor-pointer bg-white"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={() => exportReport("certificate_pdf")}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold rounded-xl text-xs shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"
                >
                  <Award size={14} className="text-white" />
                  Unduh Format PDF
                </button>
                <button
                  type="button"
                  onClick={() => exportReport("certificate_jpg")}
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold rounded-xl text-xs shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"
                >
                  <Download size={14} className="text-white" />
                  Unduh Format JPG
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TENTANG KAMI MODAL */}
      <AnimatePresence>
        {showAboutModal && (
          <div className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-150 space-y-4 text-left"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✨</span>
                  <h3 className="font-serif text-md font-bold text-slate-900">Tentang Kami</h3>
                </div>
                <button 
                  onClick={() => setShowAboutModal(false)}
                  className="text-slate-400 hover:text-slate-900 font-bold text-lg leading-none cursor-pointer p-1 bg-transparent border-none"
                >
                  &times;
                </button>
              </div>
              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <p>
                  Selamat datang di <strong className="text-slate-900 font-bold">Website Interview Berbasis AI</strong>, sebuah platform inovatif interaktif yang didedikasikan untuk membantu fresh graduate dan pencari kerja menguji kesiapan karir mereka secara objektif.
                </p>
                <div className="bg-blue-50/50 border border-blue-105 p-3 rounded-xl space-y-1.5">
                  <p className="font-bold text-blue-900">Profil Pengembang:</p>
                  <p className="text-slate-700">
                    Aplikasi ini dirancang dan dikembangkan dengan penuh perhatian oleh <strong className="text-slate-950 font-bold">Dinar Maulidan</strong> di bawah bendera <strong className="text-slate-950 font-bold">Executive Insights</strong>.
                  </p>
                  <p className="pt-1">
                    Hubungi / ikuti pengembang langsung melalui Instagram resmi:
                  </p>
                  <a 
                    href="https://www.instagram.com/dinnr_2" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-violet-600 hover:opacity-90 text-white font-bold px-3 py-1.5 rounded-lg text-xs mt-1 transition-opacity"
                  >
                    📸 @dinnr_2 di Instagram
                  </a>
                </div>
              </div>
              <button
                onClick={() => setShowAboutModal(false)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer border-none"
              >
                Tutup Info
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* KEBIJAKAN PRIVASI MODAL */}
      <AnimatePresence>
        {showPrivacyModal && (
          <div className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-150 space-y-4 text-left"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🛡️</span>
                  <h3 className="font-serif text-md font-bold text-slate-905">Kebijakan Privasi</h3>
                </div>
                <button 
                  onClick={() => setShowPrivacyModal(false)}
                  className="text-slate-400 hover:text-slate-900 font-bold text-lg leading-none cursor-pointer p-1 bg-transparent border-none"
                >
                  &times;
                </button>
              </div>
              <div className="space-y-3 text-xs text-slate-600 leading-relaxed max-h-72 overflow-y-auto pr-1">
                <p className="font-bold text-slate-900 text-xs">Pernyataan Komitmen Privasi:</p>
                <p>
                  Kami di Executive Insights berkomitmen penuh untuk melindungi privasi pribadi Anda selama menggunakan bimbingan dan simulasi evaluasi karir kerja kami.
                </p>
                <p className="font-bold text-slate-800">1. Data yang Dikumpulkan:</p>
                <p>
                  Kami hanya memproses nama yang Anda daftarkan di awal simulasi, nama instansi/perusahaan target, serta jawaban tertulis yang Anda berikan untuk masing-masing pertanyaan wawancara kerja.
                </p>
                <p className="font-bold text-slate-800">2. Penyimpanan Data:</p>
                <p>
                  Semua data masukan serta respon evaluasi disimpan secara temporer di dalam state browser lokal demi keamanan privasi Anda. Log audit administrasi hanya mendokumentasikan statistik anonim performa keseluruhan demi penyempurnaan AI kami.
                </p>
                <p className="font-bold text-slate-800">3. Kebebasan dari Pihak Ketiga:</p>
                <p>
                  Kami tidak pernah memperjualbelikan, mentransfer, atau memberikan jawaban simulasi Anda kepada pihak eksternal komersial mana pun.
                </p>
              </div>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer border-none"
              >
                Saya Mengerti
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* KETENTUAN LAYANAN MODAL */}
      <AnimatePresence>
        {showTermsModal && (
          <div className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-150 space-y-4 text-left"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚖️</span>
                  <h3 className="font-serif text-md font-bold text-slate-900">Ketentuan Layanan</h3>
                </div>
                <button 
                  onClick={() => setShowTermsModal(false)}
                  className="text-slate-400 hover:text-slate-900 font-bold text-lg leading-none cursor-pointer p-1 bg-transparent border-none"
                >
                  &times;
                </button>
              </div>
              <div className="space-y-3 text-xs text-slate-600 leading-relaxed max-h-72 overflow-y-auto pr-1">
                <p className="font-bold text-slate-900 text-xs">Persetujuan Terhadap Aturan:</p>
                <p>
                  Dengan mengakses dan berpartisipasi dalam Website Wawancara Kerja Berbasis AI dari Executive Insights, Anda menyatakan tunduk pada ketentuan berikut.
                </p>
                <p className="font-bold text-slate-800">1. Lisensi Penggunaan:</p>
                <p>
                  Penggunaan platform ini ditujukan murni untuk kepentingan edukasi, pembelajaran mandiri, dan simulasi kelayakan kerja fresh graduate. Segala bentuk modifikasi ilegal atau penyalahgunaan API di luar hak akses dilarang.
                </p>
                <p className="font-bold text-slate-800">2. Batasan Tanggung Jawab:</p>
                <p>
                  Hasil ulasan skor kelayakan, predikat kelulusan, dan sertifikat prestasi yang diterbitkan merupakan estimasi ulasan AI objektif untuk membantu Anda belajar. Aplikasi dan pengembang tidak memberikan jaminan kelulusan di proses rekrutmen perusahaan nyata mana pun. Keberhasilan Anda berakar dari usaha keras Anda sendiri.
                </p>
              </div>
              <button
                onClick={() => setShowTermsModal(false)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer border-none"
              >
                Setuju & Lanjutkan
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PUSAT BANTUAN MODAL */}
      <AnimatePresence>
        {showHelpModal && (
          <div className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-150 space-y-4 text-left"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  <h3 className="font-serif text-md font-bold text-slate-900">Pusat Bantuan (FAQ)</h3>
                </div>
                <button 
                  onClick={() => setShowHelpModal(false)}
                  className="text-slate-400 hover:text-slate-900 font-bold text-lg leading-none cursor-pointer p-1 bg-transparent border-none"
                >
                  &times;
                </button>
              </div>
              <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed max-h-80 overflow-y-auto pr-1">
                <div className="space-y-1">
                  <p className="font-bold text-slate-900">Q: Bagaimana cara memulai simulasi?</p>
                  <p>A: Cukup ketikkan nama lengkap Anda serta nama perusahaan target di kolom awal, lalu klik tombol "Mulai Simulasi Wawancara".</p>
                </div>
                <div className="space-y-1 border-t border-slate-100 pt-2.5">
                  <p className="font-bold text-slate-900">Q: Berapa jumlah soal dan bagaimana sistem penilaiannya?</p>
                  <p>A: Terdapat bank soal bervariasi. AI kami akan mengevaluasi jawaban tertulis Anda, memberikan skor berskala 100, dan memberikan sertifikat digital formal.</p>
                </div>
                <div className="space-y-1 border-t border-slate-100 pt-2.5">
                  <p className="font-bold text-slate-900">Q: Mengapa saya gagal mengunduh sertifikat?</p>
                  <p>A: Jika Anda berada di dalam iframe tinjauan, silakan buka aplikasi di tab mandiri baru agar proses rendering `canvas` dan `jsPDF` berjalan 100% mulus.</p>
                </div>
                <div className="space-y-1 border-t border-slate-100 pt-2.5 bg-slate-50 p-2 rounded-lg">
                  <p className="font-bold text-slate-900 flex items-center gap-1">
                    <span>✉️</span> Butuh Dukungan Lebih Lanjut?
                  </p>
                  <p>Silakan hubungi pengembang kami via Instagram di <a href="https://www.instagram.com/dinnr_2" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline">@dinnr_2</a> untuk feedback teknis atau kerjasama.</p>
                </div>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer border-none"
              >
                Mengerti & Selesai
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Inner Component: Study Question Pool List
function StudyPoolContainer() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/questions");
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-100 flex flex-col justify-center items-center gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin"></div>
        <span className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Memuat Bank Soal...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((q) => {
        const isExpanded = selectedId === q.id;
        return (
          <div 
            key={q.id} 
            className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-colors"
          >
            <div 
              onClick={() => setSelectedId(isExpanded ? null : q.id)}
              className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50/50 transition-colors"
            >
              <div className="space-y-1 pr-6">
                <span className="px-2.5 py-0.5 text-[10px] font-bold text-slate-600 bg-slate-100 rounded-md border tracking-wider uppercase">
                  {q.category}
                </span>
                <h3 className="font-serif text-md md:text-lg font-bold text-slate-900 mt-1">
                  {q.text}
                </h3>
              </div>
              <button className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg shrink-0 hover:bg-slate-200 transition-all">
                {isExpanded ? "Tutup" : "Lihat Solusi 💡"}
              </button>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden border-t border-slate-100 bg-slate-50/50"
                >
                  <div className="p-6 space-y-4 text-xs font-medium">
                    <div className="space-y-1 bg-white p-4 rounded-lg border border-slate-200/60 shadow-xs">
                      <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-widest flex items-center gap-1">
                        <HelpCircle size={12} className="text-blue-600" />
                        Kenapa HR Menanyakan Ini?
                      </h4>
                      <p className="text-slate-600 leading-relaxed">
                        {q.tips || "HRD ingin mengukur kedewasaan berpikir, kecocokan tim, dan apakah kompetensi teknis/teoritis Anda relevan terhadap prospek bisnis perusahaan."}
                      </p>
                    </div>

                    <div className="space-y-1 bg-blue-50 border border-blue-100 p-4 rounded-lg">
                      <h4 className="text-xs font-extrabold text-blue-950 uppercase tracking-widest flex items-center gap-1">
                        <FileText size={12} className="text-blue-700" />
                        Latihan Skenario Jawaban Kuat (Kunci):
                      </h4>
                      <p className="text-blue-900 italic leading-relaxed bg-white/80 p-3 rounded border border-blue-200/50">
                        {q.idealAnswer || "Latihlah jawaban Anda berlandaskan kerangka STAR agar runtut dan solid."}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
