export interface AlarmResponse{
    pushLogId : string,
    dclrId : string,
    pushTtlNm : string,
    pushCn : string,
    readYn : string,
    pushTypeNm : {
        cdId : string,
        cdNm : string
    }
    sndngDt : string
}

export interface ApiResponse<T>{
    success: boolean;
    code: string;
    message: string;
    data: T;
}

