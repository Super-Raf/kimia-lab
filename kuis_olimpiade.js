// =========================================================================
// 1. STATE UTAMA (TERPISAH ANTARA MODE SEKOLAH & MODE OLIMPIADE)
// =========================================================================
let activeTrack = 'school';       // 'school' (Golongan A) atau 'olympiad' (Semua 1-118)
let schoolLayout = 'dimmed';      // 'dimmed' (18 kolom) atau 'compact' (8 kolom IA-VIIIA)
let currentHeatmap = 'category';

const statsByTrack = {
    school:   { score: 0, streak: 0, total: 0, correct: 0 },
    olympiad: { score: 0, streak: 0, total: 0, correct: 0 }
};

let currentQuestion = null;
let answeredCurrent = false;

const ptable = document.getElementById('ptable');
const modal = document.getElementById('modal');

const TREND_INFO = {
    category: {
        school: "<strong>Mode Sekolah (Golongan IA–VIIIA):</strong> Klik unsur Golongan A untuk melihat konfigurasi elektron, golongan/periode, dan sifat periodik dasarnya.",
        olympiad: "<strong>Mode Olimpiade (Semua Unsur 1–118):</strong> Seluruh blok s, p, d, dan f aktif penuh untuk eksplorasi konfigurasi anomali dan sifat kuantitatif."
    },
    radius: {
        school: "<strong>Jari-Jari Atom (pm) — Aturan Golongan A:</strong> Dalam 1 periode (kiri → kanan) <em>mengecil</em> karena tarikan inti bertambah. Dalam 1 golongan (atas → bawah) <em>membesar</em> karena jumlah kulit bertambah.",
        olympiad: "<strong>Jari-Jari Atom (pm) — Level OSN:</strong> Perhatikan <strong>Kontraksi Lantanida</strong> (Zr 206 pm ≈ Hf 208 pm; kovalen 160 vs 159 pm) dan <strong>Kontraksi Blok-d</strong> (Al vs Ga) akibat lemahnya shielding orbital 4f & 3d."
    },
    ie: {
        school: "<strong>Energi Ionisasi ke-1 (kJ/mol) — Aturan Golongan A:</strong> Umumnya naik dari kiri ke kanan dan dari bawah ke atas (semakin sukar melepas elektron valensi).",
        olympiad: "<strong>Energi Ionisasi ke-1 (kJ/mol) — Level OSN:</strong> Waspadai anomali subkulit penuh (<strong>Be > B</strong>, <strong>Mg > Al</strong>) dan setengah penuh (<strong>N > O</strong>, <strong>P > S</strong>)."
    },
    ea: {
        school: "<strong>Afinitas Elektron (kJ/mol dilepaskan):</strong> Unsur nonlogam Golongan VIA dan VIIA (Halogen) melepaskan energi besar saat menangkap elektron membentuk anion.",
        olympiad: "<strong>Afinitas Elektron (kJ/mol) — Level OSN:</strong> Rekor tertinggi dipegang <strong>Cl (348.6 kJ/mol)</strong> melampaui F (328.0 kJ/mol) akibat tolakan ruang orbital 2p F yang sempit. Gas mulia, IIA, dan N bernilai negatif."
    },
    en: {
        school: "<strong>Keelektronegatifan (Skala Pauling):</strong> Kecenderungan menarik elektron ikatan. Tertinggi pada <strong>F (3.98)</strong> di kanan atas dan terendah pada logam alkali di kiri bawah.",
        olympiad: "<strong>Keelektronegatifan (Pauling) — Level OSN:</strong> Urutan 4 besar: <strong>F (3.98) > O (3.44) > Cl (3.16) > N (3.04)</strong>. Emas (Au = 2.54) & Timbal (Pb = 2.33) tinggi akibat efek relativistik."
    }
};

// =========================================================================
// 2. SAKELAR MODE SEKOLAH (GOLONGAN A) vs MODE OLIMPIADE (SEMUA UNSUR)
// =========================================================================
function setTrackMode(track) {
    activeTrack = track;
    document.body.className = `track-${track}`;

    document.getElementById('btn-track-school').classList.toggle('active', track === 'school');
    document.getElementById('btn-track-olympiad').classList.toggle('active', track === 'olympiad');

    const indicator = document.getElementById('track-indicator');
    const layoutBar = document.getElementById('school-layout-bar');

    if (track === 'school') {
        indicator.innerHTML = "Aktif: <strong>Mode Sekolah</strong> — Tabel SPU dan tebak-tebakan dikunci khusus untuk <strong>Golongan IA – VIIIA</strong>.";
        layoutBar.classList.remove('hidden');
        document.querySelectorAll('[data-osn-only="true"]').forEach(el => el.classList.add('hidden-leg'));
    } else {
        indicator.innerHTML = "Aktif: <strong>Mode Olimpiade / OSN</strong> — Mencakup <strong>semua 118 unsur</strong> (Golongan A, Transisi B, Lantanida, Aktinida) beserta jebakan anomali.";
        layoutBar.classList.add('hidden');
        document.querySelectorAll('[data-osn-only="true"]').forEach(el => el.classList.remove('hidden-leg'));
    }

    updateTrendBanner();
    renderPeriodicTable();
    populateQuizModes();
    updateScoreboardUI();
    generateQuestion();
}

function setSchoolLayout(layout) {
    schoolLayout = layout;
    document.getElementById('btn-layout-full').classList.toggle('active', layout === 'dimmed');
    document.getElementById('btn-layout-compact').classList.toggle('active', layout === 'compact');
    renderPeriodicTable();
}

