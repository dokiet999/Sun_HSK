# ☀️ Sun-HSK — Chinese Learning & HSK Exam Preparation Platform

<div align="center">

[![Java Version](https://img.shields.io/badge/Java-21-orange.svg?style=for-the-badge&logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x%20%2F%204.x-brightgreen.svg?style=for-the-badge&logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791.svg?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Flyway](https://img.shields.io/badge/Flyway-Database%20Migration-CC0200.svg?style=for-the-badge&logo=flyway)](https://flywaydb.org/)
[![JWT](https://img.shields.io/badge/Security-JWT%20%2B%20OAuth2-black.svg?style=for-the-badge&logo=jsonwebtokens)](https://jwt.io/)

<p align="center">
  <b>Sun-HSK</b> is an all-in-one Chinese (Mandarin) learning and mock examination platform designed for learners preparing for standardized HSK tests across both <b>HSK 2.0 (HSK 1–6)</b> and <b>HSK 3.0 (HSK 1–9)</b> standards.
</p>

[Overview](#-overview) • [Key Features](#-key-features) • [Tech Stack](#-tech-stack)

</div>

---

## 📖 Overview

**Sun-HSK** delivers a modern, robust, and interactive environment for mastering the Chinese language. From vocabulary memorization and stroke order practice to full-length simulated HSK exams with real-time timers and instant grading, the platform provides everything necessary for high-efficiency test preparation.

### 🌟 Core Learning Pillars

| Pillar | Features & Description |
| :--- | :--- |
| 🈸 **Vocabulary & Hanzi** | Hanzi stroke order animations, Pinyin, Sino-Vietnamese roots, audio pronunciation, and contextual examples. |
| 📝 **Mock Exams & Quizzes** | Full-length timed mock tests matching official HSK standards with automatic grading and section breakdowns. |
| 🧠 **Spaced Repetition (SRS)** | Flashcards powered by SM-2 / FSRS algorithms to optimize long-term vocabulary retention. |
| 🎧 **Listening & Dialogues** | Native audio playback, dialogue exercises, dictation, and speech comprehension drills. |
| 📊 **Analytics & Tracking** | In-depth historical exam results, score distributions (Listening, Reading, Writing), and progress statistics. |

---

## ✨ Key Features

### 1. 🔐 Authentication & User Security
- **Dual Authentication**: Standard Email/Password login + **Google OAuth2** Single Sign-On (SSO).
- **JWT Architecture**: Short-lived Access Tokens (15 min) + Refresh Tokens stored in secure `HttpOnly`, `SameSite` cookies with automatic token rotation.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions for `ROLE_USER` and `ROLE_ADMIN`.
- **Profile Management**: User profile customization, avatar management, and test attempt history.

### 2. 🎯 Comprehensive Exam & Testing Engine
- **Multi-Standard Support**: Full coverage for **HSK 2.0** (Levels 1–6) and **HSK 3.0** (Levels 1–9).
- **Rich Question Types**:
  - `MULTIPLE_CHOICE`: Single/Multiple-choice standard questions.
  - `FILL_IN_BLANK`: Cloze / blank filling tests.
  - `TRUE_FALSE`: Reading / Listening comprehension verification.
  - `MATCHING`: Pair matching for words, sentences, and definitions.
  - `PICTURE_SELECTION`: Audio-to-image and character-to-image matching.
  - `DIALOGUE_LISTENING`: Multi-turn conversational listening exercises.
  - `SENTENCE_ORDERING`: Word/clause rearrangement into grammatically correct sentences.
  - `WRITING`: Free-form text and subjective writing sections.
- **Real-Time Attempt Tracker**: Auto-saving answers per question to prevent data loss.
- **Automated Grading Engine**: Immediate score calculation upon submission with detailed answer keys and explanations.

### 3. 🛠️ Admin Management Suite
- Complete CRUD interface for Exams, Sections, Questions, and Answer Options.
- Lifecycle management: `DRAFT` ➡️ `PUBLISHED` ➡️ `ARCHIVED`.
- Configurable time limits, passing scores, section weights, and multimedia assets (Audio/Images).

---

## 🛠 Tech Stack

### Backend (`sun-be`)
- **Language**: Java 21 (LTS)
- **Framework**: Spring Boot (Spring Web MVC, Spring Security, Spring Data JPA, Spring Validation, Spring Boot Actuator)
- **Database**: PostgreSQL
- **Database Migrations**: Flyway
- **Security & Tokens**: Spring Security, JJWT (io.jsonwebtoken 0.12.x), OAuth2 Client (Google)
- **Object Mapping & Boilerplate**: MapStruct 1.5.x, Project Lombok
- **Build Tool**: Apache Maven (Wrapper included)

### Frontend (`sun-fe`)
- **Framework**: React 18+
- **Routing**: React Router
- **HTTP Client**: Axios with interceptors for JWT refreshing
- **UI & Typography**: Ant Design / Modern CSS with CJK & Vietnamese font support
- **Interactive Tools**: Hanzi Writer (stroke animations), Web Audio API / Howler.js
