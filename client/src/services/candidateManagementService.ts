/**
 * Candidate Management Service
 * Manages cohorts, candidate eligibility records, simulated CSV bulk imports,
 * and exam candidate assignments.
 */

import { CandidateGroup, ExamCandidateRecord } from '../types/examiner';
import { INITIAL_CANDIDATE_GROUPS, INITIAL_CANDIDATE_RECORDS } from '../data/candidateData';
import { storage } from '../utils/storage';

const GROUPS_STORAGE_KEY = 'gowow_candidate_groups';
const RECORDS_STORAGE_KEY = 'gowow_candidate_records';

class CandidateManagementService {
  private getGroups(): CandidateGroup[] {
    return storage.get<CandidateGroup[]>(GROUPS_STORAGE_KEY, INITIAL_CANDIDATE_GROUPS);
  }

  private saveGroups(groups: CandidateGroup[]): void {
    storage.set(GROUPS_STORAGE_KEY, groups);
  }

  private getRecords(): ExamCandidateRecord[] {
    return storage.get<ExamCandidateRecord[]>(RECORDS_STORAGE_KEY, INITIAL_CANDIDATE_RECORDS);
  }

  private saveRecords(records: ExamCandidateRecord[]): void {
    storage.set(RECORDS_STORAGE_KEY, records);
  }

  async getCandidateGroups(): Promise<CandidateGroup[]> {
    return this.getGroups();
  }

  async getCandidateGroupById(id: string): Promise<CandidateGroup | null> {
    const groups = this.getGroups();
    return groups.find((g) => g.id === id) || null;
  }

  async createCandidateGroup(data: Partial<CandidateGroup>): Promise<CandidateGroup> {
    const groups = this.getGroups();
    const newGroup: CandidateGroup = {
      id: `grp-${Date.now()}`,
      name: data.name || 'New Candidate Cohort',
      code: data.code || `GRP-${Math.floor(100 + Math.random() * 900)}`,
      organizationId: data.organizationId || 'org-01',
      candidateCount: data.candidateCount || 0,
      description: data.description || '',
      assignedExamIds: data.assignedExamIds || [],
      createdAt: new Date().toISOString().split('T')[0],
    };
    groups.unshift(newGroup);
    this.saveGroups(groups);
    return newGroup;
  }

  async getCandidateRecords(groupId?: string): Promise<ExamCandidateRecord[]> {
    const records = this.getRecords();
    if (!groupId || groupId === 'all') return records;
    return records.filter((r) => r.groupId === groupId);
  }

  async addCandidateRecord(data: Partial<ExamCandidateRecord>): Promise<ExamCandidateRecord> {
    const records = this.getRecords();
    const newRecord: ExamCandidateRecord = {
      id: `cand-${Date.now()}`,
      candidateName: data.candidateName || 'New Candidate',
      candidateId: data.candidateId || `GW-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      email: data.email || 'candidate@example.edu',
      groupId: data.groupId || 'grp-01',
      groupName: data.groupName || 'Batch A',
      eligibilityStatus: data.eligibilityStatus || 'eligible',
      examStatus: 'not_started',
      attemptStatus: 'first_attempt',
      accessibilityStatus: data.accessibilityStatus || 'standard',
      extraTimeGrantedMinutes: data.extraTimeGrantedMinutes || 0,
    };
    records.unshift(newRecord);
    this.saveRecords(records);
    return newRecord;
  }

  async bulkImportSimulated(
    groupId: string,
    rawText: string
  ): Promise<{ importedCount: number; errors: string[] }> {
    const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
    const records = this.getRecords();
    let count = 0;
    const errors: string[] = [];

    const group = (await this.getCandidateGroupById(groupId)) || {
      name: 'Imported Cohort',
    };

    lines.forEach((line, index) => {
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length < 2) {
        errors.push(`Line ${index + 1}: Expected "Name, Email, [RollNo]" format.`);
        return;
      }
      const [name, email, rollNo] = parts;
      records.unshift({
        id: `cand-bulk-${Date.now()}-${index}`,
        candidateName: name,
        candidateId: rollNo || `GW-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        email,
        groupId,
        groupName: group.name,
        eligibilityStatus: 'eligible',
        examStatus: 'not_started',
        attemptStatus: 'first_attempt',
        accessibilityStatus: 'standard',
        extraTimeGrantedMinutes: 0,
      });
      count++;
    });

    this.saveRecords(records);
    return { importedCount: count, errors };
  }
}

export const candidateManagementService = new CandidateManagementService();
