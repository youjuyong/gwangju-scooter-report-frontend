export interface AdminReportForm {
    startDate: string;
    endDate: string;
    bzentyId:string | null;
    dclrSttsCd: string | null;
    keyword: string  | null;
}

export interface AdminReportResponse {
    prcsHstryId: string;
    dclrId: string; //신고아이디
    bzentyId: string;
    bzentyNm:  string;
    dclrAddrTxt: string;
    dclrCn: string;
    vltnTypeCd: string;
    vltnTypeNm: string;
    prcsStpCd: string;
    prcsStpNm: string;
    prcsDt: string; //신고일시
    prcsRsn: string;
    prcrId: string;
    dclrUserId : string;
    qrVal : string;
    dclDt : string;
}

export interface PrivacyReportForm{
    targetYear : string;
}

export interface PrivacyReportResponse {
    delLogId: string;
    delNocs: number;
    delDt: string;
}

export interface UserHistoryForm {
    startDate : string;
    endDate : string;
    keyword : string;
}

export interface UserHistoryResponse {
    chgUserNm : string;
    chgUserId : string;
    deptTypeNm : string // 계정유형
    chgDt : string;
    displayContent : string;
    aftrVl: string ; // 변경유형 (수정,삭제 등)
}

export interface UserConnHistroyForm {
    startDate : string;
    endDate : string;
}

export interface UserConntHistoryResponse{
    cntnLogId: string;
    userId: string;
    cntnIpAddr: string;
    cntnDt: string;
}