"use client";

import React, {useEffect, useState, useCallback} from 'react';
import {useDrag} from "@/hooks/userDrag";
import api from "@/services/api";
import {getSystemHierarchyApi} from "@/services/system/systemApi";
import {getRegisterRoleApi} from "@/services/register/registerApi";
import {roleResponse} from "@/types/regiser";
import {registerMenuLog} from "@/services/common/commonApi";

interface ManagerDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRefreshList: () => void;
    data: any | null;
    mode : 'CREATE' | 'UPDATE';
   // isDashBoard?: boolean;
}

interface UserDetail{
    sttsCd : string;
    sttsNm : string;
    userBzentyId : string;
    userBzentyNm : string;
    userId : string;
    userNm : string;
    userEail : string;
    telNo : string;
    userTypeCd : string;
    userTypeNm :  string;
    userDeptId : string;
    userDeptNm : string;
    zoneList : any[];
}
interface Company{
    bzentyId: string;
    bzentyNm: string;
}

interface bzenty{
    deptId : string;
    deptNm : string;
}
interface zone {
    sareaId : string;
    sareaNm : string;
}
export default function MangerPopup({isOpen,onClose,data,mode,onRefreshList}:ManagerDetailModalProps){
    const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
    const [userType,setUserType] = useState<roleResponse[]>([]);
    const [Company, setCompanyList] = useState<Company[]>([]);
    const [isIdChecked, setIsIdChecked] = useState(false); // id 중복체크 여부
    const [bzenty , setBzenty] = useState<bzenty[]>([]);//pm,견인 업체리스트
    const [deptlist,setDeptList] = useState<any>([]); //업체 부서 리스트
    const [zone, setZoneList] = useState<zone[]>([]);
    const [regionList, setRegionList] = useState<any[]>([]); //전체 대분류 권역 목록
    const {position, handleMouseDown, isDragging} = useDrag(isOpen); // 팝업 드래그
    const [formData, setFormData] = useState<any>({
        userId: '',         // 기존 id
        userNm: '',         // 기존 name
        email: '',
        telNum: '',
        password: '',
        passwordConfirm: '',
        userTypeCd: 'DPTY01',
        userTypeNm: '관리자', // 기존 userType
        userDeptId: '',
        userBzentyId: '',
        sttsCd: 'USTS02',   // 기존 isUse ('사용'의 공통코드)
        sareaIds: []        // 기존 regions
    });

    const loadDeptList = useCallback(async (typeCd: string) => {
        if (!typeCd || !["DPTY01", "DPTY02"].includes(typeCd)) {
            setDeptList([]);
            return;
        }
        try {
            const response = await api.get(`/code/adminOper/${typeCd}`);
            setDeptList(response.data.data || []);
        } catch (error) {
            console.error("부서 리스트 로드 실패:", error);
        }
    }, []);

    const loadCompanyList = useCallback(async (typeCd: string) => {
        if (!typeCd || ["DPTY01", "DPTY02"].includes(typeCd)) {
            setCompanyList([]);
            return [];
        }
        try {
            let response = null;
            // PM사(DPTY03)냐 견인사(DPTY04 등)냐에 따라 대분류 회사 목록을 가져옵니다.
            if (typeCd === 'DPTY03') {
                response = await api.get(`/code/bzType/BZTY01`);
            } else {
                response = await api.get(`/code/bzType/BZTY02`);
            }
            const compList = response.data.data || [];
            setCompanyList(compList);

            return compList;
        } catch (error) {
            console.error("업체 리스트 로드 실패:", error);
        }
    }, []);

    const loadBzentyList = useCallback(async (bzentyId: string) => {
        if (!bzentyId) {
            setBzenty([]);
            return;
        }
        try {
            const response = await api.get(`/code/company/${bzentyId}`);
            setBzenty(response.data.data || []);
        } catch (error) {
            console.error("업체 부서 리스트 로드 실패:", error);
            setBzenty([]);
        }
    }, []);

    const validatePassword = (password: string): { isValid: boolean; message: string } => {
        // if (!password) {
        //     return { isValid: false, message: "비밀번호를 입력해 주세요." };
        // }

        // 1. 포함된 문자 종류 카운트 규칙 설정
        const hasLetter = /[a-zA-Z]/.test(password); // 영문자 포함 여부
        const hasNumber = /[0-9]/.test(password);    // 숫자 포함 여부
        const hasSpecial = /[^a-zA-Z0-9]/.test(password); // 특수문자 포함 여부

        // 2. 참(true)인 종류의 개수를 더합니다.
        let typeCount = 0;
        if (hasLetter) typeCount++;
        if (hasNumber) typeCount++;
        if (hasSpecial) typeCount++;

        const len = password.length;

        // 3. 조건별 분기 처리
        if (typeCount >= 2) {
            // 두 종류 이상의 문자를 조합한 경우 -> 최소 8자리 이상
            if (len < 8) {
                return { isValid: false, message: "문자/숫자/특수문자 중 2종류 이상 조합 시 최소 8자리 이상 입력해야 합니다." };
            }
        } else if (typeCount === 1) {
            // 하나의 문자 종류로만 구성한 경우 -> 최소 10자리 이상
            if (len < 10) {
                return { isValid: false, message: "한 종류의 문자로만 구성 시 최소 10자리 이상 입력해야 합니다." };
            }
        } else {
            return { isValid: false, message: "유효하지 않은 비밀번호 형식입니다." };
        }

        return { isValid: true, message: "사용 가능한 비밀번호입니다." };
    };

    const handleSave = async () => {
        if (mode === 'CREATE' && !isIdChecked) {
            alert("아이디 중복확인을 진행해 주세요.");
            return;
        }

        const password = formData.password;
        const passwordConfirm = formData.passwordConfirm;

        if (password && password.trim() !== "") {

            // 1. 비밀번호 규격 조건 검증 (8자리 또는 10자리 규칙)
            const pwdValidation = validatePassword(password);
            if (!pwdValidation.isValid) {
                alert(pwdValidation.message);
                return; // 검증 통과 못 하면 여기서 중단
            }

            // 2. 비밀번호와 비밀번호 확인 칸이 일치하는지 검증
            if (password !== passwordConfirm) {
                alert("비밀번호와 비밀번호 확인 값이 일치하지 않습니다.");
                return; // 일치하지 않으면 여기서 중단
            }
        }

        if(mode === 'UPDATE'){
            if (confirm("수정 하시겠습니까?")) {
                try {
                    const param = {
                        userNm: formData.userNm,
                        pswd: password, // 검증 완료된 안전한 비밀번호 복사
                        deptId: formData.userDeptId,
                        sttsCd: formData.sttsCd,
                        sareaIds: formData.sareaIds
                    };

                    console.log("전송 파라미터:", param);
                    await api.put(`/admin/user/detail/${formData.userId}`, param);
                    alert("수정이 완료되었습니다.");
                    onRefreshList();
                    onClose();
                } catch (error) {
                    console.error("수정 실패:", error);
                }
            }
        }else if(mode ==='CREATE'){
            if (confirm("저장 하시겠습니까?")) {
                try {
                    const param = {
                        userId: formData.userId,
                        userNm: formData.userNm,
                        pswd: password,
                        deptId: formData.userDeptId,
                        email: formData.email,
                        telNum: formData.telNum,
                        sttsCd: formData.sttsCd,
                        sareaIds: formData.sareaIds
                    };

                    console.log("전송 파라미터:", param);
                    await api.post(`/admin/user/register`, param);
                    alert("등록이 완료되었습니다.");
                    onRefreshList();
                    onClose();
                } catch (error) {
                    console.error("등록 실패:", error);
                }
            }
        }
    };

    const handleIdCheck = async () => {
        const userId = formData.userId;

        if (!userId || userId.trim() === "") {
            alert("아이디를 입력해 주세요.");
            return;
        }

            try {
                    await api.get('/admin/user/check-id', {
                    params: {
                        userId: userId // 스웨거에 적힌 파라미터 이름(userId) 그대로 매칭
                    }
                });
                alert("사용 가능한 아이디입니다.");
                setIsIdChecked(true);
        } catch (error) {
            alert("이미 사용 중이거나 사용할 수 없는 아이디입니다.");
            setIsIdChecked(false);
        }
    };

    useEffect(()=>{
        if (!isOpen) {
            setUserDetail(null);
            setFormData((prev: any) => ({
                ...prev,
                userTypeCd: 'DPTY01', // 닫힐 때도 관리자로 초기화
                sareaIds: []
            }));
            return;
        }

        if(mode === 'UPDATE'){
            if (!isOpen || !data.userId) return;
        }else{
            if (!isOpen) return;
        }

        const fetchUserDetail = async()=>{
            try{
                const response = await api.get(`/admin/user/detail/${data.userId}`);
                setUserDetail(null);
                setUserDetail(response.data);
                console.log("userDetail: ",response.data );
            }catch(error){
                console.error("유저 상세 데이터 로드 실패:", error);
            }
        }

       const fetchHierarchyZones = async ()=>{
           try {
               const response = await getSystemHierarchyApi();
               // 백엔드에서 준 데이터 구조에 맞춰 꺼냅니다 (예: response.data.data 또는 response.data)
               const allZones = response.data?.data || response || [];

               // 🎯 upSarea 내부의 sareaId가 없는(null) 대분류 데이터만 필터링
               const mainRegions = allZones.filter((item: any) => !item.upSarea?.sareaId);

               setRegionList(mainRegions);
           } catch (error) {
               console.error("권역 데이터 로드 실패:", error);
           }
       }

       const fetchUserType = async()=>{
            try{
                const response = await getRegisterRoleApi();
                setUserType(response);
            }catch(error){
                console.error("유저 타입 로드 실패:", error);
            }
       }
        fetchUserDetail();
        fetchUserType();
        fetchHierarchyZones();

    }, [isOpen, data, mode]);

    useEffect(() => {
      //  console.log("실제로 바뀐 userType 데이터:", userType);
      //   console.log("실제로 바뀐 pmCompanyList 데이터:", pmCompanyList);
         console.log("실제로 바뀐 formData 데이터:", formData);
       // console.log("실제로 바뀐 userDetail 데이터:", userDetail);
    }, [userType,formData,userDetail]); // <- 감시할 대상(디펜던시)에 userType을 넣어줍니다.

    useEffect(() => {
        const timer = setTimeout(() => {
            if (mode === 'UPDATE' && userDetail) {
                const checkedIds = (userDetail.zoneList || [])
                    .filter((zone: any) => zone.assigned === true)
                    .map((zone: any) => String(zone.sareaId));

                setFormData({
                    userId: userDetail.userId || '',
                    userNm: userDetail.userNm || '',
                    email: userDetail.userEail,
                    telNum: userDetail.telNo,
                    password: '',
                    passwordConfirm: '',
                    userTypeNm: userDetail.userTypeNm || '관리자',
                    userTypeCd: userDetail.userTypeCd,
                    userDeptId: userDetail.userDeptId,
                    sareaIds: checkedIds,
                    sttsCd : userDetail.sttsCd,
                    userBzentyId : userDetail.userBzentyId || '',
                });

                const type = userDetail.userTypeCd;
                if (type === "DPTY01" || type === "DPTY02") {
                    loadDeptList(type);
                } else {
                    // 🎯 기존 유저의 종류에 맞는 회사 리스트를 먼저 가져오고,
                    loadCompanyList(type);
                    // 기존 유저가 속해있던 회사의 부서 리스트를 연달아 가져옵니다.
                    if (userDetail.userBzentyId) {
                        loadBzentyList(userDetail.userBzentyId);
                    }
                }
            } else {
                setFormData({
                    userId: '',
                    userNm: '',
                    email: '',
                    telNum: '',
                    password: '',
                    passwordConfirm: '',
                    userTypeCd: 'DPTY01',
                    userTypeNm: '관리자',
                    userDeptId: '',
                    userBzentyId: '',
                    sttsCd: 'USTS02',
                    sareaIds: []
                });
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [userDetail, mode, loadDeptList, loadCompanyList, loadBzentyList]);

    // 3. 인풋 값 핸들러
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData((prev: any) => ({ ...prev, [name]: value }));

        // 아이디 입력칸의 글자가 하나라도 바뀌면 중복확인 상태를 초기화
        if (name === "userId") {
            setIsIdChecked(false);
        }
        // 사용자 종류(userTypeCd)가 변경된 경우
        if (name === "userTypeCd") {
            setBzenty([]);
            setDeptList([]);

            if (value === "DPTY01" || value === "DPTY02") {
                loadDeptList(value);
                setFormData((prev: any) => ({
                    ...prev,
                    userTypeCd: value,
                    userBzentyId: "",
                    userDeptId: ""
                }));
            } else {
                // 🔥 [핵심 추가] 비동기 함수를 만들어 연쇄 호출을 실행합니다.
                const fetchAndSelectFirstCompany = async () => {
                    // 1. 회사 리스트를 긁어옵니다.
                    const compList = await loadCompanyList(value);

                    if (compList && compList.length > 0) {
                        // 2. 리스트 중 젤 첫 번째 회사의 ID를 추출합니다.
                        const firstCompanyId = compList[0].bzentyId;

                        // 3. formData에 첫 번째 회사를 강제로 세팅합니다.
                        setFormData((prev: any) => ({
                            ...prev,
                            userTypeCd: value,
                            userBzentyId: firstCompanyId,
                            userDeptId: ""
                        }));

                        // 4. 그 즉시 첫 번째 회사의 부서 목록도 호출하여 채워 넣습니다!
                        loadBzentyList(firstCompanyId);
                    } else {
                        // 회사가 아예 하나도 없을 때의 예외 처리
                        setFormData((prev: any) => ({
                            ...prev,
                            userTypeCd: value,
                            userBzentyId: "",
                            userDeptId: ""
                        }));
                    }
                };

                // 위에서 만든 함수 실행
                fetchAndSelectFirstCompany();
            }
        }

        // 🎯 회사 종류(userBzentyId)가 사용자에 의해 수동으로 변경된 경우 (기존 유지)
        if (name === "userBzentyId") {
            loadBzentyList(value);
            setFormData((prev: any) => ({ ...prev, userDeptId: "" }));
        }
    };
    const handleCheckboxChange = (sareaId: string, checked: boolean) => {
        setFormData((prev: any) => {
            const currentIds = prev.sareaIds || [];

            // 🎯 체크되면 배열에 추가, 해제되면 배열에서 필터링 제거
            const nextIds = checked
                ? [...currentIds, String(sareaId)]
                : currentIds.filter((id: string) => id !== String(sareaId));

            return { ...prev, sareaIds: nextIds };
        });
    };

    useEffect(() => {
        const recordMenuLog = async () => {
            try {
                await registerMenuLog("OPR5200");
            } catch (error) {
                console.error("메뉴 이력 적재 실패:", error);
            }
        };
        recordMenuLog();
    }, []);

    return(
    <div className="popupWrap">
        <div className="popupInner">
            <div className="popup popup_manager"
                 style={{  // 팝업 드래그
                     transform: `translate(${position.x}px, ${position.y}px)`,
                     transition: isDragging ? 'none' : 'transform 0.1s ease'
                 }}>
                <h3
                    onMouseDown={handleMouseDown}
                    style={{cursor: 'move', userSelect: 'none'}}
                >관리자
                </h3>
                <button className="popupClose" onClick={onClose}>닫기</button>
                <div className="popupconten">
                    <table>
                        <tbody>
                        <tr>
                            <th>ID</th>
                            <td>
                                <input
                                    type="text"
                                    name="userId"
                                    value={formData?.userId}
                                    onChange={handleChange}
                                    className="menager_id"
                                />
                                <button className="duplicate" type="button"
                                        onClick={handleIdCheck}>중복확인</button>
                            </td>
                        </tr>
                        <tr>
                            <th>이름</th>
                            <td>
                                <input
                                    type="text"
                                    name="userNm"
                                    value={formData?.userNm}
                                    onChange={handleChange}
                                />
                            </td>
                        </tr>
                        <tr>
                            <th>연락처</th>
                            <td>
                                <input
                                    type="text"
                                    name="telNum"
                                    placeholder="000-0000-0000"
                                    value={formData?.telNum}
                                    onChange={handleChange}
                                />
                            </td>
                        </tr>
                        <tr>
                            <th>이메일</th>
                            <td>
                                <input
                                    type="text"
                                    name="email"
                                    value={formData?.email}
                                    onChange={handleChange}
                                />
                            </td>
                        </tr>
                        <tr>
                            <th>비밀번호</th>
                            <td>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData?.password || ''}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                    readOnly
                                    onFocus={(e) => e.target.removeAttribute('readonly')}
                                />
                            </td>
                        </tr>
                        <tr>
                            <th>비밀번호확인</th>
                            <td>
                                <input
                                    type="password"
                                    name="passwordConfirm"
                                    onChange={handleChange}
                                />
                                {formData.passwordConfirm && formData.password !== formData.passwordConfirm && (
                                    <p style={{
                                        color: '#ff4d4f',
                                        fontSize: '12px',
                                        marginTop: '4px',
                                        marginBlockEnd: 0
                                    }}>
                                        비밀번호가 일치하지 않습니다.
                                    </p>
                                )}
                            </td>
                        </tr>
                        <tr>
                            <th>사용자 종류</th>
                            <td>
                                <select
                                    name="userTypeCd"
                                    value={formData?.userTypeCd}
                                    onChange={handleChange}
                                >
                                    {userType.map((type) => (
                                        <option key={type.cdId} value={type.cdId}>
                                            {type.cdNm}
                                        </option>
                                    ))}
                                </select>
                            </td>
                        </tr>
                        {["DPTY01", "DPTY02"].includes(formData?.userTypeCd) ? (
                            <tr>
                                <th>부서</th>
                                <td>
                                    <select
                                        name="userDeptId"
                                        value={formData?.userDeptId || ""}
                                        onChange={handleChange}
                                    >
                                        {deptlist.map((type: any) => (
                                            <option key={type.deptId} value={type.deptId}>
                                                {type.deptNm}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ) : (
                            /* 2. 관리자/운영자가 아닌 경우 (PM사, 견인사 등등) ➡️ 회사와 부서가 연달아 출력됨 */
                            <>
                                <tr>
                                    <th>회사</th>
                                    <td>
                                        <select
                                            name="userBzentyId"
                                            value={formData?.userBzentyId || ""}
                                            onChange={handleChange}
                                        >
                                            {Company.map((company: any) => (
                                                <option key={company.bzentyId} value={company.bzentyId}>
                                                    {company.bzentyNm}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                                <tr>
                                    <th>부서</th>
                                    <td>
                                        <select
                                            name="userDeptId"
                                            value={formData?.userDeptId || ""}
                                            onChange={handleChange}
                                            // 💡 [핵심] 회사가 선택되지 않았다면 부서 창을 비활성화(회색 처리) 합니다.
                                            disabled={!formData?.userBzentyId}
                                        >
                                            <option value="">부서를 선택하세요</option>
                                            {bzenty && bzenty.length > 0 && (
                                                bzenty.map((dept: any) => (
                                                    <option key={dept.deptId} value={dept.deptId}>
                                                        {dept.deptNm}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </td>
                                </tr>
                            </>
                        )}
                        <tr>
                            <th>계정상태</th>
                            <td>
                                <select
                                    name="sttsCd" // 🎯 formData의 key명과 일치시킵니다.
                                    value={formData?.sttsCd} // 🎯 기본값으로 '사용(USTS02)'을 세팅하거나 formData 값을 추적합니다.
                                    onChange={handleChange} // 🎯 기존에 만들어둔 핸들러를 그대로 연결합니다.
                                >
                                    <option value="USTS02">사용</option>
                                    <option value="USTS01">사용안함</option>
                                </select>
                            </td>
                        </tr>
                        {!["DPTY01", "DPTY02"].includes(formData?.userTypeCd) && (
                        <tr>
                            <th>담당권역</th>
                            <td style={{padding: '10px 0px'}}>
                                {  regionList.map((region: any) => (
                                        <label key={region.sareaId}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData?.sareaIds?.includes(String(region.sareaId)) || false}
                                                onChange={(e) => handleCheckboxChange(String(region.sareaId), e.target.checked)}
                                            />
                                            {" "}{region.sareaNm}
                                        </label>
                                    ))
                                }
                            </td>
                        </tr>
                        )}
                        </tbody>
                    </table>

                    <div className="btnSet">
                        <button onClick={onClose}>취소</button>
                        <button className="red" onClick={handleSave}>저장</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    )
}