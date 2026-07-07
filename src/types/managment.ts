export interface UserListForm {
    keyword : string;
}
export interface AdminDeptListResponse {
    deptId : string;
    deptNm : string;
}

export interface BzenDeptListResponse {
    deptId : string;
    deptNm : string;
}

export interface  AdminUserInfoForm {
    userId?: string;
    userNm: string;
    pswd: string;
    deptId: string;
    email:string;
    telNum:string;
    sttsCd: string;
    sareaIds: any[];
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

export interface ManagerListResponse {
    userId: string;
    userNm: string;
    emlAddr:string;
    telno: string;
    deptNm:string;
    deptTypeNm: string;
    sttsNm: string;
    regDt: string;
    lgnDt: string;
    regDate: string;
    lgnDate: string;
}