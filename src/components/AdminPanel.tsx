import React, { useState, useEffect } from "react";
import { Question } from "../types";
import { Trash2, Edit3, Plus, Check, Loader2, HelpCircle, Briefcase, FileText, X, RotateCcw, LogIn, Clock, ShieldAlert, Building } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AdminPanelProps {
  onQuestionsUpdated?: () => void;
}

export default function AdminPanel({ onQuestionsUpdated }: AdminPanelProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sub-tabs in Admin Panel
  const [activeSubTab, setActiveSubTab] = useState<"questions" | "logs" | "feedback">("questions");
  const [loginLogs, setLoginLogs] = useState<{ username: string; company?: string; role: 'admin' | 'candidate'; timestamp: string }[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  
  const [feedbackLogs, setFeedbackLogs] = useState<{ username: string; rating: number; comment: string; timestamp: string }[]>([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [category, setCategory] = useState("Sikap Kerja");
  const [tips, setTips] = useState("");
  const [idealAnswer, setIdealAnswer] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchQuestions();
    fetchLoginLogs();
    fetchFeedbackLogs();
  }, []);

  useEffect(() => {
    if (activeSubTab === "logs") {
      fetchLoginLogs();
    } else if (activeSubTab === "feedback") {
      fetchFeedbackLogs();
    }
  }, [activeSubTab]);

  const fetchFeedbackLogs = async () => {
    setIsLoadingFeedback(true);
    try {
      const res = await fetch("/api/feedback-logs");
      if (res.ok) {
        const data = await res.json();
        setFeedbackLogs(data);
      } else {
        showStatus("error", "Gagal memuat log ulasan.");
      }
    } catch (err) {
      showStatus("error", "Kesalahan memuat log ulasan.");
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  const handleClearFeedback = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus semua ulasan & rating? Tindakan ini tidak dapat dibatalkan.")) {
      return;
    }
    try {
      const res = await fetch("/api/feedback-logs", { method: "DELETE" });
      if (res.ok) {
        showStatus("success", "Semua ulasan & rating berhasil dibersihkan!");
        setFeedbackLogs([]);
      } else {
        showStatus("error", "Gagal membersihkan ulasan.");
      }
    } catch (err) {
      showStatus("error", "Gagal menghubungi server.");
    }
  };

  const fetchLoginLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch("/api/login-logs");
      if (res.ok) {
        const data = await res.json();
        setLoginLogs(data);
      } else {
        showStatus("error", "Gagal memuat log aktivitas masuk dari backend.");
      }
    } catch (err) {
      showStatus("error", "Terjadi kesalahan jaringan saat memuat log.");
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus seluruh log aktivitas masuk? Tindakan ini tidak dapat dibatalkan.")) {
      return;
    }
    try {
      const res = await fetch("/api/login-logs", { method: "DELETE" });
      if (res.ok) {
        showStatus("success", "Semua log aktivitas masuk berhasil dibersihkan!");
        setLoginLogs([]);
      } else {
        showStatus("error", "Gagal membersihkan log.");
      }
    } catch (err) {
      showStatus("error", "Gagal menghubungi server.");
    }
  };

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/questions");
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      } else {
        showStatus("error", "Gagal memuat pertanyaan dari server.");
      }
    } catch (err) {
      showStatus("error", "Terjadi kesalahan jaringan saat memuat data.");
    } finally {
      setIsLoading(false);
    }
  };

  const showStatus = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleEdit = (q: Question) => {
    setEditingId(q.id);
    setText(q.text || "");
    setCategory(q.category || "Sikap Kerja");
    setTips(q.tips || "");
    setIdealAnswer(q.idealAnswer || "");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setEditingId(null);
    setText("");
    setCategory("Sikap Kerja");
    setTips("");
    setIdealAnswer("");
    setShowForm(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      showStatus("error", "Teks pertanyaan tidak boleh kosong.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId || undefined,
          text,
          category,
          tips,
          idealAnswer
        })
      });

      if (res.ok) {
        showStatus("success", editingId ? "Sukses memperbarui pertanyaan!" : "Sukses menambahkan pertanyaan baru!");
        handleCancel();
        await fetchQuestions();
        if (onQuestionsUpdated) onQuestionsUpdated();
      } else {
        const errData = await res.json();
        showStatus("error", errData.error || "Gagal menyimpan pertanyaan.");
      }
    } catch (err) {
      showStatus("error", "Gagal menghubungi server.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pertanyaan ini? Tindakan ini akan disimpan langsung ke backend.")) {
      return;
    }

    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        showStatus("success", "Pertanyaan berhasil dihapus.");
        await fetchQuestions();
        if (onQuestionsUpdated) onQuestionsUpdated();
      } else {
        showStatus("error", "Gagal menghapus pertanyaan.");
      }
    } catch (err) {
      showStatus("error", "Kesalahan koneksi saat menghapus data.");
    }
  };

  const getCategoryClass = (cat: string) => {
    switch (cat) {
      case "Perkenalan":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Sikap Kerja":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Visi Karir":
        return "bg-sky-100 text-sky-800 border-sky-200";
      case "Pengalaman":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "Organisasi":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div id="admin-panel-container" className="space-y-6 max-w-4xl mx-auto px-4 pt-1 pb-6">
      {/* Banner info */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-800 text-xs font-semibold rounded-full tracking-wide uppercase mb-2">
            <Briefcase size={12} className="text-slate-600" />
            Backend Database Terintegrasi
          </div>
          <h2 className="font-serif text-2xl font-bold text-slate-900">
            {activeSubTab === "questions" 
              ? "Atur Pertanyaan Simulasi HRD" 
              : activeSubTab === "logs" 
                ? "Log Sesi & Aktivitas Pengguna" 
                : "Ulasan, Rating & Saran Pengguna"}
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {activeSubTab === "questions"
              ? "Anda dapat menambah, mengubah, atau menghapus materi pertanyaan interview di backend. Data disimpan secara permanen."
              : activeSubTab === "logs"
                ? "Histori masuk pengguna serta draf login simulasi kandidat di platform terekam di file-db backend."
                : "Tinjau nilai kepuasan bintang, komentar, dan masukan berharga yang dikirimkan oleh pengguna secara real-time."}
          </p>
        </div>

        {activeSubTab === "questions" && !showForm && (
          <button
            id="btn-add-question"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 font-semibold rounded-xl text-sm transition-all shadow-md shadow-blue-500/10 active:scale-95 shrink-0"
          >
            <Plus size={16} />
            Tambah Pertanyaan
          </button>
        )}

        {activeSubTab === "logs" && loginLogs.length > 0 && (
          <button
            onClick={handleClearLogs}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-700 border border-rose-250 hover:bg-rose-100 font-semibold rounded-xl text-sm transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <Trash2 size={16} />
            Bersihkan Log Sesi
          </button>
        )}

        {activeSubTab === "feedback" && feedbackLogs.length > 0 && (
          <button
            onClick={handleClearFeedback}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-700 border border-rose-250 hover:bg-rose-100 font-semibold rounded-xl text-sm transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <Trash2 size={16} />
            Bersihkan Semua Ulasan
          </button>
        )}
      </div>

      {/* Sub-Tabs Selector */}
      <div className="flex flex-wrap border-b border-slate-200 gap-2 sm:gap-4">
        <button
          onClick={() => setActiveSubTab("questions")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all px-4 cursor-pointer ${
            activeSubTab === "questions"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span className="flex items-center gap-2">
            <FileText size={14} /> Kelola Pertanyaan
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab("logs")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all px-4 cursor-pointer ${
            activeSubTab === "logs"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span className="flex items-center gap-2">
            <LogIn size={14} /> Log Sesi Masuk ({loginLogs.length})
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab("feedback")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all px-4 cursor-pointer ${
            activeSubTab === "feedback"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span className="flex items-center gap-2">
            <span>⭐</span> Ulasan & Feedback ({feedbackLogs.length})
          </span>
        </button>
      </div>

      {/* Messages */}
      <AnimatePresence mode="popLayout">
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-lg flex items-center justify-between border ${
              message.type === "success"
                ? "bg-blue-50 border-blue-200 text-blue-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <span className="text-sm font-medium">{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="text-xs font-bold uppercase tracking-wider hover:underline cursor-pointer"
            >
              Tutup
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {activeSubTab === "questions" ? (
        <>
          {/* Form Section */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-xl p-6 md:p-8 border border-slate-200 shadow-md space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <h3 className="font-serif text-lg font-bold text-slate-900">
                      {editingId ? "✍️ Sunting Pertanyaan HRD" : "✨ Buat Pertanyaan Baru"}
                    </h3>
                    <button
                      onClick={handleCancel}
                      className="p-1 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <X size={14} /> Batal
                    </button>
                  </div>

                  <form onSubmit={handleSave} className="space-y-4">
                    <div id="form-field-text" className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Teks Pertanyaan (Sertakan emoji akhir jika ingin bervariasi) *
                      </label>
                      <input
                        type="text"
                        required
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Contoh: Apa kelemahan terbesar Anda dan bagaimana cara mengatasinya? 📈"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div id="form-field-cat" className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                          Kategori Pertanyaan *
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-slate-950 focus:border-slate-950 outline-none transition-all"
                        >
                          <option value="Perkenalan">Perkenalan</option>
                          <option value="Sikap Kerja">Sikap Kerja</option>
                          <option value="Visi Karir">Visi Karir</option>
                          <option value="Pengalaman">Pengalaman</option>
                          <option value="Organisasi">Organisasi</option>
                        </select>
                      </div>

                      <div id="form-field-tips" className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                          Analisis HRD / Materi Tips Menjawab (Panduan)
                        </label>
                        <input
                          type="text"
                          value={tips}
                          onChange={(e) => setTips(e.target.value)}
                          placeholder="Apa yang HRD cari dalam jawaban kandidat untuk pertanyaan ini?"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div id="form-field-answer" className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Skenario Jawaban Ideal / Kerangka Jawaban Star (Sangat Membantu Freshgraduate!)
                      </label>
                      <textarea
                        rows={4}
                        value={idealAnswer}
                        onChange={(e) => setIdealAnswer(e.target.value)}
                        placeholder="Tuliskan skrip atau poin-poin jawaban yang dinilai tinggi oleh tim HRD..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 outline-none transition-all resize-none"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="px-5 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-lg text-sm hover:bg-slate-50 transition-all cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-500/15 disabled:opacity-50 cursor-pointer"
                      >
                        {isSaving && <Loader2 size={16} className="animate-spin" />}
                        {editingId ? "Perbarui Pertanyaan" : "Simpan & Publikasikan"}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Questions list container */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                Daftar Materi Pertanyaan ({questions.length})
              </span>
              <button
                onClick={fetchQuestions}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors flex items-center gap-1 text-xs cursor-pointer"
                title="Muat ulang dari database backend"
              >
                <RotateCcw size={12} /> Segarkan
              </button>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="animate-spin text-slate-900" size={32} />
                <span className="text-sm font-semibold text-slate-500">Menghubungkan ke API backend...</span>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <p className="text-lg font-bold text-slate-700">Database Pertanyaan Kosong</p>
                <p className="text-sm text-slate-600 max-w-sm mx-auto">
                  Silakan tambahkan pertanyaan baru menggunakan tombol 'Tambah Pertanyaan' di atas.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {questions.map((q, index) => (
                  <div key={q.id} className="p-6 hover:bg-slate-50/40 transition-colors flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-slate-500 font-mono font-medium">#{index + 1}</span>
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-md border text-center ${getCategoryClass(q.category)}`}>
                          {q.category}
                        </span>
                      </div>

                      <h4 className="font-serif text-lg font-semibold text-slate-900 leading-snug">
                        {q.text}
                      </h4>

                      {q.tips && (
                        <div className="flex items-start gap-2 text-xs text-slate-600">
                          <HelpCircle size={14} className="text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-slate-700">Logika HRD: </span>
                            {q.tips}
                          </div>
                        </div>
                      )}

                      {q.idealAnswer && (
                        <div className="flex items-start gap-2 text-xs text-blue-800 bg-blue-50/50 p-2.5 rounded border border-blue-100/60 font-medium">
                          <FileText size={14} className="text-blue-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-blue-900">Skenario Jawaban Kuat: </span>
                            {q.idealAnswer}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex md:flex-col justify-end gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                      <button
                        onClick={() => handleEdit(q)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                      >
                        <Edit3 size={12} /> Sunting
                      </button>
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-100 hover:text-rose-900 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                      >
                        <Trash2 size={12} /> Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : activeSubTab === "logs" ? (
        /* LOGIN LOGS TAB */
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
              <Clock size={14} className="text-slate-500" /> Log Sesi Masuk Pengguna ({loginLogs.length})
            </span>
            <button
              onClick={fetchLoginLogs}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors flex items-center gap-1 text-xs cursor-pointer bg-white border border-slate-200 shadow-3xs"
            >
              <RotateCcw size={12} /> Segarkan Log
            </button>
          </div>

          {isLoadingLogs ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <span className="text-sm font-semibold text-slate-500">Memuat berkas log dari server...</span>
            </div>
          ) : loginLogs.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <ShieldAlert size={20} />
              </div>
              <p className="text-sm font-bold text-slate-700">Belum Ada Riwayat Log Masuk</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Setiap kali simulasi baru dimulai atau admin masuk, aktivitas tersebut akan disimpan di sini secara real-time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto text-left">
              <table className="w-full text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5 font-bold">Waktu Masuk</th>
                    <th className="px-6 py-3.5 font-bold">Nama / ID</th>
                    <th className="px-6 py-3.5 font-bold">Role</th>
                    <th className="px-6 py-3.5 font-bold">Perusahaan Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {loginLogs.map((log, idx) => {
                    const formattedDate = new Date(log.timestamp).toLocaleString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit"
                    });
                    const isAdmin = log.role === "admin";
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-[11px] text-slate-500">
                          {formattedDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-900 flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isAdmin ? "bg-rose-100 text-rose-800" : "bg-blue-100 text-blue-800"
                          }`}>
                            {isAdmin ? "A" : (log.username.charAt(0).toUpperCase() || "C")}
                          </div>
                          <span>{log.username}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                            isAdmin 
                              ? "bg-rose-50 text-rose-700 border-rose-200" 
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}>
                            {log.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">
                          {log.company ? (
                            <span className="flex items-center gap-1">
                              <Building size={12} className="text-slate-400" />
                              {log.company}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Tidak ada (Role Admin)</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* FEEDBACK LOGS TAB */
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
              <span>⭐</span> Ulasan Kepuasan Pengguna ({feedbackLogs.length})
            </span>
            <button
              onClick={fetchFeedbackLogs}
              className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors flex items-center gap-1 text-xs cursor-pointer bg-white border border-slate-200 shadow-3xs"
            >
              <RotateCcw size={12} /> Segarkan Ulasan
            </button>
          </div>

          {isLoadingFeedback ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <span className="text-sm font-semibold text-slate-500">Memuat berkas ulasan dari server...</span>
            </div>
          ) : feedbackLogs.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <ShieldAlert size={20} />
              </div>
              <p className="text-sm font-bold text-slate-700">Belum Ada Tinjauan Kepuasan</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Komentar rating, bintang, dan saran yang dimasukkan pengguna setelah melihat hasil visual evaluasi belum terekam di server.
              </p>
            </div>
          ) : (
            <div className="p-5 text-left divide-y divide-slate-150">
              {feedbackLogs.map((fb, idx) => {
                const formattedDate = new Date(fb.timestamp).toLocaleString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                });
                return (
                  <div key={idx} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-1.5 max-w-2xl w-full">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold uppercase font-mono">
                          {fb.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{fb.username}</p>
                          <p className="text-[9px] text-slate-400">{formattedDate}</p>
                        </div>
                      </div>
                      
                      {/* Rating stars rendering */}
                      <div className="flex gap-0.5 text-amber-400 text-sm">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < fb.rating ? "text-amber-400" : "text-slate-200"}>★</span>
                        ))}
                      </div>

                      {fb.comment ? (
                        <p className="text-xs text-slate-700 italic bg-slate-50 p-3 rounded-lg border border-slate-150 relative leading-relaxed w-full">
                          "{fb.comment}"
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Hanya memberi rating bintang (tanpa komentar tertulis).</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
