import fs from "fs";
import path from "path";

// On Vercel, install the "Upstash Redis" integration from the Vercel
// Marketplace (Storage tab -> Marketplace Database Providers -> Upstash).
// That auto-injects UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN.
// When present, we persist data to Redis so it survives across serverless
// invocations and deployments. Locally, we fall back to simple JSON files
// on disk (same behavior as before). Note: the old "Vercel KV" product
// (and its KV_REST_API_URL var) has been discontinued by Vercel.
const const useKv = !!(process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL);_REDIS_REST_URL;

let kvClientPromise: Promise<any> | null = null;
async function getKv() {
  if (!kvClientPromise) {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";
    kvClientPromise = import("@upstash/redis").then((mod) => new mod.Redis({ url, token }));
  }
  return kvClientPromise;
}

const QUESTIONS_FILE_PATH = path.join(process.cwd(), "src", "questions.json");
const LOGIN_LOGS_FILE_PATH = path.join(process.cwd(), "src", "login_logs.json");
const FEEDBACK_LOGS_FILE_PATH = path.join(process.cwd(), "src", "feedback_logs.json");

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data) as T;
  } catch (err) {
    console.error("Error reading file", filePath, err);
    return fallback;
  }
}

function writeJsonFile(filePath: string, data: unknown) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing file", filePath, err);
  }
}

