import { ReportStatus } from "@/types/report";

/**
 * 신고 상태에 따른 한글 명칭과 스타일(Tailwind Class)을 반환합니다.
 */
export const getReportStatusInfo = (status: ReportStatus) => {
  switch (status) {
    case "PROCESSING":
      return {
        label: "처리 중",
        style: "bg-blue-100 text-blue-600",
      };
    case "COMPLETED":
      return {
        label: "처리 완료",
        style: "bg-emerald-100 text-emerald-600",
      };
    case "REJECTED":
      return {
        label: "반려됨",
        style: "bg-red-100 text-red-600",
      };
    default:
      return {
        label: "알 수 없음",
        style: "bg-gray-100 text-gray-600",
      };
  }
};

/**
 * ISO 날짜 문자열을 YYYY-MM-DD 형식으로 변환합니다.
 */
export const formatDateTime = (dateString: string) => {
  if (!dateString) return "-";
  
  return dateString
    .replace('T', ' ') 
    .split('.')[0]; 
};