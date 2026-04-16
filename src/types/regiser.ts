// 회원가입시 권한 응답 타입
export interface roleResponse {
    clsfCd: string,
    cdId: string,
    cdNm: string,
}

export interface deptResponse {
    code: string,
    codeNm: string,
}

export interface signUpRequest{
    userId :    string,
    pswd :    string,
    userNm :    string,
    deptId :    string,
    emlAddr :     string,
    telno: string,
}

export interface signUpResponse{
    success: boolean,
    code: string,
    message: string,
    data: string,
}