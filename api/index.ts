import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import {
  loadQuestions,
  saveQuestions,
  loadLoginLogs,
  saveLoginLog,
  clearLoginLogs,
  loadFeedbackLogs,
  saveFeedbackLog,
  clearFeedbackLogs,
} from "../lib/db";

dotenv.config();

const aiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

const app = express();
app.use(express.json());

// API Route: AI-powered Evaluation Analysis
app.post("/api/ai-analysis", async (req, res) => {
  const { name, responses } = req.body;

  if (!responses || !Array.isArray(responses) || responses.length === 0) {
    return res.status(400).json({ error: "Data respon kosong atau tidak valid" });
  }

  if (!aiClient) {
    let hasMelencengOffline = false;
    let totalAnsLength = 0;
    responses.forEach((r: any) => {
      const text = (r.responseText || "").trim().toLowerCase();
      totalAnsLength += text.length;
      if (text.length < 10 || text.includes("gak tau") || text.includes("tidak tahu") || text === "y" || text === "ok" || text === "a") {
        hasMelencengOffline = true;
      }
    });
    const calculatedScore = Math.min(100, Math.max(30, 50 + Math.floor(totalAnsLength / 12) - (hasMelencengOffline ? 25 : 0)));

    return res.json({
      ratingText: hasMelencengOffline ? "Butuh Pembinaan Serius!" : "Kesiapan Teruji (Offline Mode)",
      generalOverview: `Halo ${name || "Kandidat"}, simulasi Anda menunjukkan pemahaman fundamental yang cukup baik terhadap pola interview HRD. Skor kelayakan kerja Anda adalah ${calculatedScore}/100.${hasMelencengOffline ? "\n\n⚠️ KRITIK PEDAS: Beberapa jawaban Anda terdeteksi sangat melenceng, terlalu pendek, atau asal-asalan! HRD sungguhan tidak akan melanjutkan membaca draf jawaban seadanya seperti ini. Belajarlah berkomitmen menyusun pola argumen yang utuh dan profesional di dunia kerja." : ""}`,
      strengths: ["Responsif menjawab seluruh skenario yang disediakan", "Menghargai evaluasi mandiri penunjang karir"],
      improvements: hasMelencengOffline ? [
        "Kritik Pedas: Draf jawaban Anda sangat melenceng atau terlalu pendek/malas diisi. HRD tidak butir menyukai kandidat yang tidak serius menjawab pertanyaan penting!",
        "Tingkatkan kejujuran akademis dan lengkapi draf perkenalan diri",
      ] : [
        "Tingkatkan implementasi metode STAR (Situation, Task, Action, Result) pada pertanyaan perkenalan",
        "Sebutkan angka riil pencapaian akademik/organisasi Anda"
      ],
      recommendation: "Gunakan fitur unduh pada laporan untuk mematangkan konsep jawaban profesional.",
      score: calculatedScore
    });
  }

  try {
    const formattedInput = responses.map((r: any, i: number) => {
      return `Pertanyaan ${i + 1}: "${r.questionText || "Pertanyaan"}" (${r.category || "General"})\nJawaban Kandidat: "${r.responseText || "Tidak diisi"}"`;
    }).join("\n\n");

    const prompt = `Anda adalah seorang HRD Senior profesional Indonesia yang sangat berpengalaman, kritis, tegas, blak-blakan, dan menuntut standar tinggi. Analisislah hasil simulasi interview kerja berikut:
Nama Kandidat: ${name || "Kandidat"}

Berikut adalah rincian pertanyaan dan draf jawaban tertulis kandidat:
${formattedInput}

Tugas utama Anda:
1. Lakukan ulasan performa dan berikan saran konstruktif yang spesifik tentang kelebihan draf jawaban, hal yang masih kurang lengkap, serta langkah riil yang harus dilakukan.
2. CRITICAL - KRITIK PEDAS: Cek apakah ada jawaban kandidat yang sangat melenceng, melengos, tidak nyambung, asal-asalan, malas menulis (terlalu pendek seperti oke/tidak tahu/y/a), atau sama sekali tidak relevan dengan esensi pertanyaan. Jika ada, Anda WAJIB memberikan "Kritik Pedas" (roast tajam khas HRD profesional Indonesia yang sangat judes/tegas namun bermutu tinggi untuk menyadarkan kandidat) di dalam "generalOverview" dan daftarkan kritik tajam tersebut di dalam "improvements".
3. Tentukan "score" evaluasi kelayakan kerja bernilai integer antara 10 hingga 100 berdasarkan kualitas jawaban dan keseriusannya. Jika banyak jawaban melenceng atau asal-asalan, berikan nilai sangat rendah (di bawah 50) dengan kritik tajam.

Format keluaran Anda HARUS berupa JSON valid dengan bentuk persis seperti berikut (jangan sertakan teks markdown \`\`\`json atau pembungkus lain, pastikan itu pure JSON agar bisa di-parse langsung):
{
  "ratingText": "Ringkasan status kesiapan kandidat (misal: 'Sangat Siap' atau 'Butuh Pembinaan Serius')",
  "generalOverview": "Ulasan menyeluruh yang profesional namun tegas/pedas jika ada jawaban melenceng, menyadarkan kandidat mengenai draf tertulisnya.",
  "strengths": ["kelebihan konkret 1", "kelebihan konkret 2"],
  "improvements": ["kritik/hal yang perlu diperbaiki 1 (jika melenceng, berikan kritik pedas & blak-blakan di sini)", "hal yang perlu diperbaiki 2"],
  "recommendation": "Rekomendasi taktis langkah nyata yang harus dipersiapkan.",
  "score": 85
}`;

    let responseText = "";
    try {
      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        }
      });
      responseText = response.text || "";
    } catch (primaryErr) {
      console.warn("Primary model gemini-3.5-flash failed, attempting fallback to gemini-2.5-flash...", primaryErr);
      const responseDesc = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        }
      });
      responseText = responseDesc.text || "";
    }

    if (!responseText) {
      throw new Error("Empty response from Gemini API models");
    }

    const parsed = JSON.parse(responseText.trim());
    res.json(parsed);
  } catch (error) {
    console.warn("AI Analysis full failure, serving dynamic high-fidelity fallback evaluation report.", error);

    let hasMelenceng = false;
    let totalAnsLength = 0;
    responses.forEach((resp: any) => {
      const text = (resp.responseText || "").trim().toLowerCase();
      totalAnsLength += text.length;
      if (text.length < 10 || text.includes("gak tau") || text.includes("tidak tahu") || text === "y" || text === "ok" || text === "a") {
        hasMelenceng = true;
      }
    });

    const fallbackCalculatedScore = Math.min(100, Math.max(30, 50 + Math.floor(totalAnsLength / 12) - (hasMelenceng ? 25 : 0)));
    let ratingText = fallbackCalculatedScore >= 75 ? "Kesiapan Menengah & Kompeten" : "Butuh Pengayaan Metode STAR";
    let overview = `Halo ${name || "Kandidat"}, simulasi Anda menunjukkan ketertarikan tinggi terhadap peningkatan kompetensi wawancara. `;

    if (fallbackCalculatedScore >= 80) {
      ratingText = "Sangat Siap & Potensial Tinggi";
      overview += `Anda memiliki keyakinan diri yang prima dengan skor rata-rata ${fallbackCalculatedScore}/100. Karakter jawaban tertulis Anda sudah terarah, taktis, dan memiliki struktur pemecahan masalah yang baik.`;
    } else if (fallbackCalculatedScore >= 60) {
      ratingText = "Kesiapan Menengah & Kompeten";
      overview += `Skor kelayakan kerja Anda bernilai ${fallbackCalculatedScore}/100. Dasar jawaban Anda kuat, tinggal memperkaya draf agar lebih memukau.`;
    } else {
      overview += `Poin kelayakan kerja Anda bernilai ${fallbackCalculatedScore}/100. Sangat direkomendasikan mengulas kembali materi panduan HRD serta berlatih kembali.`;
    }

    if (hasMelenceng) {
      ratingText = "Butuh Pembinaan Serius!";
      overview += `\n\n⚠️ KRITIK PEDAS: Kami mendeteksi draf jawaban Anda melenceng jauh atau asal-asalan! HRD tidak menyukai draf seadanya karena menunjukkan ketidakseriusan total dalam melamar kontribusi.`;
    }

    const strengths = [
      "Menunjukkan inisiatif draf penulisan jawaban mandiri",
      "Penilaian mandiri (self-assessment) yang jujur dan reflektif"
    ];

    const improvements = [
      "Metode STAR (Situation, Task, Action, Result) perlu dipertegas porsinya dalam draf lisan",
      "Berikan penekanan pada dampak kuantitatif (angka/prosentase keberhasilan)"
    ];

    if (hasMelenceng) {
      improvements.unshift("Kritik Pedas: Hindari draf jawaban super pendek atau tidak relevan! Ketiklah draf yang mencerminkan etos kerja Anda yang sungguhan.");
    }

    res.json({
      ratingText,
      generalOverview: overview,
      strengths,
      improvements,
      recommendation: "Fokus ke kejelasan berbicara dan ketik draf jawaban dengan standar profesional.",
      score: fallbackCalculatedScore
    });
  }
});

