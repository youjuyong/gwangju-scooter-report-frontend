export interface BusinessInfo {
    bzentyId: string;
    bzentyNm: string;
    dclrPsbltyBgngHm: string;
    dclrPsbltyEndHm: string;
    bzentyType: string;
    qrcdUrlForm: string;
    qrcdIdExtrRule: string;
}

// 1. 신고 상태 타입 (나중에 색상 처리 시 유용)
export type ReportStatus = "PROCESSING" | "COMPLETED" | "REJECTED" | "DONE";
export type BusinessType = "BZTY01" | "BZTY02";

export type CodeType =
    "ALTY"
    | "AVST"
    | "BZTY"
    | "DEST"
    | "DPTY"
    | "LNST"
    | "MNUT"
    | "NTCT"
    | "OSTY"
    | "PHTY"
    | "PSTP"
    | "QNST"
    | "SNST"
    | "SRTY"
    | "STGT"
    | "TPLT"
    | "USTS"
    | "VLTN";

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

export interface Business {
    bzentyId: string;
    bzentyNm: string;
    dclrPsbltyBgngHm: string;
    dclrPsbltyEndHm: string;
    bzentyType: string;
    qrcdUrlForm: string;
    qrcdIdExtrRule: string;
}

export interface DeviceInfo {
    pmDvcId: string;
    bzenty: Business;
    qrcdVl: string;
    useYn: string;
}

// 5. 최종 API 공통 응답 포맷
export interface ApiResponse<T> {
    success: boolean;
    code: string;
    message: string;
    data: T;
}
export interface CommonCode {
    cdId: string;
    cdNm: string;
}

export interface towDcleReportResponse {
    dclrId: string;           // 신고 ID
    bzenty: {
        bzentyId: string;
        bzentyNm: string;
        bzentyType: CommonCode;
    };
    pmDvc: any | null;
    qrcdVl: string;           // 킥보드 ID
    zone: any | null;
    latVl: number | null;
    lotVl: number | null;
    dclrAddrTxt: string;      // 신고 주소
    dclrCn: string;           // 상세 설명
    vltnType: CommonCode;     // 위반 유형 (cdNm: "버스 정류소...")
    dclrUserType: CommonCode; // 신고자 유형
    dclrStts: CommonCode;     // 처리 상태 (cdId: DEST01, DEST02...)
    imgUrls: string[];        // 이미지 배열
    regDt: string;            // 등록 일시 (2026-05-11 21:02:58)
    prcr: any | null;         // 처리자 정보
    prcrHis : any | null;
}

export interface towDcleReportRequestForm {
    searchMonth: string,
    searchDate: string,
    prcsUserId: string,
    dclrSttsCd: string,
    isMap? : string | null
}

export interface staffsResponse {
    userId: string;        // 아이디 (admin2)
    userNm: string;        // 이름 (관리자)
    deptNm: {
        deptId: string;
        deptNm: string; // 실제 부서 이름
        deptTypeCd?: {
            cdId: string;
            cdNm: string;
        };
    } | null; // 데이터가 없을 경우를 대비해 null 허용        // 부서 (운영팀)
    authrtGroupNm: string; // 권한 그룹 (시스템 관리자)
    emlAddr: string;       // 이메일
    telno: string;         // 전화번호
    sttsNm: string;        // 상태 명칭
    lgnDt: string;         // 로그인/처리 일시 (ISO 8601)
}