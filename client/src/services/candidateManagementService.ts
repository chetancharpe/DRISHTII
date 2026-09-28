/**
 * Candidate Management Service
 * Manages cohorts, candidate eligibility records, simulated CSV bulk imports,
 * and exam candidate assignments.
 */

import { CandidateGroup, ExamCandidateRecord } from '../types/examiner';
import { INITIAL_CANDIDATE_GROUPS, INITIAL_CANDIDATE_RECORDS } from '../fixtures/examinerFixtures';
import { storage } from '../utils/storage';
import { apiClient } from './api';

export interface RosterImportResultItem {
  row_number: number;
  candidate_id: string;
  email: string;
  name: string;
  status: 'PROVISIONED_AND_ENROLLED' | 'ALREADY_ENROLLED' | 'ENROLLED_EXISTING' | 'ERROR';
  accommodations_applied: string[];
  error_detail?: string | null;
}

export interface RosterCsvImportResponse {
  exam_id: string;
  total_rows: number;
  success_count: number;
  error_count: number;
  new_users_provisioned: number;
  results: RosterImportResultItem[];
}

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

  async importCandidateRosterCsv(
    examId: string,
    csvContent: string,
    defaultGroup: string = 'Main Cohort'
  ): Promise<RosterCsvImportResponse> {
    try {
      const response = await apiClient.post<RosterCsvImportResponse>(
        `/examiner/exams/${examId}/candidates/csv-import`,
        { csv_content: csvContent, default_group: defaultGroup }
      );
      if (response && response.results) {
        const existingRecords = this.getRecords();
        response.results.forEach((item: RosterImportResultItem) => {
          if (item.status !== 'ERROR') {
            const extraTimeMatch = item.accommodations_applied
              .find((a: string) => a.startsWith('extra_time_'))
              ?.match(/\d+/);
            const extraTime = extraTimeMatch ? parseInt(extraTimeMatch[0], 10) : 0;
            const primaryAccom = item.accommodations_applied[0] || 'standard';

            const existsIdx = existingRecords.findIndex(
              (r) => r.candidateId === item.candidate_id || r.email === item.email
            );
            const recordData: ExamCandidateRecord = {
              id: `cand-${item.candidate_id}-${Date.now()}`,
              candidateName: item.name,
              candidateId: item.candidate_id,
              email: item.email,
              groupId: 'grp-01',
              groupName: defaultGroup,
              eligibilityStatus: 'eligible',
              examStatus: 'not_started',
              attemptStatus: 'first_attempt',
              accessibilityStatus: primaryAccom as any,
              extraTimeGrantedMinutes: extraTime,
            };

            if (existsIdx >= 0) {
              existingRecords[existsIdx] = { ...existingRecords[existsIdx], ...recordData };
            } else {
              existingRecords.unshift(recordData);
            }
          }
        });
        this.saveRecords(existingRecords);
        return response;
      }
    } catch {
      // Fallback to client-side parsing if network/mock
    }

    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const results: RosterImportResultItem[] = [];
    const existingRecords = this.getRecords();
    let successCount = 0;
    let errorCount = 0;
    let provisionedCount = 0;

    lines.forEach((line, idx) => {
      if (idx === 0 && line.toLowerCase().includes('email')) return;
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length < 2) {
        results.push({
          row_number: idx + 1,
          candidate_id: 'UNKNOWN',
          email: '',
          name: '',
          status: 'ERROR',
          accommodations_applied: [],
          error_detail: 'Missing required fields (Name and Email)',
        });
        errorCount++;
        return;
      }

      const name = parts[0] || 'Unknown';
      const email = parts[1] || '';
      const candidateId = parts[2] || `CAND-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const accomRaw = parts[3] || 'standard';
      const accomList = accomRaw.split(';').map((a) => a.trim().toLowerCase()).filter(Boolean);

      const extraTimeMatch = accomList.find((a) => a.startsWith('extra_time_'))?.match(/\d+/);
      const extraTime = extraTimeMatch ? parseInt(extraTimeMatch[0], 10) : 0;
      const primaryAccom = accomList[0] || 'standard';

      const existsIdx = existingRecords.findIndex((r) => r.candidateId === candidateId || r.email === email);
      if (existsIdx >= 0) {
        results.push({
          row_number: idx + 1,
          candidate_id: candidateId,
          email,
          name,
          status: 'ALREADY_ENROLLED',
          accommodations_applied: accomList,
        });
        successCount++;
      } else {
        existingRecords.unshift({
          id: `cand-${candidateId}-${Date.now()}`,
          candidateName: name,
          candidateId,
          email,
          groupId: 'grp-01',
          groupName: defaultGroup,
          eligibilityStatus: 'eligible',
          examStatus: 'not_started',
          attemptStatus: 'first_attempt',
          accessibilityStatus: primaryAccom as any,
          extraTimeGrantedMinutes: extraTime,
        });
        results.push({
          row_number: idx + 1,
          candidate_id: candidateId,
          email,
          name,
          status: 'PROVISIONED_AND_ENROLLED',
          accommodations_applied: accomList,
        });
        successCount++;
        provisionedCount++;
      }
    });

    this.saveRecords(existingRecords);

    return {
      exam_id: examId,
      total_rows: results.length,
      success_count: successCount,
      error_count: errorCount,
      new_users_provisioned: provisionedCount,
      results,
    };
  }

  downloadSampleCsvTemplate(): void {
    const csvContent =
      'Name,Email,CandidateID,Accommodations\n' +
      'Aarav Sharma,aarav.sharma@example.edu,CAND-2026-101,screen_reader;extra_time_30;audio_assistance\n' +
      'Priya Patel,priya.patel@example.edu,CAND-2026-102,high_contrast;keyboard_navigation\n' +
      'Rohan Deshmukh,rohan.d@example.edu,CAND-2026-103,standard\n' +
      'Fatima Zahra,fatima.z@example.edu,CAND-2026-104,large_text;extra_time_15\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'candidate_roster_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const candidateManagementService = new CandidateManagementService();