function setHeatmapMode(mode, btn) {
    currentHeatmap = mode;
    document.querySelectorAll('.hm-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateTrendBanner();
    renderPeriodicTable();
}

function updateTrendBanner() {
    document.getElementById('trend-banner').innerHTML = TREND_INFO[currentHeatmap][activeTrack];
}

// =========================================================================
// 3. RENDER TABEL PERIODIK (MENYESUAIKAN MODE SEKOLAH vs OLIMPIADE)
// =========================================================================
function getHeatmapColor(mode, el) {
    if (mode === 'category') return null;
    const val = el[mode];
    if (val === null || val === undefined) return "#374151";

    let ratio = 0;
    if (mode === 'radius') ratio = Math.min(1, Math.max(0, (val - 30) / (300 - 30)));
    if (mode === 'ie') ratio = Math.min(1, Math.max(0, (val - 370) / (2380 - 370)));
    if (mode === 'ea') ratio = Math.min(1, Math.max(0, (val + 120) / (350 + 120)));
    if (mode === 'en') ratio = Math.min(1, Math.max(0, (val - 0.7) / (4.0 - 0.7)));

    const hue = Math.round((1 - ratio) * 210);
    return `hsl(${hue}, 88%, 68%)`;
}

function createElementCell(elData, gridRow, gridCol, isLocked) {
    const cell = document.createElement('div');
    cell.className = `element ${currentHeatmap === 'category' ? elData.cat : ''} ${isLocked ? 'locked-el' : ''}`;
    cell.style.gridRow = gridRow;
    cell.style.gridColumn = gridCol;

    if (currentHeatmap !== 'category' && !isLocked) {
        const bg = getHeatmapColor(currentHeatmap, elData);
        cell.style.backgroundColor = bg;
        if (bg === "#374151") cell.style.color = "#9ca3af";
    }

    const groupTag = elData.groupA ? elData.groupA : '';
    let bottomHTML = `<div class="el-name">${elData.name}</div>`;
    if (currentHeatmap !== 'category' && !isLocked) {
        const rawVal = elData[currentHeatmap];
        const dispVal = (rawVal === null || rawVal === undefined) ? 'N/A' : rawVal;
        bottomHTML = `<div class="el-val">${dispVal}</div>`;
    }

    cell.innerHTML = `
        <div class="el-top"><span>${elData.z}</span><span>${groupTag}</span></div>
        <div class="el-sym">${elData.sym}</div>
        ${bottomHTML}
    `;

    if (!isLocked) {
        cell.onclick = () => openElementModal(elData);
    }
    return cell;
}

function renderPeriodicTable() {
    ptable.innerHTML = '';

    // Tata letak khusus: Mode Sekolah dengan 8 Kolom Rapat (IA - VIIIA)
    if (activeTrack === 'school' && schoolLayout === 'compact') {
        ptable.className = 'periodic-table compact-8';
        const colMap = { 1: 1, 2: 2, 13: 3, 14: 4, 15: 5, 16: 6, 17: 7, 18: 8 };
        const headers = ["IA", "IIA", "IIIA", "IVA", "VA", "VIA", "VIIA", "VIIIA"];

        headers.forEach((h, idx) => {
            const hd = document.createElement('div');
            hd.className = 'group-header';
            hd.style.gridRow = 1;
            hd.style.gridColumn = idx + 1;
            hd.innerText = h;
            ptable.appendChild(hd);
        });

        ELEMENTS_DB.filter(e => e.groupA !== null).forEach(elData => {
            const c = colMap[elData.col];
            const r = elData.row + 1; // geser 1 baris karena header golongan di baris 1
            ptable.appendChild(createElementCell(elData, r, c, false));
        });
        return;
    }

    // Tata letak 18 Kolom Standar
    ptable.className = 'periodic-table';
    const isSchoolDimmed = activeTrack === 'school';

    for (let r = 1; r <= 10; r++) {
        for (let c = 1; c <= 18; c++) {
            if (r === 6 && c === 3) {
                const m = document.createElement('div');
                m.className = `gap-marker ${isSchoolDimmed ? 'locked-el' : ''}`;
                m.style.gridRow = r; m.style.gridColumn = c;
                m.innerHTML = '57–71<br>La–Lu';
                ptable.appendChild(m);
                continue;
            }
            if (r === 7 && c === 3) {
                const m = document.createElement('div');
                m.className = `gap-marker ${isSchoolDimmed ? 'locked-el' : ''}`;
                m.style.gridRow = r; m.style.gridColumn = c;
                m.innerHTML = '89–103<br>Ac–Lr';
                ptable.appendChild(m);
                continue;
            }
            if (r === 8) continue;

            const elData = ELEMENTS_DB.find(e => e.row === r && e.col === c);
            if (elData) {
                const isLocked = isSchoolDimmed && elData.groupA === null;
                ptable.appendChild(createElementCell(elData, r, c, isLocked));
            }
        }
    }
}

function openElementModal(el) {
    document.getElementById('m-z').innerText = el.z;
    document.getElementById('m-sym').innerText = el.sym;
    document.getElementById('m-name').innerText = el.name;
    document.getElementById('m-group').innerText = el.groupA
        ? `Golongan ${el.groupA} • Periode ${el.row}`
        : `Blok-${el.row >= 9 ? 'f' : 'd'} • Periode ${el.row >= 9 ? el.row - 3 : el.row}`;
    document.getElementById('m-cat').innerText = `Kategori: ${el.cat.replace('-', ' ').toUpperCase()}`;
    document.getElementById('m-config').innerText = el.config;

    document.getElementById('m-radius').innerText = el.radius ? `${el.radius} pm` : 'Tidak tersedia';
    document.getElementById('m-ie').innerText = el.ie ? `${el.ie} kJ/mol` : 'Tidak tersedia';
    document.getElementById('m-ea').innerText = (el.ea !== null) ? `${el.ea} kJ/mol` : 'Tidak tersedia';
    document.getElementById('m-en').innerText = (el.en !== null) ? `${el.en} (Pauling)` : 'Tidak terdefinisi';

    document.getElementById('m-desc').innerText = el.desc;
    document.getElementById('m-use').innerText = el.use;

    const mBox = document.getElementById('m-box');
    mBox.innerText = el.sym;
    mBox.className = `m-box ${el.cat}`;
    modal.style.display = 'flex';
}

document.getElementById('close-modal').onclick = () => modal.style.display = 'none';
window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

function switchView(viewId, btn) {
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    btn.classList.add('active');
    if (viewId === 'quiz-view' && !currentQuestion) generateQuestion();
}

// =========================================================================
// 4. BANK SOAL KHUSUS OLIMPIADE & SOAL ION/LONJAKAN IE
// =========================================================================
const OLYMPIAD_ANOMALIES = [
    {
        topic: "ie",
        title: "Manakah yang memiliki Energi Ionisasi Pertama (IE₁) lebih tinggi antara Berilium (₄Be) dan Boron (₅B)?",
        options: ["Berilium (Be)", "Boron (B)", "Keduanya sama besar", "Boron karena muatan intinya +5"],
        answer: 0,
        explanation: "<strong>Be (900 kJ/mol) > B (801 kJ/mol)</strong>. Konfigurasi Be adalah 1s² 2s² (subkulit 2s penuh dan stabil), sedangkan elektron terluar B berada di orbital 2p¹ yang lebih mudah dilepas akibat efek perisai orbital 2s."
    },
    {
        topic: "ie",
        title: "Mengapa Energi Ionisasi Pertama Nitrogen (₇N = 1402 kJ/mol) lebih tinggi dibandingkan Oksigen (₈O = 1314 kJ/mol)?",
        options: [
            "Nitrogen memiliki konfigurasi 2p³ setengah penuh dengan tolakan antar-elektron lebih rendah",
            "Jari-jari atom Oksigen lebih besar daripada Nitrogen",
            "Oksigen memiliki efek pasangan inert pada orbital 2s",
            "Nitrogen lebih elektronegatif daripada Oksigen"
        ],
        answer: 0,
        explanation: "Pada <strong>₇N ([He] 2s² 2p³)</strong>, tiga elektron 2p tersebar sejajar di tiga orbital berbeda (Aturan Hund). Pada <strong>₈O ([He] 2s² 2p⁴)</strong>, elektron ke-4 berpasangan dalam satu orbital 2p sehingga menimbulkan tolakan elektron (pairing energy)."
    },
    {
        topic: "ie",
        title: "Pada Periode 3, urutan kenaikan Energi Ionisasi Pertama (IE₁) yang BENAR dari terkecil ke terbesar adalah...",
        options: [
            "Na < Al < Mg < Si < S < P < Cl < Ar",
            "Na < Mg < Al < Si < P < S < Cl < Ar",
            "Na < Mg < Al < Si < S < P < Cl < Ar",
            "Na < Al < Mg < Si < P < S < Cl < Ar"
        ],
        answer: 0,
        explanation: "Dua anomali wajib OSN di Periode 3: <strong>Mg (738) > Al (578)</strong> (subkulit 3s² penuh) dan <strong>P (1012) > S (1000)</strong> (subkulit 3p³ setengah penuh)."
    },
    {
        topic: "ea",
        title: "Manakah unsur yang melepaskan energi paling besar saat menangkap satu elektron (Afinitas Elektron paling eksotermis)?",
        options: ["Klorin (₁₇Cl)", "Fluorin (₉F)", "Oksigen (₈O)", "Belerang (₁₆S)"],
        answer: 0,
        explanation: "<strong>Cl (348.6 kJ/mol) > F (328.0 kJ/mol)</strong>. Ukuran atom F yang sangat kecil membuat kerapatan elektron di orbital 2p sangat padat, sehingga menimbulkan tolakan elektrostatik kuat terhadap elektron yang baru masuk."
    },
    {
        topic: "radius",
        title: "Mengapa jari-jari kovalen Hafnium (₇₂Hf = 159 pm) hampir identik dengan Zirkonium (₄₀Zr = 160 pm) meskipun Hf berada satu periode di bawah Zr?",
        options: [
            "Kontraksi Lantanida akibat lemahnya efek perisai (shielding) 14 elektron di subkulit 4f",
            "Hafnium mengalami peluruhan radioaktif yang menyusutkan awan elektronnya",
            "Subkulit 5d pada Hafnium kosong",
            "Muatan inti efektif Zirkonium lebih besar daripada Hafnium"
        ],
        answer: 0,
        explanation: "<strong>Kontraksi Lantanida:</strong> Pengisian 14 elektron pada orbital 4f (₅₇La–₇₁Lu) memberikan efek perisai yang sangat lemah (s > p > d > f), sehingga lonjakan +14 proton menarik kulit terluar ke dalam."
    },
    {
        topic: "radius",
        title: "Mengapa jari-jari kovalen Galium (₃₁Ga = 122 pm) hampir sama dengan Aluminium (₁₃Al = 121 pm)?",
        options: [
            "Kontraksi Blok-d akibat pengisian 10 elektron pada orbital 3d sebelum Ga",
            "Galium adalah unsur nonlogam sehingga ikatannya lebih pendek",
            "Aluminium memiliki jumlah kulit lebih banyak daripada Galium",
            "Galium tidak memiliki elektron pada subkulit 4p"
        ],
        answer: 0,
        explanation: "<strong>Kontraksi Blok-d</strong> terjadi setelah deret transisi pertama (3d¹–3d¹⁰). Lemahnya shielding orbital 3d meningkatkan Z<sub>eff</sub> pada Ga sehingga ukurannya menyusut mendekati Al."
    },
    {
        topic: "en",
        title: "Urutan Keelektronegatifan Pauling untuk empat unsur paling elektronegatif di tabel periodik adalah...",
        options: [
            "F > O > Cl > N",
            "F > O > N > Cl",
            "F > Cl > O > N",
            "O > F > Cl > N"
        ],
        answer: 0,
        explanation: "Nilai skala Pauling eksak: <strong>F (3.98) > O (3.44) > Cl (3.16) > N (3.04)</strong>. Klorin lebih elektronegatif daripada Nitrogen."
    },
    {
        topic: "en",
        title: "Manakah logam transisi dengan keelektronegatifan Pauling tertinggi (2.54) yang bahkan mampu membentuk anion aurida (Au⁻)?",
        options: ["Emas (₇₉Au)", "Perak (₄₇Ag)", "Tembaga (₂₉Cu)", "Besi (₂₆Fe)"],
        answer: 0,
        explanation: "<strong>Emas (Au, χ = 2.54)</strong> mengalami <strong>efek relativistik</strong> kuat yang mengontraksi orbital 6s¹, sehingga Au sangat sukar melepas elektron dan mudah menangkap elektron membentuk senyawa Cs⁺Au⁻."
    }
];

const SCHOOL_ION_QUESTIONS = [
    {
        topic: "radius",
        title: "Urutkan ion-ion Golongan A yang isoelektronik (semuanya memiliki 10 elektron) dari jari-jari TERKECIL ke TERBESAR: O²⁻, F⁻, Na⁺, Mg²⁺, Al³⁺",
        options: [
            "Al³⁺ < Mg²⁺ < Na⁺ < F⁻ < O²⁻",
            "O²⁻ < F⁻ < Na⁺ < Mg²⁺ < Al³⁺",
            "Na⁺ < Mg²⁺ < Al³⁺ < F⁻ < O²⁻",
            "Al³⁺ < Na⁺ < Mg²⁺ < O²⁻ < F⁻"
        ],
        answer: 0,
        explanation: "Semua memiliki 10 elektron (konfigurasi Ne). Semakin besar nomor atom (jumlah proton), semakin kuat tarikan inti sehingga jari-jari ion makin kecil: <strong>₁₃Al³⁺ < ₁₂Mg²⁺ < ₁₁Na⁺ < ₉F⁻ < ₈O²⁻</strong>."
    },
    {
        topic: "radius",
        title: "Urutkan spesies isoelektronik Golongan A (18 elektron) berikut dari ukuran TERBESAR ke TERKECIL: P³⁻, S²⁻, Cl⁻, K⁺, Ca²⁺",
        options: [
            "P³⁻ > S²⁻ > Cl⁻ > K⁺ > Ca²⁺",
            "Ca²⁺ > K⁺ > Cl⁻ > S²⁻ > P³⁻",
            "Cl⁻ > S²⁻ > P³⁻ > K⁺ > Ca²⁺",
            "P³⁻ > Cl⁻ > S²⁻ > Ca²⁺ > K⁺"
        ],
        answer: 0,
        explanation: "Semua memiliki 18 elektron ([Ar]). Semakin kecil jumlah protonnya, semakin lemah tarikan inti sehingga awan elektron makin mengembang: <strong>₁₅P³⁻ > ₁₆S²⁻ > ₁₇Cl⁻ > ₁₉K⁺ > ₂₀Ca²⁺</strong>."
    },
    {
        topic: "radius",
        title: "Bandingkan jari-jari atom netral Klorin (Cl), ion Klorida (Cl⁻), dan ion Kalium (K⁺):",
        options: [
            "K⁺ < Cl < Cl⁻",
            "Cl < Cl⁻ < K⁺",
            "Cl⁻ < Cl < K⁺",
            "Cl < K⁺ < Cl⁻"
        ],
        answer: 0,
        explanation: "Anion <strong>Cl⁻</strong> lebih besar daripada atom netral <strong>Cl</strong> karena tambahan 1 elektron menambah tolakan antar-elektron. Kation <strong>K⁺</strong> paling kecil karena kulit ke-4 telah kosong dan jumlah protonnya lebih banyak (19 vs 17)."
    }
];

const OLYMPIAD_ION_QUESTIONS = [
    ...SCHOOL_ION_QUESTIONS,
    {
        topic: "radius",
        title: "Manakah urutan jari-jari yang BENAR untuk atom netral dan kation-kation Besi (₂₆Fe)?",
        options: [
            "Fe³⁺ < Fe²⁺ < Fe",
            "Fe < Fe²⁺ < Fe³⁺",
            "Fe²⁺ < Fe³⁺ < Fe",
            "Fe³⁺ = Fe²⁺ < Fe"
        ],
        answer: 0,
        explanation: "Semakin banyak elektron yang dilepas dari atom transisi, semakin berkurang tolakan antar-elektron dan semakin kuat tarikan inti per elektron: <strong>Fe³⁺ (65 pm) < Fe²⁺ (78 pm) < Fe (126 pm)</strong>."
    },
    {
        topic: "ie",
        title: "Manakah spesies yang memiliki Energi Ionisasi paling tinggi di antara spesies isoelektronik 10-elektron berikut?",
        options: ["Al³⁺", "Mg²⁺", "Na⁺", "Ne"],
        answer: 0,
        explanation: "<strong>Al³⁺</strong> memiliki jumlah proton terbanyak (Z = 13) untuk menarik 10 elektron yang sama, sehingga elektron berikutnya paling sukar dilepas (IE₄ Al = 11.577 kJ/mol)."
    }
];

const IE_JUMP_QUESTIONS = [
    {
        topic: "ie",
        title: "Suatu unsur Golongan A pada Periode 3 memiliki data Energi Ionisasi (kJ/mol) berikut. Unsur tersebut adalah...",
        table: { headers: ["IE₁", "IE₂", "IE₃", "IE₄", "IE₅"], values: ["738", "1.451", "7.733", "10.543", "13.630"] },
        options: ["Magnesium (Mg — IIA)", "Natrium (Na — IA)", "Aluminium (Al — IIIA)", "Silikon (Si — IVA)"],
        answer: 0,
        explanation: "Lonjakan ekstrem terjadi antara <strong>IE₂ (1.451)</strong> dan <strong>IE₃ (7.733)</strong>, menandakan unsur memiliki <strong>2 elektron valensi (Golongan IIA)</strong> di Periode 3, yaitu <strong>Magnesium (Mg)</strong>."
    },
    {
        topic: "ie",
        title: "Berdasarkan lonjakan Energi Ionisasi (kJ/mol) unsur Golongan A di Periode 3 berikut, tentukan unsurnya:",
        table: { headers: ["IE₁", "IE₂", "IE₃", "IE₄", "IE₅"], values: ["578", "1.817", "2.745", "11.577", "14.842"] },
        options: ["Aluminium (Al — IIIA)", "Magnesium (Mg — IIA)", "Silikon (Si — IVA)", "Fosfor (P — VA)"],
        answer: 0,
        explanation: "Lonjakan besar terjadi setelah elektron ke-3 dilepas: <strong>IE₃ (2.745) → IE₄ (11.577)</strong>. Artinya memiliki <strong>3 elektron valensi (Golongan IIIA)</strong> di Periode 3, yaitu <strong>Aluminium (Al)</strong>."
    },
    {
        topic: "ie",
        title: "Perhatikan data IE₁–IE₅ suatu logam Golongan A (kJ/mol). Rumus garam klorida yang dibentuk logam M adalah...",
        table: { headers: ["IE₁", "IE₂", "IE₃", "IE₄", "IE₅"], values: ["419", "3.052", "4.420", "5.877", "7.975"] },
        options: ["MCl (Golongan IA)", "MCl₂ (Golongan IIA)", "MCl₃ (Golongan IIIA)", "MCl₄ (Golongan IVA)"],
        answer: 0,
        explanation: "Lonjakan >7 kali lipat langsung terjadi setelah <strong>IE₁ (419 → 3.052 kJ/mol)</strong>, menandakan <strong>1 elektron valensi (Golongan IA)</strong> sehingga membentuk ion M⁺ dan senyawa <strong>MCl</strong>."
    }
];

// =========================================================================
// 5. MESIN GENERATOR SOAL (TERPISAH ANTARA SEKOLAH & OLIMPIADE)
// =========================================================================
const PROP_META = {
    radius: { label: "Jari-Jari Atom", unit: "pm", adjHigh: "lebih besar", adjLow: "lebih kecil", asc: "terkecil ke terbesar" },
    ie: { label: "Energi Ionisasi Pertama (IE₁)", unit: "kJ/mol", adjHigh: "lebih tinggi", adjLow: "lebih rendah", asc: "terendah ke tertinggi" },
    ea: { label: "Afinitas Elektron (Eksotermis)", unit: "kJ/mol", adjHigh: "lebih besar", adjLow: "lebih kecil", asc: "terendah ke tertinggi" },
    en: { label: "Keelektronegatifan Pauling", unit: "", adjHigh: "lebih elektronegatif", adjLow: "kurang elektronegatif", asc: "terendah ke tertinggi" }
};

function populateQuizModes() {
    const sel = document.getElementById('quiz-mode');
    if (activeTrack === 'school') {
        sel.innerHTML = `
            <option value="mixed">Campuran Sekolah (Semua Tipe Golongan A)</option>
            <option value="spu_spot">1. Tebak Unsur di Peta Tabel SPU (Golongan A)</option>
            <option value="duel">2. Duel 2 Unsur Golongan A (Mana Lebih Besar?)</option>
            <option value="ranking">3. Urutkan 4 Unsur Golongan A (Kecil → Besar)</option>
            <option value="ions">4. Jari-Jari Ion & Isoelektronik Golongan A</option>
            <option value="ie_jump">5. Tebak Golongan dari Lonjakan IE₁–IE₅</option>
        `;
    } else {
        sel.innerHTML = `
            <option value="mixed">Simulasi Campuran OSN (Semua Tipe 1–118)</option>
            <option value="spu_spot">1. Tebak Unsur di Peta Tabel SPU (Full 118 Unsur)</option>
            <option value="duel">2. Duel 2 Unsur (Semua Blok s, p, d, f)</option>
            <option value="ranking">3. Urutkan 4 Unsur (Kecil → Besar)</option>
            <option value="anomaly">4. Jebakan Anomali Wajib OSN!</option>
            <option value="ions">5. Spesies Isoelektronik & Ion Transisi</option>
            <option value="ie_jump">6. Analisis Lonjakan IE₁–IE₅</option>
            <option value="mystery">7. Deduksi Unsur Misterius Kuantitatif</option>
        `;
    }
}

function getPoolForTrack(prop = null) {
    if (activeTrack === 'school') {
        // Hanya Golongan A dengan data lengkap (Z <= 88: H sampai Ra)
        return ELEMENTS_DB.filter(el => {
            if (el.groupA === null || el.z > 88) return false;
            if (prop && (el[prop] === null || el[prop] === undefined)) return false;
            return true;
        });
    } else {
        // Semua unsur 1 - 103 untuk Olimpiade
        return ELEMENTS_DB.filter(el => {
            if (el.z > 103) return false;
            if (prop && (el[prop] === null || el[prop] === undefined)) return false;
            return true;
        });
    }
}

function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

// Soal 1: Tebak Unsur langsung dari Peta Tabel SPU!
function buildSpuSpotQuestion() {
    const pool = getPoolForTrack();
    const target = pickRandom(pool);

    // Ambil 3 pengecoh (prioritaskan unsur di periode atau golongan berdekatan agar menantang)
    const nearby = pool.filter(e => e.z !== target.z && (e.row === target.row || e.col === target.col));
    const distractors = [];
    while (distractors.length < 3) {
        const cand = (nearby.length > 0 && Math.random() > 0.35) ? pickRandom(nearby) : pickRandom(pool);
        if (cand.z !== target.z && !distractors.some(d => d.z === cand.z)) {
            distractors.push(cand);
        }
    }

    // Bangun HTML Mini-SPU
    let miniGridHTML = '';
    if (activeTrack === 'school') {
        const colMap = { 1: 1, 2: 2, 13: 3, 14: 4, 15: 5, 16: 6, 17: 7, 18: 8 };
        miniGridHTML = `<div class="mini-spu-wrap"><div class="mini-spu" style="grid-template-columns: repeat(8, 28px); grid-template-rows: repeat(7, 26px);">`;
        ELEMENTS_DB.filter(e => e.groupA !== null && e.z <= 88).forEach(el => {
            const isTarget = el.z === target.z;
            miniGridHTML += `<div class="mini-cell ${isTarget ? 'target-cell' : ''}" style="grid-row:${el.row}; grid-column:${colMap[el.col]}">${isTarget ? '?' : ''}</div>`;
        });
        miniGridHTML += `</div></div>`;
    } else {
        miniGridHTML = `<div class="mini-spu-wrap"><div class="mini-spu" style="grid-template-columns: repeat(18, 22px); grid-template-rows: repeat(10, 22px);">`;
        ELEMENTS_DB.filter(e => e.z <= 103).forEach(el => {
            const isTarget = el.z === target.z;
            miniGridHTML += `<div class="mini-cell ${isTarget ? 'target-cell' : ''}" style="grid-row:${el.row}; grid-column:${el.col}">${isTarget ? '?' : ''}</div>`;
        });
        miniGridHTML += `</div></div>`;
    }

    const allOpts = shuffle([target, ...distractors]).map(e => `${e.name} (${e.sym})`);
    const correctText = `${target.name} (${target.sym})`;
    const posDesc = target.groupA
        ? `Golongan <strong>${target.groupA}</strong>, Periode <strong>${target.row}</strong>`
        : `Blok-${target.row >= 9 ? 'f' : 'd'}, Periode <strong>${target.row >= 9 ? target.row - 3 : target.row}</strong>`;

    return {
        typeLabel: "TEBAK UNSUR DI TABEL SPU",
        topicLabel: activeTrack === 'school' ? "POSISI GOLONGAN A" : "POSISI SPU 1–103",
        title: `Perhatikan kotak menyala bertanda <strong>(?)</strong> pada peta Tabel Periodik di bawah (${posDesc}). Unsur apakah itu?`,
        extraHTML: miniGridHTML,
        options: allOpts,
        answer: allOpts.indexOf(correctText),
        explanation: `Posisi tersebut ditempati oleh <strong>${target.name} (${target.sym}, Z = ${target.z})</strong> dengan konfigurasi <code>${target.config}</code>.<br>${target.desc}`
    };
}

function buildDuelQuestion(prop) {
    let pool = getPoolForTrack(prop);

    // Di Mode Sekolah, hindari pasangan anomali lintas-subkulit (Be/B, N/O, Mg/Al, P/S, Cl/F) agar sesuai aturan tren dasar sekolah
    let elA = pickRandom(pool);
    let elB = pickRandom(pool);
    let guard = 0;

    while (guard < 150) {
        const same = elA.z === elB.z || elA[prop] === elB[prop];
        let isSchoolTrap = false;
        if (activeTrack === 'school') {
            const pair = [elA.sym, elB.sym].sort().join('-');
            const traps = ['B-Be', 'N-O', 'Al-Mg', 'P-S', 'Cl-F', 'Cl-N', 'As-Se'];
            if (traps.includes(pair)) isSchoolTrap = true;
        }
        if (!same && !isSchoolTrap) break;
        elB = pickRandom(pool);
        guard++;
    }

    const meta = PROP_META[prop];
    const askHigher = Math.random() > 0.35;
    const correctEl = askHigher
        ? (elA[prop] > elB[prop] ? elA : elB)
        : (elA[prop] < elB[prop] ? elA : elB);

    const winner = elA[prop] > elB[prop] ? elA : elB;
    const loser = elA[prop] > elB[prop] ? elB : elA;
    const posA = elA.groupA ? `Gol. ${elA.groupA}, Per. ${elA.row}` : `Z = ${elA.z}`;
    const posB = elB.groupA ? `Gol. ${elB.groupA}, Per. ${elB.row}` : `Z = ${elB.z}`;

    return {
        typeLabel: "DUEL 2 UNSUR",
        topicLabel: meta.label.toUpperCase(),
        title: `Antara <strong>${elA.name} (${elA.sym})</strong> dan <strong>${elB.name} (${elB.sym})</strong>, manakah yang memiliki <strong>${meta.label}</strong> ${askHigher ? meta.adjHigh : meta.adjLow}?`,
        extraHTML: "",
        options: [
            `${elA.name} (${elA.sym} — ${posA})`,
            `${elB.name} (${elB.sym} — ${posB})`
        ],
        answer: correctEl.z === elA.z ? 0 : 1,
        explanation: `<strong>${winner.name} (${winner.sym})</strong> memiliki ${meta.label} ${meta.adjHigh}: <strong>${winner[prop]} ${meta.unit}</strong> dibandingkan <strong>${loser.name} (${loser.sym})</strong>: <strong>${loser[prop]} ${meta.unit}</strong>.`
    };
}

function buildRankingQuestion(prop) {
    const pool = getPoolForTrack(prop);
    const selected = [];
    let guard = 0;

    while (selected.length < 4 && guard < 250) {
        const cand = pickRandom(pool);
        const dup = selected.some(s => s.z === cand.z || s[prop] === cand[prop]);
        let hasSchoolTrap = false;
        if (activeTrack === 'school') {
            const traps = ['B-Be', 'N-O', 'Al-Mg', 'P-S', 'Cl-F', 'Cl-N', 'As-Se'];
            hasSchoolTrap = selected.some(s => traps.includes([s.sym, cand.sym].sort().join('-')));
        }
        if (!dup && !hasSchoolTrap) selected.push(cand);
        guard++;
    }

    const sorted = [...selected].sort((a, b) => a[prop] - b[prop]);
    const correctStr = sorted.map(e => e.sym).join(" < ");

    const wrongSet = new Set();
    wrongSet.add([...sorted].reverse().map(e => e.sym).join(" < "));
    while (wrongSet.size < 3) {
        const perm = shuffle(selected).map(e => e.sym).join(" < ");
        if (perm !== correctStr) wrongSet.add(perm);
    }

    const allOpts = shuffle([correctStr, ...Array.from(wrongSet)]);
    const meta = PROP_META[prop];
    const detailList = sorted.map(e => `${e.sym} (${e[prop]} ${meta.unit})`).join(" < ");

    return {
        typeLabel: "URUTKAN 4 UNSUR",
        topicLabel: meta.label.toUpperCase(),
        title: `Urutkan keempat unsur berikut berdasarkan <strong>${meta.label}</strong> dari <strong>${meta.asc}</strong>:<br><span style="color:#93c5fd">${selected.map(e => `${e.name} (${e.sym})`).join(", ")}</span>`,
        extraHTML: "",
        options: allOpts,
        answer: allOpts.indexOf(correctStr),
        explanation: `Urutan eksak dari ${meta.asc}:<br><strong>${detailList}</strong>.`
    };
}

function buildMysteryQuestion() {
    const pool = getPoolForTrack('en').filter(e => e.z <= 54);
    const target = pickRandom(pool);
    const distractors = [];
    while (distractors.length < 3) {
        const d = pickRandom(pool);
        if (d.z !== target.z && !distractors.some(x => x.z === d.z)) distractors.push(d);
    }

    const allOpts = shuffle([target, ...distractors]).map(e => `${e.name} (${e.sym}) — Z = ${e.z}`);
    const correctText = `${target.name} (${target.sym}) — Z = ${target.z}`;

    return {
        typeLabel: "TEBAK UNSUR MISTERIUS",
        topicLabel: "DEDUKSI KUANTITATIF",
        title: `Identifikasi unsur <strong>X</strong> berdasarkan data berikut:<br>
        • Periode <strong>${target.row}</strong> (${target.cat.toUpperCase()})<br>
        • Jari-jari atom: <strong>${target.radius} pm</strong> | Energi Ionisasi ke-1: <strong>${target.ie} kJ/mol</strong><br>
        • Afinitas Elektron: <strong>${target.ea} kJ/mol</strong> | Keelektronegatifan: <strong>${target.en}</strong>`,
        extraHTML: "",
        options: allOpts,
        answer: allOpts.indexOf(correctText),
        explanation: `Unsur X adalah <strong>${target.name} (${target.sym}, Z = ${target.z})</strong> dengan konfigurasi <code>${target.config}</code>.<br>${target.desc}`
    };
}

function generateQuestion() {
    answeredCurrent = false;
    document.getElementById('explanation-box').classList.add('hidden');
    document.getElementById('q-extra-data').innerHTML = '';

    const modeSelect = document.getElementById('quiz-mode').value;
    const topicSelect = document.getElementById('quiz-topic').value;
    const topics = ['radius', 'ie', 'ea', 'en'];
    const activeTopic = topicSelect === 'all' ? pickRandom(topics) : topicSelect;

    let chosenMode = modeSelect;
    if (modeSelect === 'mixed') {
        const poolModes = activeTrack === 'school'
            ? ['spu_spot', 'duel', 'ranking', 'ions', 'ie_jump']
            : ['spu_spot', 'duel', 'ranking', 'anomaly', 'ions', 'ie_jump', 'mystery'];
        chosenMode = pickRandom(poolModes);
    }

    let qObj = null;
    if (chosenMode === 'spu_spot') {
        qObj = buildSpuSpotQuestion();
    } else if (chosenMode === 'duel') {
        qObj = buildDuelQuestion(activeTopic);
    } else if (chosenMode === 'ranking') {
        qObj = buildRankingQuestion(activeTopic);
    } else if (chosenMode === 'anomaly') {
        const filtered = OLYMPIAD_ANOMALIES.filter(q => topicSelect === 'all' || q.topic === topicSelect);
        const raw = pickRandom(filtered.length ? filtered : OLYMPIAD_ANOMALIES);
        qObj = { typeLabel: "ANOMALI OSN KIMIA", topicLabel: PROP_META[raw.topic].label.toUpperCase(), extraHTML: "", ...raw };
    } else if (chosenMode === 'ions') {
        const bank = activeTrack === 'school' ? SCHOOL_ION_QUESTIONS : OLYMPIAD_ION_QUESTIONS;
        const filtered = bank.filter(q => topicSelect === 'all' || q.topic === topicSelect);
        const raw = pickRandom(filtered.length ? filtered : bank);
        qObj = { typeLabel: "JARI-JARI ION & ISOELEKTRONIK", topicLabel: PROP_META[raw.topic].label.toUpperCase(), extraHTML: "", ...raw };
    } else if (chosenMode === 'ie_jump') {
        const raw = pickRandom(IE_JUMP_QUESTIONS);
        qObj = { typeLabel: "LONJAKAN IE₁–IE₅", topicLabel: "ENERGI IONISASI BERTINGKAT", extraHTML: "", ...raw };
    } else {
        qObj = buildMysteryQuestion();
    }

    // Acak opsi untuk soal dari bank statis
    if (['anomaly', 'ions', 'ie_jump'].includes(chosenMode)) {
        const correctStr = qObj.options[qObj.answer];
        qObj.options = shuffle(qObj.options);
        qObj.answer = qObj.options.indexOf(correctStr);
    }

    currentQuestion = qObj;

    document.getElementById('q-track-badge').innerText = activeTrack === 'school'
        ? "🏫 MODE SEKOLAH (GOL. A)"
        : "🏆 MODE OLIMPIADE (1–118)";
    document.getElementById('q-type-badge').innerText = qObj.typeLabel;
    document.getElementById('q-topic-badge').innerText = qObj.topicLabel;
    document.getElementById('q-title').innerHTML = qObj.title;

    if (qObj.table) {
        const ths = qObj.table.headers.map(h => `<th>${h}</th>`).join('');
        const tds = qObj.table.values.map(v => `<td><strong>${v}</strong></td>`).join('');
        document.getElementById('q-extra-data').innerHTML = `
            <table class="ie-table">
                <thead><tr>${ths}</tr></thead>
                <tbody><tr>${tds}</tr></tbody>
            </table>
        `;
    } else if (qObj.extraHTML) {
        document.getElementById('q-extra-data').innerHTML = qObj.extraHTML;
    }

    const optGrid = document.getElementById('options-grid');
    optGrid.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];
    qObj.options.forEach((optText, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `<span class="opt-key">${letters[idx]}</span><span>${optText}</span>`;
        btn.onclick = () => submitAnswer(idx);
        optGrid.appendChild(btn);
    });
}