// Default initial questions for fresh graduates
export const defaultQuestions = [
  {
    id: "q1",
    text: "Ceritakan tentang diri Anda dan mengapa Anda mendambakan posisi fresh graduate di perusahaan ini? 💼",
    category: "Perkenalan",
    tips: "HRD ingin melihat cara Anda mengomunikasikan kompetensi diri secara relevan dan ringkas. Fokuskan jawaban Anda pada latar belakang akademis, keahlian utama, dan antusiasme Anda terhadap peran ini.",
    idealAnswer: "Contoh Jawaban: 'Halo, saya [Nama Anda], lulusan baru dari Teknik Informatika Universitas X. Selama kuliah, saya mendalami pembuatan aplikasi web serta menjalankan magang sebagai frontend engineer. Saya melamar di sini karena kagum dengan solusi teknologi digital Executive Insights, dan saya yakin keahlian React saya bisa berkontribusi langsung pada tim.'"
  },
  {
    id: "q2",
    text: "Apa kelebihan terbesar Anda dan bagaimana itu akan memberikan kontribusi langsung bagi tim kerja kami? 🌟",
    category: "Sikap Kerja",
    tips: "Jangan sekadar menyebut kata sifat (misalnya, 'rajin'). Berikan contoh konkret dari organisasi atau proyek perkuliahan untuk mendukung klaim kelebihan Anda.",
    idealAnswer: "Contoh Jawaban: 'Kelebihan terbesar saya adalah manajemen waktu dan ketelitian. Pada proyek tugas akhir, saya bertindak sebagai koordinator tim. Dengan menyusun timeline kerja mingguan yang jelas, kami berhasil menyelesaikan riset dan aplikasi 2 minggu lebih cepat dari tenggat waktu dengan hasil A.'"
  },
  {
    id: "q3",
    text: "Apa kelemahan terbesar Anda dan langkah nyata apa yang sedang Anda lakukan untuk mengevaluasi diri? 📈",
    category: "Sikap Kerja",
    tips: "HRD menyukai kandidat yang memiliki kesadaran diri (self-awareness) dan tekad untuk memperbaiki diri. Sebutkan kelemahan yang tidak fatal untuk pekerjaan, dan tunjukkan aksi nyata penyelesaiannya.",
    idealAnswer: "Contoh Jawaban: 'Kelemahan saya adalah kadang terlalu sungkan meminta bantuan jika kesulitan, yang cenderung memperlama penyelesaian masalah sendiri. Kini saya mengatasinya dengan menerapkan batasan waktu: jika saya mentok selama 30 menit, saya akan segera berdiskusi dengan rekan atau senior.'"
  },
  {
    id: "q4",
    text: "Di mana Anda melihat petualangan karir Anda dalam lima tahun ke depan bersama perusahaan ini? 🗺️",
    category: "Visi Karir",
    tips: "Pertanyaan ini menguji loyalitas dan ambisi realistis Anda. Tunjukkan bahwa Anda ingin berkembang sejalan dengan kesuksesan perusahaan, bukan sekadar menggunakan posisi ini sebagai batu loncatan jangka pendek.",
    idealAnswer: "Contoh Jawaban: 'Dalam 5 tahun ke depan, saya berkomitmen penuh untuk menguasai sistem operasional di perusahaan ini dan berharap bisa naik ke tingkat Senior Engineer yang memimpin inisiatif produk baru. Saya juga tertarik membimbing rekan-rekan fresh graduate baru.'"
  },
  {
    id: "q5",
    text: "Bagaimana Anda mengatur skala prioritas pekerjaan ketika dihadapkan pada tenggat waktu (deadline) yang ketat? ⏱️",
    category: "Sikap Kerja",
    tips: "HRD ingin mengukur kemampuan Anda mengelola stres dan tetap produktif di bawah tekanan. Sebutkan kerangka kerja atau alat bantu organisasi yang Anda gunakan (seperti matriks Eisenhower).",
    idealAnswer: "Contoh Jawaban: 'Saya selalu membagi tugas menggunakan Matriks Eisenhower (Penting-Mendesak). Tugas penting dan mendesak diselesaikan pertama, lalu penting namun longgar. Saya juga memanfaatkan aplikasi kalender dan Google Tasks sebagai pengingat harian agar tidak ada pekerjaan yang terlewat.'"
  },
  {
    id: "q6",
    text: "Ceritakan pencapaian akademis atau non-akademis terbesar Anda selama masa perkuliahan dan pelajaran berharga darinya! 🎓",
    category: "Pengalaman",
    tips: "Berbagi cerita menggunakan metode STAR (Situation, Task, Action, Result). Pastikan Anda menutup cerita dengan pembelajaran positif yang siap diaplikasikan di dunia industri.",
    idealAnswer: "Contoh Jawaban: 'Pencapaian terbesar saya adalah saat memenangkan kompetisi Hackathon Nasional tingkat Universitas. Saya memimpin tim yang terdiri dari 3 orang dalam merancang aplikasi pelacak energi pintar dalam 48 jam. Dari situ, saya belajar pentingnya komunikasi yang jernih di bawah tekanan.'"
  },
  {
    id: "q7",
    text: "Mengapa perusahaan kami wajib memilih Anda dibandingkan dengan kandidat fresh graduate lainnya? 🏆",
    category: "Perkenalan",
    tips: "Ini kesempatan Anda menjual daya saing Anda secara elegan. Hubungkan kelebihan/nilai Anda dengan kebutuhan utama yang tertera di lowongan pekerjaan.",
    idealAnswer: "Contoh Jawaban: 'Meskipun saya fresh graduate, saya memiliki portofolio produk nyata yang selaras dengan tech stack perusahaan Anda. Selain itu, saya memiliki dorongan belajar yang sangat tinggi dan kemampuan beradaptasi yang cepat, sehingga dapat segera produktif tanpa butuh supervisi berlebih.'"
  },
  {
    id: "q8",
    text: "Bagaimana cara Anda menanggapi kritik pedas atau masukan negatif dari atasan atau rekan kerja kelak? 👂",
    category: "Sikap Kerja",
    tips: "Kematangan emosional sangat dihargai di dunia kerja profesional. Tunjukkan bahwa Anda memisahkan ego pribadi dari evaluasi kinerja demi pertumbuhan profesional.",
    idealAnswer: "Contoh Jawaban: 'Saya memandang kritik sebagai peluang belajar profesional gratis. Jika menerima masukan negatif, saya akan mendengarkannya secara objektif tanpa bersikap defensif, mencatat poin perbaikan, dan mengonfirmasikan langkah perbaikan yang akan saya ambil.'"
  },
  {
    id: "q9",
    text: "Apakah Anda bersedia ditempatkan di seluruh kantor cabang luar kota atau diminta lembur jika mendesak? 🌍",
    category: "Sikap Kerja",
    tips: "Jawablah dengan jujur namun fleksibel. Jika Anda memiliki batasan nyata, komunikasikan secara profesional beserta alternatif kontribusinya.",
    idealAnswer: "Contoh Jawaban: 'Ya, sebagai lulusan baru saya berkomitmen penuh untuk mendukung pertumbuhan bisnis perusahaan. Selagi tujuannya jelas dan diberikan pemberitahuan yang wajar demi koordinasi tugas, saya siap ditugaskan ke luar kota maupun bekerja lembur.'"
  },
  {
    id: "q10",
    text: "Ceritakan konflik kelompok yang pernah Anda hadapi saat kuliah dan bagaimana solusinya? 🤝",
    category: "Organisasi",
    tips: "Berfokuslah pada proses resolusi damai dan profesional yang solutif, bukan pada drama konfliknya itu sendiri.",
    idealAnswer: "Contoh Jawaban: 'Dalam tim tugas akhir, terjadi perdebatan tentang struktur coding. Saya mengundang kedua pihak untuk melakukan whiteboard session bersama guna membandingkan kelebihan teknis masing-masing secara kuantitatif. Kami akhirnya sepakat menggabungkan ide cemerlang keduanya secara adil.'"
  },
  {
    id: "q11",
    text: "Bagaimana cara Anda menyikapi tugas yang kurang dipahami atau instruksi dari atasan yang kurang jelas? 💬",
    category: "Kerjasama",
    tips: "HRD ingin melihat inisiatif, keterbukaan komunikasi, dan ketidakraguan Anda untuk mengonfirmasi detail daripada berasumsi secara sepihak.",
    idealAnswer: "Contoh Jawaban: 'Bila menerima instruksi yang kurang jelas, saya akan mencatat poin-poin yang dipahami terlebih dahulu. Setelah itu, saya akan meminta waktu singkat untuk mengonfirmasi detail tersebut secara sopan dengan menyodorkan opsi pemahaman saya agar diskusi berjalan efektif.'"
  },
  {
    id: "q12",
    text: "Dengan perkembangan cepat teknologi AI (Kecerdasan Buatan), bagaimana Anda mempersiapkan keahlian Anda agar tetap relevan di industri ini? 🤖",
    category: "Visi Karir",
    tips: "Tunjukkan antusiasme Anda terhadap teknologi baru dan tekankan bahwa AI adalah alat bantu akselerasi, bukan ancaman kompetitif, yang Anda pelajari secara aktif.",
    idealAnswer: "Contoh Jawaban: 'Saya memandang AI sebagai katalis produktivitas. Saya rutin mengikuti perkembangan tools AI pengembang dan aktif mengikuti kursus online sertifikasi guna melipatgandakan kecepatan riset maupun penulisan kode berkualitas tinggi.'"
  },
  {
    id: "q13",
    text: "Jika ide atau masukan yang Anda presentasikan dalam rapat kelompok ditolak mentah-mentah, bagaimana Anda menyikapinya? 💡",
    category: "Organisasi",
    tips: "HRD menilai kedewasaan profesional Anda. Tekankan sikap berlapang dada, pembelajaran objektif, dan komitmen mendukung keputusan terpilih demi keberhasilan bersama.",
    idealAnswer: "Contoh Jawaban: 'Saya tidak akan tersinggung secara pribadi. Saya akan menanyakan dengan santun poin kelemahan ide saya demi evaluasi diri. Setelah diskusi kelompok mencapai mufakat, saya akan berkomitmen 100% mendukung keputusan terpilih demi kesuksesan sasaran proyek.'"
  },
  {
    id: "q14",
    text: "Seberapa penting integritas dan transparansi saat Anda melakukan kesalahan dalam bekerja yang berdampak besar? 🛡️",
    category: "Sikap Kerja",
    tips: "Sikap jujur dan berani bertanggung jawab sangat krusial di dunia profesional. Jangan mencoba menutup-nutupi kesalahan. Tunjukkan kesiapan memitigasi dampak secepatnya.",
    idealAnswer: "Contoh Jawaban: 'Integritas dan transparansi adalah harga mati. Jika berbuat salah, saya akan segera melapor ke atasan secara jujur, membawa draf rencana solusi mitigasi, bertanggung jawab penuh, dan berkomitmen menjadikannya pelajaran agar tidak pernah terulang.'"
  },
  {
    id: "q15",
    text: "Bila Anda bergabung di sini, bagaimana cara Anda mengelola gaji pertama Anda dan berkontribusi secara sosial? 💸",
    category: "Perkenalan",
    tips: "Pertanyaan ini menilai kedewasaan finansial, kerendahan hati, dan nilai-nilai sosial yang dianut kandidat di luar jam kerja.",
    idealAnswer: "Contoh Jawaban: 'Saya akan mengalokasikan 40% untuk biaya hidup dasar, 30% untuk tabungan dan investasi pengembangan profesional, serta menyisihkan 15% untuk membantu ekonomi orang tua serta kegiatan sosial lingkungan.'"
  },
  {
    id: "q16",
    text: "Ceritakan situasi saat Anda harus mempelajari teknologi atau framework baru dalam waktu yang sangat singkat untuk menyelesaikan sebuah proyek akademik. Bagaimana cara Anda mengatasinya? 💻",
    category: "Pemecahan Masalah",
    tips: "HRD ingin melihat kemandirian belajar (fast learning rate), inisiatif menyelesaikan masalah, dan kreativitas Anda dalam menyerap keahlian teknis secara efisien.",
    idealAnswer: "Contoh Jawaban: 'Saat tugas kelompok semester akhir, kami mendadak harus menggunakan database Neo4j. Karena belum pernah memegangnya, saya mendedikasikan 3 hari pertama penuh membaca manual core, menonton kursus singkat, dan membuat skema purwarupa sederhana. Akhirnya, proyek berjalan lancar dan selesai tepat waktu.'"
  },
  {
    id: "q17",
    text: "Bagaimana Anda menyikapi anggota tim kelompok kuliah yang pasif atau menghilang saat tenggat waktu tugas sudah mendekat? 👥",
    category: "Kerjasama",
    tips: "Tolak menyalahkan rekan Anda secara emosional. Tekankan inisiatif empati, konfirmasi kendala yang dihadapi, kepemimpinan asertif, serta mitigasi bersama demi hasil tim terbaik.",
    idealAnswer: "Contoh Jawaban: 'Saya akan mencoba menghubunginya secara personal terlebih dahulu untuk menanyakan kabar serta apakah terjadi kendala darurat. Bila terpaksa ia tetap tidak merespons, saya akan mengajak anggota kelompok lain membagi porsi tugasnya secara adil untuk menyelamatkan tugas kelompok agar tetap terkirim tepat waktu.'"
  },
  {
    id: "q18",
    text: "Bagaimana Anda mempresentasikan gagasan yang sangat teknis kepada orang awam atau klien yang sama sekali tidak mengerti bidang teknologi informasi? 🗣️",
    category: "Komunikasi",
    tips: "Gunakan analogi sederhana sehari-hari, jangan memakai jargon-jargon teknis yang membingungkan, dan berfokuslah pada kegunaan nyata (user benefits).",
    idealAnswer: "Contoh Jawaban: 'Saya akan memisahkan detail koding di belakang layar dan menggunakan analogi interaktif. Misalnya, menjelaskan rest API bagaikan pelayan restoran yang menyampaikan pesanan ke dapur dan membawakan makanan lezat kembali ke meja pelanggan.'"
  },
  {
    id: "q19",
    text: "Sebutkan satu pencapaian yang ingin sekali Anda capai di lingkungan perusahaan kami dalam periode 12 bulan pertama kerja! 🎯",
    category: "Visi Karir",
    tips: "HRD menyukai kandidat yang berorientasi pada pencapaian (result-oriented) dan mengerti kontribusi nyata yang diharapkan dari seorang junior.",
    idealAnswer: "Contoh Jawaban: 'Dalam 6 bulan pertama, saya bertekad menyelesaikan onboarding cepat agar mandiri mengembangkan fitur. Di bulan ke-12, saya menargetkan ikut meluncurkan satu fitur krusial yang berdampak langsung pada kelancaran operasional Executive Insights.'"
  },
  {
    id: "q20",
    text: "Jika Anda melakukan kegagalan besar dalam proyek akademik, apa kegagalan itu dan apa refleksi terbesar yang mengubah pandangan hidup Anda setelah kejadian tersebut? 🔄",
    category: "Pengalaman",
    tips: "Kuncinya adalah menunjukkan ketangguhan (resilience) dan kemampuan belajar dari kegagalan nyata, bukan bercerita tentang kegagalan yang tampak seperti pujian terselubung.",
    idealAnswer: "Contoh Jawaban: 'Proyek kelompok pengolahan citra digital kami pernah gagal eksekusi karena kehilangan source code akibat kecerobohan tidak menggunakan Git. Sejak itu, saya berkomitmen bahwa version control dan backup rutin adalah hal wajib di setiap baris proyek yang saya pegang.'"
  },
  {
    id: "q21",
    text: "Bagaimana cara Anda menanggapi perselisihan pribadi (personal clash) dengan anggota tim yang berujung pada terhambatnya pekerjaan bersama? 🤝",
    category: "Kerjasama",
    tips: "HRD ingin melihat kematangan bersikap secara profesional dan bagaimana Anda mengabaikan ego demi kebaikan pencapaian tim bersama.",
    idealAnswer: "Contoh Jawaban: 'Saya akan mengajak rekan tersebut mengobrol santai empat mata di luar jam kantor secara terbuka. Saya akan menjelaskan bahwa fokus utama kita adalah penyelesaian tugas, dan berdiskusi mencari kesepakatan tengah tanpa membawa emosi pribadi.'"
  },
  {
    id: "q22",
    text: "Apa hal baru yang Anda pelajari secara autodidak di luar bidang studi kuliah resmi Anda dalam 6 bulan terakhir? 📚",
    category: "Perkenalan",
    tips: "HRD mengutamakan kandidat dengan minat belajar tinggi yang konstan (continuous learning mindset) bahkan tanpa diawasi institusi perkuliahan formal.",
    idealAnswer: "Contoh Jawaban: 'Dalam 6 bulan terakhir ini saya mendalami teknik presentasi bisnis dan psikologi industri melalui kursus mandiri online. Saya rasa hal ini sangat membantu saya menerjemahkan ide kode saya ke klien non-teknis.'"
  },
  {
    id: "q23",
    text: "Jika Anda kelak diberi tanggung jawab memimpin sub-kelompok kerja yang terdiri dari rekan yang lebih senior dari Anda, bagaimana cara Anda memimpin? 👑",
    category: "Organisasi",
    tips: "Pertanyaan ini menilai gaya kepemimpinan asertif, rasa hormat yang pantas kepada senior, dan inisiatif koordinasi tim yang bersinar.",
    idealAnswer: "Contoh Jawaban: 'Saya akan mengedepankan pendekatan kolaboratif. Saya akan berdiskusi secara hormat dengan mengapresiasi keahlian dan pengalaman matang mereka, mendengarkan saran-saran mereka, sembari menjaga otoritas koordinasi agar project roadmap berjalan seimbang.'"
  },
  {
    id: "q24",
    text: "Bagaimana tanggapan Anda apabila perusahaan meminta Anda menunda kelulusan resmi demi mengikuti program magang berdedikasi tinggi di sini terlebih dahulu? 🎓",
    category: "Visi Karir",
    tips: "Menilai skala prioritas, kecerdasan bersikap fleksibel, serta antusiasme yang realistis terhadap jenjang pengabdian karir jangka panjang di perusahaan.",
    idealAnswer: "Contoh Jawaban: 'Saya akan menganalisis keuntungan akademis dan prospek karir di sini secara jernih. Apabila program magang tersebut menawarkan bekal transisi karir permanen yang realistis, saya siap mendiskusikan penyesuaian jadwal sidang dengan dosen pembimbing.'"
  },
  {
    id: "q25",
    text: "Seberapa jauh Anda bersedia belajar di luar jam kerja resmi dan bagaimana cara Anda menghindari kejenuhan ekstrem (burnout)? 💡",
    category: "Sikap Kerja",
    tips: "Menilai gairah belajar (learning passion) serta kemampuan mengelola ketahanan mental (mental fitness) di tengah beban industri yang dinamis.",
    idealAnswer: "Contoh Jawaban: 'Saya mengalokasikan 1-2 jam per hari untuk riset teknologi baru. Untuk menghindari burnout, saya selalu disiplin memisahkan waktu layar dengan rutin berolahraga lari akhir pekan serta memasak hobi bersama keluarga.'"
  },
  {
    id: "q26",
    text: "Bila terjadi kesalahan fatal akibat instruksi atasan yang keliru, bagaimana Anda menyikapi situasi tersebut tanpa menjatuhkan nama baik atasan Anda? 🛡️",
    category: "Sikap Kerja",
    tips: "Menilai loyalitas tim, kecerdasan diplomatis bersosialisasi, serta komitmen meluruskan masalah di ruang privat tanpa melahirkan intrik politik.",
    idealAnswer: "Contoh Jawaban: 'Saya akan mendatangi ruangan atasan secara personal untuk membawa draf perbandingan data riil demi klarifikasi sopan. Bila langkah perbaikan disetujui, kami akan menyelesaikannya bersama-sama sebagai tim tanpa mengekspos letak kesalahan personal.'"
  },
  {
    id: "q27",
    text: "Bagaimana cara Anda menyeimbangkan kualitas pekerjaan yang sempurna dengan tuntutan waktu penyusunan tugas yang amat instan? ⚡",
    category: "Pemecahan Masalah",
    tips: "Menilai manajemen kualitas kerja serta pemahaman Anda mengenai prinsip Minimum Viable Product (MVP) yang fungsional di dunia industri.",
    idealAnswer: "Contoh Jawaban: 'Saya akan berfokus meluncurkan fungsi utama (core utility) terpenting terlebih dahulu yang bebas bug agar sistem beroperasi stabil. Setelah target esensial tercapai di bawah deadline, baru saya melakukan peningkatan bertahap.'"
  },
  {
    id: "q28",
    text: "Apa mimpi terbesar dalam hidup Anda yang ingin Anda wujudkan melalui perantara keberhasilan finansial dan profesional di perusahaan ini? 🌟",
    category: "Visi Karir",
    tips: "HRD mencari kandidat yang memiliki 'jangkar mimpi hidup' (life anchor) yang kuat karena kandidat seperti ini terbukti lebih ulet dan disiplin menerjang badai karir.",
    idealAnswer: "Contoh Jawaban: 'Mimpi terbesar saya adalah mendongkrak kesejahteraan orang tua saya sepenuhnya dan mendirikan rumah belajar gratis IT bagi anak-anak jalanan di kampung halaman saya.'"
  }
];

