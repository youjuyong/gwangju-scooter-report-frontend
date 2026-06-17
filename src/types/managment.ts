export interface UserListForm {
    keyword : string;
}

export interface UserListResponse {
    dclUserId: string;
    dclUserName:string;
    emailAddr: string;
    telNo: string;
    snsId: string;
    snsTypeName: string;
    getSnsTypeCd: string;
    regDt: string;
    lgnDt: string;
}

