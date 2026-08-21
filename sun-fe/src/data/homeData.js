export const features = [
  {
    id: 'vocab',
    icon: '📖',
    title: 'Từ vựng HSK',
    description:
      'Học từ theo cấp độ, chủ đề và trạng thái ghi nhớ; ưu tiên ôn lại những từ bạn dễ quên.',
  },
  {
    id: 'listening',
    icon: '🎧',
    title: 'Luyện Listening',
    description:
      'Bài nghe theo cấp độ với transcript, đáp án và chế độ luyện từng câu.',
  },
  {
    id: 'test',
    icon: '📝',
    title: 'HSK Online Test',
    description:
      'Mô phỏng bài thi, chấm điểm và tổng hợp kết quả để bạn biết phần nào cần cải thiện.',
  },
  {
    id: 'grammar',
    icon: '✍️',
    title: 'Ngữ pháp & Writing',
    description:
      'Ôn cấu trúc câu, mẫu câu và bài tập ứng dụng theo từng cấp độ HSK.',
  },
]

export const levels = [
  { level: 'HSK 1', label: 'Cơ bản',    description: 'Làm quen tiếng Trung' },
  { level: 'HSK 2', label: 'Sơ cấp',    description: 'Giao tiếp hằng ngày' },
  { level: 'HSK 3', label: 'Trung cấp', description: 'Mở rộng chủ đề' },
  { level: 'HSK 4', label: 'Khá',        description: 'Đọc hiểu & giao tiếp' },
  { level: 'HSK 5', label: 'Nâng cao',  description: 'Văn bản & học thuật' },
  { level: 'HSK 6', label: 'Thành thạo',description: 'Tiếng Trung nâng cao' },
]

export const studyCards = [
  {
    id: 'exam',
    variant: 'blue',
    title: '🎯 Luyện thi HSK',
    description: 'Đi thẳng vào phần bạn cần để chuẩn bị cho kỳ thi.',
    items: [
      'Test theo từng cấp độ HSK',
      'Phân tích điểm mạnh / điểm yếu',
      'Gợi ý nội dung nên ôn tiếp',
    ],
  },
  {
    id: 'daily',
    variant: 'white',
    title: '📚 Tự học mỗi ngày',
    description: 'Xây thói quen học đều với các phiên học ngắn.',
    items: [
      '20 từ vựng mới mỗi ngày',
      'Flashcard + ôn tập lặp lại',
      'Chuỗi ngày học và thống kê tiến độ',
    ],
  },
]

export const navLinks = [
  { href: '/hsk-tests', label: 'HSK Online Test' },
  { href: '#levels',   label: 'HSK 1–6' },
  { href: '#study',    label: 'Luyện tập' },
  { href: '#vocab',    label: 'Từ vựng' },
]

export const heroScores = [
  { value: '82%', label: 'Từ vựng' },
  { value: '76%', label: 'Nghe' },
  { value: '88%', label: 'Đọc' },
  { value: '71%', label: 'Ngữ pháp' },
]
