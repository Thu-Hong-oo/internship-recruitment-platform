/**
 * CV RAG Suggestion Service (lightweight, retrieval + generation fallback)
 * - Retrieve "golden" CVs (Applications.status = hired) by jobCategory
 * - Compare skills to find common/missing points
 * - Produce evidence-based suggestions; fallback to LLM if not enough data
 *
 * Note: This is a lightweight implementation (Jaccard on skills). It can be
 * upgraded to vector search (MongoDB Atlas Vector / Chroma) later.
 */

const Application = require('../../models/Application');
const CandidateProfile = require('../../models/CandidateProfile');
const { logger } = require('../../utils/logger');

class CVRAGSuggestionService {
  constructor(aiService) {
    this.aiService = aiService;
  }

  /**
   * Get CV improvement suggestions using retrieval + generation fallback.
   * @param {Object} userCV Parsed CV object { skills, experience, education, ... }
   * @param {String} jobCategory Category/industry code (optional)
   * @param {Object} options { topK, minRetrieved }
   */
  async getSuggestions(userCV, jobCategory = null, options = {}) {
    const { topK = 7, minRetrieved = 3 } = options;
    const userSkills = this._extractSkills(userCV);

    // 1) Retrieve "golden" CVs (hired)
    const pipeline = [
      { $match: { status: 'hired' } },
    ];
    if (jobCategory) {
      pipeline.push({ $match: { jobCategory } });
    }
    pipeline.push({ $limit: 50 }); // cap for performance

    const hiredApps = await Application.aggregate(pipeline);

    // Load candidate profiles
    const goldenProfiles = await CandidateProfile.find({
      _id: { $in: hiredApps.map((a) => a.candidateId) },
    })
      .select('skills experience education')
      .lean();

    // 2) Score similarity (Jaccard on skills)
    const scored = goldenProfiles
      .map((p) => {
        const skills = this._extractSkills(p);
        const sim = this._jaccard(userSkills, skills);
        return { profile: p, skills, similarity: sim };
      })
      .filter((x) => x.similarity > 0); // ignore zero-sim

    const top = scored.sort((a, b) => b.similarity - a.similarity).slice(0, topK);

    if (top.length < minRetrieved) {
      // Fallback to LLM only
      const fallback = await this._llmFallback(userCV);
      return {
        method: 'rag-fallback',
        retrievedCount: top.length,
        confidence: 60,
        suggestions: fallback,
      };
    }

    // 3) Aggregate evidence
    const skillsStats = this._aggregateSkills(top);
    const missingSkills = skillsStats.common.filter((s) => !userSkills.includes(s));
    const confidence = Math.round(
      (top.reduce((acc, x) => acc + x.similarity, 0) / top.length) * 100
    );

    const suggestions = [];
    if (missingSkills.length) {
      suggestions.push(
        `Bổ sung kỹ năng: ${missingSkills.slice(0, 5).join(', ')} (xuất hiện nhiều trong CV đã được tuyển)`
      );
    }
    if (skillsStats.common.length) {
      suggestions.push(
        `Nhấn mạnh các kỹ năng đang có: ${skillsStats.common.slice(0, 5).join(', ')} (phổ biến ở CV hired)`
      );
    }
    if (top.length) {
      suggestions.push(
        `Định lượng thành tích trong kinh nghiệm/dự án (theo CV hired cùng vị trí)`
      );
    }

    return {
      method: 'rag-lite',
      retrievedCount: top.length,
      confidence,
      evidence: {
        commonSkills: skillsStats.common.slice(0, 10),
        missingSkills: missingSkills.slice(0, 10),
      },
      suggestions,
    };
  }

  _extractSkills(data) {
    if (!data) return [];
    const skills =
      (Array.isArray(data.skills) ? data.skills : []) ||
      (data.skills?.technical || []);
    return skills
      .map((s) => (typeof s === 'string' ? s : s.name))
      .filter(Boolean)
      .map((s) => s.toLowerCase().trim());
  }

  _jaccard(a, b) {
    const setA = new Set(a);
    const setB = new Set(b);
    if (setA.size === 0 && setB.size === 0) return 0;
    const inter = [...setA].filter((x) => setB.has(x)).length;
    const union = setA.size + setB.size - inter;
    return union === 0 ? 0 : inter / union;
  }

  _aggregateSkills(top) {
    const freq = new Map();
    top.forEach(({ skills }) => {
      skills.forEach((s) => freq.set(s, (freq.get(s) || 0) + 1));
    });
    const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);
    const common = sorted.map(([s]) => s);
    return { common, freq };
  }

  async _llmFallback(userCV) {
    try {
      const model = this.aiService?.getModel();
      if (!model) throw new Error('LLM model unavailable');
      const prompt = `
Bạn là chuyên gia tuyển dụng. Đưa 4–6 gợi ý cải thiện CV (ngắn, tiếng Việt, không bịa).
CV:
${JSON.stringify(userCV, null, 2)}

Trả về JSON: { "suggestions": ["..."] }
`;
      const res = await model.generateContent(prompt);
      const text = res?.response?.text?.() || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return parsed.suggestions || [];
      }
      return text
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s);
    } catch (err) {
      logger.warn('LLM fallback failed, returning generic suggestions', err.message);
      return [
        'Định lượng thành tích (số liệu, % cải thiện)',
        'Thêm 1–2 dự án thực tế liên quan',
        'Nhấn mạnh kỹ năng cứng theo job target',
      ];
    }
  }
}

let instance = null;
function getCVRAGSuggestionService(aiService) {
  if (!instance) instance = new CVRAGSuggestionService(aiService);
  return instance;
}

module.exports = { getCVRAGSuggestionService, CVRAGSuggestionService };

