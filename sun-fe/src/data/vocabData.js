/**
 * Cấu hình 7 cấp độ HSK cho mô-đun Từ vựng Sun-HSK
 * HSK 1, 2, 3, 4, 5, 6 và 7-9
 */

export const HSK_VOCAB_LEVELS = [
  {
    id: 1,
    slug: '1',
    label: 'HSK 1',
    sublabel: 'Cơ bản',
    wordsCount: '150 - 300 từ',
    estimatedLessons: 15,
    color: '#22c55e',
    colorLight: '#f0fdf4',
    colorBorder: '#bbf7d0',
    colorBadge: '#15803d',
    description: 'Làm quen chữ Hán, phát âm, xưng hô và các câu chào hỏi giao tiếp căn bản nhất.',
    tags: ['Chào hỏi', 'Gia đình', 'Số đếm', 'Thời gian'],
    icon: '🌱'
  },
  {
    id: 2,
    slug: '2',
    label: 'HSK 2',
    sublabel: 'Sơ cấp',
    wordsCount: '300 - 500 từ',
    estimatedLessons: 20,
    color: '#0ea5e9',
    colorLight: '#f0f9ff',
    colorBorder: '#bae6fd',
    colorBadge: '#0369a1',
    description: 'Giao tiếp trong các tình huống quen thuộc hằng ngày, mua sắm, chỉ đường và ăn uống.',
    tags: ['Mua sắm', 'Phương hướng', 'Công việc', 'Sở thích'],
    icon: '🌿'
  },
  {
    id: 3,
    slug: '3',
    label: 'HSK 3',
    sublabel: 'Trung cấp',
    wordsCount: '600 - 1000 từ',
    estimatedLessons: 25,
    color: '#f59e0b',
    colorLight: '#fffbeb',
    colorBorder: '#fde68a',
    colorBadge: '#b45309',
    description: 'Tự tin biểu đạt ý kiến, du lịch, giải quyết vấn đề học tập và công việc cơ bản.',
    tags: ['Du lịch', 'Môi trường', 'Sức khỏe', 'Cảm xúc'],
    icon: '🌾'
  },
  {
    id: 4,
    slug: '4',
    label: 'HSK 4',
    sublabel: 'Khá',
    wordsCount: '1200 - 2000 từ',
    estimatedLessons: 30,
    color: '#8b5cf6',
    colorLight: '#f5f3ff',
    colorBorder: '#ddd6fe',
    colorBadge: '#6d28d9',
    description: 'Thảo luận nhiều chủ đề rộng, đọc hiểu báo chí cơ bản và diễn đạt mạch lạc.',
    tags: ['Xã hội', 'Kinh tế', 'Văn hóa', 'Giao lưu'],
    icon: '🌸'
  },
  {
    id: 5,
    slug: '5',
    label: 'HSK 5',
    sublabel: 'Nâng cao',
    wordsCount: '2500 - 4000 từ',
    estimatedLessons: 36,
    color: '#ec4899',
    colorLight: '#fdf2f8',
    colorBorder: '#fbcfe8',
    colorBadge: '#be185d',
    description: 'Xem phim không cần phụ đề, đọc hiểu văn bản tin tức, diễn thuyết và làm việc trôi chảy.',
    tags: ['Tin tức', 'Khoa học', 'Triết lý', 'Học thuật'],
    icon: '🌺'
  },
  {
    id: 6,
    slug: '6',
    label: 'HSK 6',
    sublabel: 'Thành thạo',
    wordsCount: '5000+ từ',
    estimatedLessons: 40,
    color: '#ef4444',
    colorLight: '#fef2f2',
    colorBorder: '#fecaca',
    colorBadge: '#b91c1c',
    description: 'Nghe hiểu và diễn đạt chuẩn xác như người bản ngữ, làm việc học thuật và viết luận.',
    tags: ['Văn học', 'Chính trị', 'Thành ngữ', 'Chuyên sâu'],
    icon: '🔥'
  },
  {
    id: 7,
    slug: '7-9',
    label: 'HSK 7–9',
    sublabel: 'Cao cấp',
    wordsCount: '11000+ từ',
    estimatedLessons: 50,
    color: '#0f766e',
    colorLight: '#f0fdfa',
    colorBorder: '#99f6e4',
    colorBadge: '#115e59',
    description: 'Nghiên cứu học thuật, dịch thuật chuyên nghiệp, văn phong cổ điển, hàn lâm và ngoại giao.',
    tags: ['Hàn lâm', 'Nghiên cứu', 'Dịch thuật', 'Cổ văn'],
    icon: '👑'
  }
];

