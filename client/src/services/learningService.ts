import { LearningSubject, LearningTopic } from '../types/learning';
import { MOCK_LEARNING_SUBJECTS, MOCK_LEARNING_TOPICS } from '../data/learningData';

/**
 * Service abstraction for learning content, subjects, and topics.
 * Designed to mirror future FastAPI REST endpoints:
 * - GET /api/subjects
 * - GET /api/subjects/:id
 * - GET /api/topics/:id
 * - GET /api/learning/:topicId
 */

const SIMULATED_LATENCY_MS = 120;

export const learningService = {
  /**
   * Fetches all available learning subjects.
   */
  async getSubjects(): Promise<LearningSubject[]> {
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
    return [...MOCK_LEARNING_SUBJECTS];
  },

  /**
   * Fetches a specific subject by its ID.
   */
  async getSubject(subjectId: string): Promise<LearningSubject | null> {
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
    const subject = MOCK_LEARNING_SUBJECTS.find((s) => s.id === subjectId);
    return subject ? { ...subject } : null;
  },

  /**
   * Fetches a specific topic by its subjectId and topicId.
   */
  async getTopic(subjectId: string, topicId: string): Promise<LearningTopic | null> {
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
    const topics = MOCK_LEARNING_TOPICS[subjectId];
    if (!topics) return null;
    const topic = topics.find((t) => t.id === topicId);
    return topic ? { ...topic } : null;
  },

  /**
   * Fetches recommended learning topics across subjects.
   */
  async getRecommendedTopics(): Promise<LearningTopic[]> {
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
    const allTopics = Object.values(MOCK_LEARNING_TOPICS).flat();
    return allTopics.filter((t) => t.isRecommended);
  },

  /**
   * Fetches recently viewed topics for the candidate.
   */
  async getRecentlyViewedTopics(): Promise<LearningTopic[]> {
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
    const math = MOCK_LEARNING_TOPICS['mathematics']?.[0];
    const eng = MOCK_LEARNING_TOPICS['english']?.[0];
    const reas = MOCK_LEARNING_TOPICS['reasoning']?.[0];
    return [math, eng, reas].filter(Boolean) as LearningTopic[];
  },
};