// ---------- Questions ----------
export async function loadQuestions(): Promise<any[]> {
  if (useKv) {
    const client = await getKv();
    const data = (await client.get("questions")) as any[];
    if (!data || data.length === 0) {
      await client.set("questions", defaultQuestions);
      return defaultQuestions;
    }
    if (data.length < defaultQuestions.length) {
      const existingIds = new Set(data.map((q: any) => q.id));
      const missing = defaultQuestions.filter((q) => !existingIds.has(q.id));
      if (missing.length > 0) {
        const merged = [...data, ...missing];
        await client.set("questions", merged);
        return merged;
      }
    }
    return data;
  }

  const parsed = readJsonFile<any[] | null>(QUESTIONS_FILE_PATH, null as any);
  if (!parsed) {
    writeJsonFile(QUESTIONS_FILE_PATH, defaultQuestions);
    return defaultQuestions;
  }
  if (Array.isArray(parsed) && parsed.length < defaultQuestions.length) {
    const existingIds = new Set(parsed.map((q: any) => q.id));
    const missing = defaultQuestions.filter((q) => !existingIds.has(q.id));
    if (missing.length > 0) {
      const merged = [...parsed, ...missing];
      writeJsonFile(QUESTIONS_FILE_PATH, merged);
      return merged;
    }
  }
  return parsed;
}

