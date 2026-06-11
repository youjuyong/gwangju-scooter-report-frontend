export interface pmResponse {
    bzentyId: string,
    bzentyNm : string,
    qrcdUrlForm : string,
    qrcdIdExtrRule: string,
    markImgId: string,
    markImgBase64: string
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