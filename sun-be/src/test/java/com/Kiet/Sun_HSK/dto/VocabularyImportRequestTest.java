package com.Kiet.Sun_HSK.dto;

import com.Kiet.Sun_HSK.dto.request.VocabularyImportRequest;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class VocabularyImportRequestTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testDeserializeWrappedFormat() throws Exception {
        String json = """
            [
              {
                "position": 0,
                "words": {
                  "en": "hello",
                  "hv": "nhĩ hảo",
                  "id": 147,
                  "pos": "Thán",
                  "hanzi": "你好",
                  "level": 1,
                  "pinyin": "nǐ hǎo",
                  "example": "你好，很高兴认识你。(Xin chào, rất vui được gặp bạn.)",
                  "examples": [
                    {
                      "vi": "Xin chào!",
                      "zh": "你好！",
                      "audio_path": "examples/147_0.mp3"
                    }
                  ],
                  "audio_path": "words/147.mp3",
                  "meaning_vi": "xin chào, chào bạn",
                  "sort_order": 146,
                  "shuffle_rank": 0.334867072307003,
                  "in_review_list": true
                }
              }
            ]
            """;

        List<VocabularyImportRequest> list = objectMapper.readValue(json, new TypeReference<>() {});
        assertEquals(1, list.size());
        VocabularyImportRequest item = list.get(0);

        assertEquals(147L, item.getId());
        assertEquals("你好", item.getHanzi());
        assertEquals(1, item.getLevel());
        assertEquals("nǐ hǎo", item.getPinyin());
        assertEquals("nhĩ hảo", item.getHv());
        assertEquals("Thán", item.getPos());
        assertEquals("xin chào, chào bạn", item.getMeaningVi());
        assertEquals("hello", item.getEn());
        assertEquals(146, item.getSortOrder());
        assertEquals(0, item.getPosition());
        assertTrue(item.getInReviewList());
        assertEquals("words/147.mp3", item.getAudioPath());
        assertNotNull(item.getExamples());
        assertEquals(1, item.getExamples().size());
        assertEquals("你好！", item.getExamples().get(0).getZh());
    }

    @Test
    void testDeserializeFlatFormat() throws Exception {
        String json = """
            [
              {
                "id": 147,
                "level": 1,
                "hanzi": "你好",
                "pinyin": "nǐ hǎo",
                "meaning_vi": "xin chào",
                "position": 5,
                "lesson_number": 2
              }
            ]
            """;

        List<VocabularyImportRequest> list = objectMapper.readValue(json, new TypeReference<>() {});
        assertEquals(1, list.size());
        VocabularyImportRequest item = list.get(0);

        assertEquals(147L, item.getId());
        assertEquals("你好", item.getHanzi());
        assertEquals(1, item.getLevel());
        assertEquals("nǐ hǎo", item.getPinyin());
        assertEquals(5, item.getPosition());
        assertEquals(2, item.getLessonNumber());
    }

    @Test
    void testDeserializeActualLesson001JsonFile() throws Exception {
        java.io.File file = new java.io.File("../lesson_001.json");
        if (file.exists()) {
            List<VocabularyImportRequest> list = objectMapper.readValue(file, new TypeReference<>() {});
            assertFalse(list.isEmpty());
            for (int i = 0; i < list.size(); i++) {
                VocabularyImportRequest item = list.get(i);
                assertNotNull(item.getId(), "Item " + i + " must have id");
                assertNotNull(item.getHanzi(), "Item " + i + " must have hanzi");
            }
        }
    }
}