export async function saveQuestions(questions: any[]) {
  if (useKv) {
    const client = await getKv();
    await client.set("questions", questions);
    return;
  }
  writeJsonFile(QUESTIONS_FILE_PATH, questions);
}

// ---------- Login logs ----------
export async function loadLoginLogs(): Promise<any[]> {
  if (useKv) {
    const client = await getKv();
    const data = (await client.get("login_logs")) as any[];
    return data || [];
  }
  return readJsonFile<any[]>(LOGIN_LOGS_FILE_PATH, []);
}

export async function saveLoginLog(log: { username: string; company?: string; role: "admin" | "candidate"; timestamp: string }) {
  const logs = await loadLoginLogs();
  logs.push(log);
  if (useKv) {
    const client = await getKv();
    await client.set("login_logs", logs);
    return;
  }
  writeJsonFile(LOGIN_LOGS_FILE_PATH, logs);
}

export async function clearLoginLogs(): Promise<boolean> {
  try {
    if (useKv) {
      const client = await getKv();
      await client.set("login_logs", []);
      return true;
    }
    writeJsonFile(LOGIN_LOGS_FILE_PATH, []);
    return true;
  } catch (err) {
    console.error("Error clearing login logs:", err);
    return false;
  }
}

// ---------- Feedback logs ----------
export async function loadFeedbackLogs(): Promise<any[]> {
  if (useKv) {
    const client = await getKv();
    const data = (await client.get("feedback_logs")) as any[];
    return data || [];
  }
  return readJsonFile<any[]>(FEEDBACK_LOGS_FILE_PATH, []);
}

export async function saveFeedbackLog(log: { username: string; rating: number; comment: string; timestamp: string }) {
  const logs = await loadFeedbackLogs();
  logs.push(log);
  if (useKv) {
    const client = await getKv();
    await client.set("feedback_logs", logs);
    return;
  }
  writeJsonFile(FEEDBACK_LOGS_FILE_PATH, logs);
}

export async function clearFeedbackLogs(): Promise<boolean> {
  try {
    if (useKv) {
      const client = await getKv();
      await client.set("feedback_logs", []);
      return true;
    }
    writeJsonFile(FEEDBACK_LOGS_FILE_PATH, []);
    return true;
  } catch (err) {
    console.error("Error clearing feedback logs:", err);
    return false;
  }
}
