export const hskLevels = [
  {
    id: 1,
    label: 'HSK 1',
    sublabel: 'Cơ bản',
    vocab: 150,
    description: 'Làm quen với tiếng Trung — giao tiếp đơn giản hằng ngày.',
    color: '#22c55e',
    colorLight: '#f0fdf4',
    colorBorder: '#bbf7d0',
    examCount: 12,
    sections: ['Nghe hiểu', 'Đọc hiểu'],
    totalQuestions: 40,
    duration: 40,
  },
  {
    id: 2,
    label: 'HSK 2',
    sublabel: 'Sơ cấp',
    vocab: 300,
    description: 'Giao tiếp trong các tình huống quen thuộc hằng ngày.',
    color: '#3b82f6',
    colorLight: '#eff6ff',
    colorBorder: '#bfdbfe',
    examCount: 10,
    sections: ['Nghe hiểu', 'Đọc hiểu'],
    totalQuestions: 60,
    duration: 55,
  },
  {
    id: 3,
    label: 'HSK 3',
    sublabel: 'Trung cấp',
    vocab: 600,
    description: 'Đọc, viết và giao tiếp trong nhiều chủ đề đa dạng.',
    color: '#f59e0b',
    colorLight: '#fffbeb',
    colorBorder: '#fde68a',
    examCount: 14,
    sections: ['Nghe hiểu', 'Đọc hiểu', 'Viết'],
    totalQuestions: 80,
    duration: 90,
  },
  {
    id: 4,
    label: 'HSK 4',
    sublabel: 'Khá',
    vocab: 1200,
    description: 'Thảo luận chủ đề rộng, hiểu báo chí và nội dung học thuật.',
    color: '#8b5cf6',
    colorLight: '#f5f3ff',
    colorBorder: '#ddd6fe',
    examCount: 16,
    sections: ['Nghe hiểu', 'Đọc hiểu', 'Viết'],
    totalQuestions: 100,
    duration: 105,
  },
  {
    id: 5,
    label: 'HSK 5',
    sublabel: 'Nâng cao',
    vocab: 2500,
    description: 'Đọc báo, xem phim không phụ đề, giao tiếp trôi chảy.',
    color: '#ec4899',
    colorLight: '#fdf2f8',
    colorBorder: '#fbcfe8',
    examCount: 10,
    sections: ['Nghe hiểu', 'Đọc hiểu', 'Viết'],
    totalQuestions: 100,
    duration: 125,
  },
  {
    id: 6,
    label: 'HSK 6',
    sublabel: 'Thành thạo',
    vocab: 5000,
    description: 'Tiếng Trung bản ngữ — nghe hiểu và diễn đạt chuẩn xác.',
    color: '#ef4444',
    colorLight: '#fef2f2',
    colorBorder: '#fecaca',
    examCount: 8,
    sections: ['Nghe hiểu', 'Đọc hiểu', 'Viết'],
    totalQuestions: 101,
    duration: 140,
  },
]

// Tạo đề thi mẫu cho từng cấp độ
function generateExams(levelId, count) {
  const difficulties = ['Dễ', 'Trung bình', 'Khó']
  const types = ['Đề chính thức', 'Đề luyện tập', 'Đề thi thử', 'Đề theo chủ đề']
  const tags = [
    ['Chính thức', 'Phổ biến'],
    ['Luyện tập'],
    ['Thi thử', 'Mới nhất'],
    ['Theo chủ đề'],
  ]
  return Array.from({ length: count }, (_, i) => ({
    id: `${levelId}-${i + 1}`,
    levelId,
    title: `HSK ${levelId} — Đề thi số ${i + 1}`,
    type: types[i % types.length],
    difficulty: difficulties[i % 3],
    attempts: Math.floor(Math.random() * 3000) + 200,
    rating: (4.2 + Math.random() * 0.7).toFixed(1),
    tags: tags[i % tags.length],
    year: 2022 + (i % 3),
  }))
}

export const examsByLevel = Object.fromEntries(
  hskLevels.map((l) => [l.id, generateExams(l.id, l.examCount)])
)

export const difficultyOptions = ['Tất cả', 'Dễ', 'Trung bình', 'Khó']
export const typeOptions = ['Tất cả', 'Đề chính thức', 'Đề luyện tập', 'Đề thi thử', 'Đề theo chủ đề']