// API Route: Get all login logs
app.get("/api/login-logs", async (req, res) => {
  const logs = await loadLoginLogs();
  res.json([...logs].reverse());
});

// API Route: Post new login log
app.post("/api/login-logs", async (req, res) => {
  const { username, company, role } = req.body;
  if (!username || !role) {
    return res.status(400).json({ error: "Kolom nama dan role wajib diisi" });
  }

  const log = {
    username,
    company: company || "",
    role,
    timestamp: new Date().toISOString()
  };

  await saveLoginLog(log);
  res.json({ success: true, log });
});

// API Route: Clear all login logs
app.delete("/api/login-logs", async (req, res) => {
  const success = await clearLoginLogs();
  if (success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: "Gagal menghapus log aktivitas" });
  }
});

// API Route: Get all feedback logs (ratings & comments)
app.get("/api/feedback-logs", async (req, res) => {
  const logs = await loadFeedbackLogs();
  res.json([...logs].reverse());
});

// API Route: Post new feedback log
app.post("/api/feedback-logs", async (req, res) => {
  const { username, rating, comment } = req.body;
  if (!rating) {
    return res.status(400).json({ error: "Kolom rating wajib diisi" });
  }

  const log = {
    username: username || "Anonim",
    rating: Number(rating),
    comment: comment || "",
    timestamp: new Date().toISOString()
  };

  await saveFeedbackLog(log);
  res.json({ success: true, log });
});