function submitAnswer(selectedIdx) {
    if (answeredCurrent || !currentQuestion) return;
    answeredCurrent = true;

    const st = statsByTrack[activeTrack];
    st.total++;

    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(b => b.disabled = true);

    const isCorrect = selectedIdx === currentQuestion.answer;
    const expBox = document.getElementById('explanation-box');
    const expStatus = document.getElementById('exp-status');

    if (isCorrect) {
        buttons[selectedIdx].classList.add('correct');
        st.score += 100 + (st.streak * 15);
        st.streak++;
        st.correct++;
        expBox.className = 'explanation-box';
        expStatus.innerText = "✓ Benar! (+100 Poin + Bonus Streak)";
    } else {
        buttons[selectedIdx].classList.add('wrong');
        buttons[currentQuestion.answer].classList.add('correct');
        st.streak = 0;
        expBox.className = 'explanation-box wrong-exp';
        expStatus.innerText = "✗ Kurang Tepat — Simak Pembahasan:";
    }

    document.getElementById('exp-text').innerHTML = currentQuestion.explanation;
    updateScoreboardUI();
}

function updateScoreboardUI() {
    const st = statsByTrack[activeTrack];
    document.getElementById('score-mode-label').innerText = activeTrack === 'school' ? "Skor Sekolah" : "Skor OSN";
    document.getElementById('score-val').innerText = st.score;
    document.getElementById('streak-val').innerText = `${st.streak} 🔥`;
    document.getElementById('total-val').innerText = st.total;
    document.getElementById('acc-val').innerText = st.total > 0 ? `${Math.round((st.correct / st.total) * 100)}%` : "0%";
}

document.addEventListener('keydown', (e) => {
    const quizActive = document.getElementById('quiz-view').classList.contains('active');
    if (!quizActive) return;
    if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key) - 1;
        const btns = document.querySelectorAll('.option-btn');
        if (btns[idx] && !answeredCurrent) submitAnswer(idx);
    } else if (e.key === 'Enter' && answeredCurrent) {
        generateQuestion();
    }
});

// Inisialisasi awal pada Mode Sekolah (Golongan A)
setTrackMode('school');