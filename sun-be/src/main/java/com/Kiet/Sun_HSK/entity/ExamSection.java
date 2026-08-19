package com.Kiet.Sun_HSK.entity;

import com.Kiet.Sun_HSK.enums.SectionType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.UUID;

@Entity
@Table(name = "exam_sections")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ExamSection {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    Exam exam;

    @Enumerated(EnumType.STRING)
    @Column(name = "section_type", nullable = false, length = 30)
    SectionType sectionType;

    @Column(length = 255)
    String title;

    @Column(columnDefinition = "TEXT")
    String instructions;

    /** Giới hạn thời gian riêng của phần (phút), null = dùng chung với đề */
    @Column(name = "time_limit")
    Integer timeLimit;

    @Builder.Default
    @Column(name = "sort_order", nullable = false)
    int sortOrder = 0;
}
