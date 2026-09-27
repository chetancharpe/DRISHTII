/**
 * Exam Schedule Service Layer
 * Enforces explicit timezone display (e.g. IST UTC+05:30), window validation,
 * and duration verification.
 */

import { ExamScheduleConfig } from '../types/examiner';
import { examinerService } from './examinerService';

class ScheduleService {
  validateSchedule(config: ExamScheduleConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.startDate || !config.startTime) {
      errors.push('Start date and start time are required.');
    }
    if (!config.endDate || !config.endTime) {
      errors.push('End date and end time are required.');
    }

    if (config.startDate && config.startTime && config.endDate && config.endTime) {
      const start = new Date(`${config.startDate}T${config.startTime}`);
      const end = new Date(`${config.endDate}T${config.endTime}`);
      if (end.getTime() <= start.getTime()) {
        errors.push('Examination end time must occur strictly after start time.');
      }
    }

    if (config.durationMinutes <= 0 || config.durationMinutes > 360) {
      errors.push('Examination duration must be between 1 and 360 minutes.');
    }

    if (!config.timezone || config.timezone.trim().length === 0) {
      errors.push('Timezone must be explicitly specified (e.g., IST UTC+05:30).');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  async getSchedule(examId: string): Promise<ExamScheduleConfig | null> {
    const exam = await examinerService.getExamById(examId);
    return exam ? exam.schedule : null;
  }

  async updateSchedule(examId: string, schedule: ExamScheduleConfig): Promise<void> {
    const validation = this.validateSchedule(schedule);
    if (!validation.isValid) {
      throw new Error(`Invalid Schedule: ${validation.errors.join(' | ')}`);
    }

    await examinerService.updateExam(examId, { schedule });
  }
}

export const scheduleService = new ScheduleService();
