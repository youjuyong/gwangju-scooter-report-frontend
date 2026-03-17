// 1. 신고 상태 타입 (나중에 색상 처리 시 유용)
export type ReportStatus = "PROCESSING" | "COMPLETED" | "REJECTED";

// 2. 개별 신고 항목 정보
export interface ReportItem {
  reportId: number;
  scooterId: number;
  reportMemberId: string; // UUID
  reportStatus: ReportStatus;
  reportedAt: string; // ISO DateTime
  processedAt: string | null;
}

// 3. 페이징 정보
export interface PageInfo {
  size: number;
  number: number;
  totalElements: number;
  totalPages: number;
}

// 4. API 응답 데이터 (data 내부 구조)
export interface ReportData {
  content: ReportItem[];
  page: PageInfo;
}

// 5. 최종 API 공통 응답 포맷
export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T;
}
