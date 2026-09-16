/**
 * Audio Player utility cho việc phát âm từ vựng & câu ví dụ tiếng Trung.
 * Hỗ trợ phát từ file URL hoặc Web Speech API (zh-CN) làm fallback tức thì.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

let currentAudio = null;

export function playChineseAudio(text, audioPath, onEnd) {
  // Dừng âm thanh đang phát trước đó nếu có
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  // 1. Thử phát từ audio file nếu có đường dẫn hợp lệ
  if (audioPath) {
    const fullUrl = audioPath.startsWith('http')
      ? audioPath
      : `${BASE_URL}/audio/${audioPath.replace(/^\/+/, '')}`;

    const audio = new Audio(fullUrl);
    currentAudio = audio;

    audio.onended = () => {
      currentAudio = null;
      if (onEnd) onEnd();
    };

    audio.onerror = () => {
      // Nếu file âm thanh chưa có trên server, tự động fallback sang Web Speech API
      speakText(text, onEnd);
    };

    audio.play().catch(() => {
      speakText(text, onEnd);
    });
    return;
  }

  // 2. Không có audioPath, phát bằng Web Speech API
  speakText(text, onEnd);
}

function speakText(text, onEnd) {
  if (!('speechSynthesis' in window) || !text) {
    if (onEnd) onEnd();
    return;
  }

  try {
    const cleanText = text.replace(/[\(\)（）\[\]]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.85; // Tốc độ chuẩn cho người học HSK
    utterance.pitch = 1.0;

    // Tìm giọng tiếng Trung tự nhiên nếu browser có sẵn
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang === 'zh-CN' || v.lang.startsWith('zh'));
    if (zhVoice) {
      utterance.voice = zhVoice;
    }

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech synthesis error:', e);
    if (onEnd) onEnd();
  }
}
