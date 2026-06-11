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