// API Route: Clear all feedback logs
app.delete("/api/feedback-logs", async (req, res) => {
  const success = await clearFeedbackLogs();
  if (success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: "Gagal menghapus log ulasan" });
  }
});

// API Route: Get all questions
app.get("/api/questions", async (req, res) => {
  const questions = await loadQuestions();
  res.json(questions);
});

// API Route: Get random questions subset
app.get("/api/questions/random", async (req, res) => {
  const questions = await loadQuestions();
  const limit = parseInt(req.query.limit as string) || 5;

  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, Math.min(limit, shuffled.length));
  res.json(selected);
});

// API Route: Add or Update a question
app.post("/api/questions", async (req, res) => {
  const { id, text, category, tips, idealAnswer } = req.body;
  if (!text || !category) {
    return res.status(400).json({ error: "Kolom pertanyaan dan kategori wajib diisi" });
  }

  const questions = await loadQuestions();
  let updatedQuestion;

  if (id) {
    const index = questions.findIndex((q: any) => q.id === id);
    if (index !== -1) {
      questions[index] = {
        ...questions[index],
        text,
        category,
        tips: tips || "",
        idealAnswer: idealAnswer || ""
      };
      updatedQuestion = questions[index];
    } else {
      return res.status(404).json({ error: "Pertanyaan tidak ditemukan" });
    }
  } else {
    const newId = "q_" + Date.now();
    updatedQuestion = {
      id: newId,
      text,
      category,
      tips: tips || "",
      idealAnswer: idealAnswer || ""
    };
    questions.push(updatedQuestion);
  }

  await saveQuestions(questions);
  res.json({ success: true, question: updatedQuestion });
});

// API Route: Delete question
app.delete("/api/questions/:id", async (req, res) => {
  const { id } = req.params;
  const questions = await loadQuestions();
  const filtered = questions.filter((q: any) => q.id !== id);

  if (filtered.length === questions.length) {
    return res.status(404).json({ error: "Pertanyaan tidak ditemukan" });
  }

  await saveQuestions(filtered);
  res.json({ success: true });
});

export default app;