export function getLevelConfig(levelInput) {
  if (!levelInput) return HSK_VOCAB_LEVELS[0];
  const str = String(levelInput).trim();
  const found = HSK_VOCAB_LEVELS.find(l => l.slug === str || String(l.id) === str);
  return found || HSK_VOCAB_LEVELS[0];
}

export const VOCAB_STATUS_MAP = {
  NEW: { label: 'Mới', color: '#64748b', bg: '#f1f5f9' },
  LEARNING: { label: 'Đang học', color: '#f59e0b', bg: '#fffbeb' },
  REVIEWING: { label: 'Cần ôn', color: '#ec4899', bg: '#fdf2f8' },
  MASTERED: { label: 'Đã thuộc', color: '#10b981', bg: '#ecfdf5' }
};

/**
 * Chuẩn hóa và hiển thị đầy đủ Từ loại (Part of Speech) sang tiếng Việt
 * Ví dụ: "Thán" -> "Thán từ", "n." -> "Danh từ", "adj." -> "Tính từ", "Đại" -> "Đại từ"...
 */
export function formatPos(pos) {
  if (!pos) return '';
  const trimmed = String(pos).trim();
  const clean = trimmed.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');

  const map = {
    // Tiếng Anh viết tắt
    n: 'Danh từ',
    noun: 'Danh từ',
    v: 'Động từ',
    verb: 'Động từ',
    vi: 'Nội động từ',
    vt: 'Ngoại động từ',
    adj: 'Tính từ',
    a: 'Tính từ',
    adv: 'Phó từ',
    pron: 'Đại từ',
    num: 'Số từ',
    m: 'Lượng từ',
    cl: 'Lượng từ',
    prep: 'Giới từ',
    conj: 'Liên từ',
    part: 'Trợ từ',
    interj: 'Thán từ',
    suf: 'Hậu tố',
    suffix: 'Hậu tố',
    pref: 'Tiền tố',
    prefix: 'Tiền tố',
    modal: 'Trợ động từ',
    idiom: 'Thành ngữ',
    // Tiếng Việt viết tắt
    thán: 'Thán từ',
    'thán từ': 'Thán từ',
    danh: 'Danh từ',
    'danh từ': 'Danh từ',
    động: 'Động từ',
    'động từ': 'Động từ',
    tính: 'Tính từ',
    'tính từ': 'Tính từ',
    đại: 'Đại từ',
    'đại từ': 'Đại từ',
    phó: 'Phó từ',
    'phó từ': 'Phó từ',
    lượng: 'Lượng từ',
    'lượng từ': 'Lượng từ',
    giới: 'Giới từ',
    'giới từ': 'Giới từ',
    liên: 'Liên từ',
    'liên từ': 'Liên từ',
    trợ: 'Trợ từ',
    'trợ từ': 'Trợ từ',
    số: 'Số từ',
    'số từ': 'Số từ',
    'hậu tố': 'Hậu tố',
    'tiền tố': 'Tiền tố',
    'thành ngữ': 'Thành ngữ'
  };

  if (map[clean]) return map[clean];
  if (map[trimmed.toLowerCase()]) return map[trimmed.toLowerCase()];

  if (trimmed.toLowerCase().endsWith('từ') || trimmed.toLowerCase().includes('hậu tố') || trimmed.toLowerCase().includes('tiền tố')) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }
  return trimmed;
}

