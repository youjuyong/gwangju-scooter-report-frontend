export interface pmResponse {
    bzentyId: string,
    bzentyNm : string,
    qrcdUrlForm : string,
    qrcdIdExtrRule: string,
    markImgId: string,
    markImgBase64: string,
    mdfcnDt: string,
    regDt: string
}

export interface settingResponse<T> {
    success: boolean;
    code: string;
    message: string;
    data: T; // 👈 실제 데이터가 들어오는 알맹이
}

export interface OperationSettingItem {
    operStngId: string;   // 운영 설정 ID (ex: "STNG_GJS_01")
    operCd: string;       // 운영 코드 (ex: "OPER01", "OPER02", "OPER03")
    operCdNm: string;     // 운영 코드명 (ex: "신고 운영", "견인 운영", "자동 운영")
    useYn: string;        // 사용 여부 ("Y" | "N")
    bgngHm: string;       // 시작 시간 (ex: "0900")
    endHm: string;        // 종료 시간 (ex: "1800")
    operStngVl: string | null; // 운영 설정 값
    mdfrId: string;       // 수정자 ID
    mdfcnDt: string;      // 수정 일시 (ex: "2026-06-02")
}

export interface UpdateOperationSettingRequest{
    operStngId: string | null; // 운영 설정 ID
    operCd: string;     // 운영 코드 (OPER01, OPER02, OPER03 등)
    bgngHm: string;     // 시작 시간 (포맷 예: "0900")
    endHm: string;      // 종료 시간 (포맷 예: "1800")
    useYn: string;      // 사용 여부 ("Y" | "N")
}

export interface codeResponse {
    clsfCd: string;     // 분류 코드 (예: ALTY, AVST, BZTY)
    clsfCdNm: string;   // 분류 코드명 (예: 알람 유형, 승인 상태)
    cdId: string;       // 코드 ID (예: ALTY01, AVST01)
    cdNm: string;       // 코드명 (예: 승인제, 승인, PM 운영사)
    sortSeq: number;    // 정렬 순서
    regDt : string;
    cdUseYn : string;
}
export interface codeCreateRequest {
    cdId: string;       // 코드 ID
    cdNm: string;       // 코드명
    sortSeq : number;    // 정렬 순서
   // useYn?: string;     // 사용 여부 (Y/N)
}



export interface codeUpdateRequest {
    newCdId: string;       // 코드 ID
    cdNm: string;       // 코드명
    // useYn?: string;     // 사용 여부 (Y/N)
}