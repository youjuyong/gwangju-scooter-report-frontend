// 공지사항 조회를 위한 요청 파라미터 구조
export interface NoticeRequestForm {
    page: number;
    size: number;
    mainExpsrYn?: 'Y' | 'N';
}

// 공지사항 단건 아이템 타입
export interface NoticeResponse {
    ntcId: string;
    ntcTypeCd: {
        cdId: string;
        cdNm: string;
    };
    ntcTypeNm: string | null;
    ttlNm: string;        // 제목
    cnData: string;       // 내용
    verVl: string | null;
    exprsYn :string;
    mainExpsrYn: string;  // 메인 노출 여부 ('Y' / 'N')
    regDt: string;        // 등록일
    expsrBgngDt : string ;
    expsrEndDt :  string ;
    files : string | null;
    inqCnt : number;
    targets : string | null;
    mdfcnDt : string;
    writer :{
        userNm :string;
    }
}

export interface NoticeAddRequestForm {
    ttlNm: string;
    cnData: string;
    exprsYn : string;
    ntcTypeCd?: string | null;
    verVl?: string | null;
    mainExpsrYn?: 'Y' | 'N';
    noticeFiles?: File[] | any[];
    expsrBgngDt?: string;
    expsrEndDt?: string;
    userTypeCds: string[];
}

// // 전체 응답 구조
// export interface NoticeResponse {
//     data: {
//         content: NoticeItem[];
//         // 만약 페이징 정보(totalPages, totalElements 등)가 있다면 여기에 추가
//     };
// }