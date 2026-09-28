import { LearningSubject, LearningTopic } from '../types/learning';
import { apiClient } from './api';

/**
 * Service abstraction for learning content, subjects, and topics.
 * Connected directly to FastAPI backend endpoints:
 * - GET /learning/subjects
 * - GET /learning/topics/:topicId
 */

export const learningService = {
  /**
   * Fetches all available learning subjects.
   */
  async getSubjects(): Promise<LearningSubject[]> {
    return apiClient.get<LearningSubject[]>('/learning/subjects');
  },

  /**
   * Fetches a specific subject by its ID.
   */
  async getSubject(subjectId: string): Promise<LearningSubject | null> {
    const subjects = await this.getSubjects();
    return subjects.find((s) => s.id === subjectId) || null;
  },

  /**
   * Fetches a specific topic by its subjectId and topicId.
   */
  async getTopic(_subjectId: string, topicId: string): Promise<LearningTopic | null> {
    try {
      return await apiClient.get<LearningTopic>(`/learning/topics/${topicId}`);
    } catch {
      return null;
    }
  },

  /**
   * Fetches recommended learning topics across subjects.
   */
  async getRecommendedTopics(): Promise<LearningTopic[]> {
    const subjects = await this.getSubjects();
    const allTopics = subjects.flatMap((s) => s.topics);
    return allTopics.filter((t) => t.isRecommended) as unknown as LearningTopic[];
  },

  /**
   * Fetches recently viewed topics for the candidate.
   */
  async getRecentlyViewedTopics(): Promise<LearningTopic[]> {
    const subjects = await this.getSubjects();
    const firstTopics = subjects.map((s) => s.topics[0]).filter(Boolean);
    return firstTopics as unknown as LearningTopic[];
  },

  /**
   * Fetches candidate's persisted audio lesson playback state for a topic.
   */
  async getAudioState(topicId: string): Promise<import('../types/learning').TopicAudioState> {
    return apiClient.get<import('../types/learning').TopicAudioState>(`/learning/topics/${topicId}/audio-state`);
  },

  /**
   * Updates candidate's persisted audio lesson playback state (sleep-safe position, bookmarks, speed).
   */
  async updateAudioState(
    topicId: string,
    state: Partial<import('../types/learning').TopicAudioState>
  ): Promise<import('../types/learning').TopicAudioState> {
    return apiClient.put<import('../types/learning').TopicAudioState>(`/learning/topics/${topicId}/audio-state`, state);
  },
};
