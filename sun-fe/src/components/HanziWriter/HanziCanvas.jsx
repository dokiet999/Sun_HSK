import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';
import styles from './HanziWriter.module.css';

/**
 * HanziCanvas component
 * Wraps HanziWriter with custom SVG grid overlays (米字格 / 田字格 / Ô trơn)
 */
const HanziCanvas = forwardRef(function HanziCanvas(
  {
    character = '中',
    mode = 'animate', // 'animate' | 'quiz'
    gridType = 'mige', // 'mige' | 'tiange' | 'none'
    showOutline = true,
    speed = 1.0,
    size = 260,
    onComplete,
    onCorrectStroke,
    onMistake,
    onStrokesLoaded,
  },
  ref
) {
  const containerRef = useRef(null);
  const writerRef = useRef(null);
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Expose control methods to parent via ref
  useImperativeHandle(ref, () => ({
    replay() {
      if (!writerRef.current) return;
      writerRef.current.cancelQuiz();
      writerRef.current.showOutline();
      writerRef.current.animateCharacter({
        onComplete: () => {
          if (onComplete) onComplete({ mode: 'animate', character });
        },
      });
    },
    loop() {
      if (!writerRef.current) return;
      writerRef.current.cancelQuiz();
      writerRef.current.loopCharacterAnimation();
    },
    startQuiz() {
      if (!writerRef.current) return;
      runQuiz();
    },
    reset() {
      if (mode === 'quiz') {
        runQuiz();
      } else {
        if (!writerRef.current) return;
        writerRef.current.cancelQuiz();
        writerRef.current.animateCharacter();
      }
    },
  }));

  // Function to start quiz mode
  const runQuiz = () => {
    const writer = writerRef.current;
    if (!writer) return;

    writer.cancelQuiz();
    if (showOutline) {
      writer.showOutline();
    } else {
      writer.hideOutline();
    }

    writer.quiz({
      showHintAfterMisses: 3,
      onCorrectStroke: (strokeData) => {
        if (onCorrectStroke) {
          onCorrectStroke({
            ...strokeData,
            character,
          });
        }
      },
      onMistake: (strokeData) => {
        if (onMistake) {
          onMistake({
            ...strokeData,
            character,
          });
        }
      },
      onComplete: (summary) => {
        if (onComplete) {
          onComplete({
            mode: 'quiz',
            character,
            summary,
          });
        }
      },
    });
  };

  // Initialize or re-create HanziWriter instance
  useEffect(() => {
    if (!containerRef.current || !character) return;

    setIsLoading(true);
    setLoadError(false);

    // Clean previous SVG
    containerRef.current.innerHTML = '';

    try {
      const writer = HanziWriter.create(containerRef.current, character, {
        width: size,
        height: size,
        padding: Math.round(size * 0.08),
        showOutline: showOutline,
        strokeAnimationSpeed: speed,
        delayBetweenStrokes: 160,
        strokeColor: '#1e293b',
        radicalColor: '#16a34a',
        outlineColor: '#e2e8f0',
        drawingColor: '#2563eb',
        drawingWidth: 14,
        showHintAfterMisses: 3,
        highlightColor: '#f59e0b',
        onLoadCharDataSuccess: (data) => {
          setIsLoading(false);
          if (data && data.strokes && onStrokesLoaded) {
            onStrokesLoaded(data.strokes.length);
          }
        },
        onLoadCharDataError: () => {
          setIsLoading(false);
          setLoadError(true);
        },
      });

      writerRef.current = writer;

      // Start initial mode
      if (mode === 'animate') {
        writer.animateCharacter({
          onComplete: () => {
            if (onComplete) onComplete({ mode: 'animate', character });
          },
        });
      } else {
        runQuiz();
      }
    } catch (err) {
      console.error('Lỗi khởi tạo HanziWriter:', err);
      setIsLoading(false);
      setLoadError(true);
    }

    return () => {
      if (writerRef.current) {
        writerRef.current.cancelQuiz();
        writerRef.current = null;
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [character, size]);

  // Handle mode changes without re-creating if instance exists
  useEffect(() => {
    const writer = writerRef.current;
    if (!writer || isLoading || loadError) return;

    if (mode === 'animate') {
      writer.cancelQuiz();
      writer.showCharacter();
      if (showOutline) writer.showOutline();
      writer.animateCharacter({
        onComplete: () => {
          if (onComplete) onComplete({ mode: 'animate', character });
        },
      });
    } else if (mode === 'quiz') {
      runQuiz();
    }
  }, [mode]);

  // Handle outline toggle
  useEffect(() => {
    const writer = writerRef.current;
    if (!writer) return;

    if (showOutline) {
      writer.showOutline();
    } else {
      writer.hideOutline();
    }
  }, [showOutline]);

  // Render SVG Grid Lines
  const half = size / 2;

  return (
    <div
      className={styles.canvasWrapper}
      style={{ width: size, height: size }}
      aria-label={`Khung luyện viết chữ ${character}`}
    >
      {/* SVG Grid Overlay */}
      <svg
        className={styles.gridSvg}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Outer square border */}
        <rect
          x="1"
          y="1"
          width={size - 2}
          height={size - 2}
          fill="none"
          className={styles.gridOuterBorder}
        />

        {/* Rice Grid (米字格) diagonals */}
        {gridType === 'mige' && (
          <>
            <line
              x1="0"
              y1="0"
              x2={size}
              y2={size}
              className={styles.gridDiagonal}
            />
            <line
              x1={size}
              y1="0"
              x2="0"
              y2={size}
              className={styles.gridDiagonal}
            />
          </>
        )}

        {/* Center cross for 米字格 and 田字格 */}
        {(gridType === 'mige' || gridType === 'tiange') && (
          <>
            <line
              x1={half}
              y1="0"
              x2={half}
              y2={size}
              className={styles.gridCenterLine}
            />
            <line
              x1="0"
              y1={half}
              x2={size}
              y2={half}
              className={styles.gridCenterLine}
            />
          </>
        )}
      </svg>

      {/* Target DOM Element for HanziWriter */}
      <div
        ref={containerRef}
        className={styles.writerContainer}
        style={{ width: size, height: size }}
      />

      {/* Loading state */}
      {isLoading && (
        <div className={styles.canvasOverlay}>
          <div className={styles.canvasSpinner} />
          <span>Đang tải nét viết...</span>
        </div>
      )}

      {/* Error state */}
      {loadError && (
        <div className={styles.canvasOverlay}>
          <span className={styles.errorIcon}>⚠️</span>
          <span>Không tìm thấy dữ liệu nét cho "{character}"</span>
        </div>
      )}
    </div>
  );
});

export default HanziCanvas;
