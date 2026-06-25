"use client";

import React, {useEffect, useState, useCallback} from 'react';
import {useDrag} from "@/hooks/userDrag";
import api from "@/services/api";
import {getSystemHierarchyApi} from "@/services/system/systemApi";
import {getRegisterRoleApi} from "@/services/register/registerApi";
import {roleResponse} from "@/types/regiser";
import {registerMenuLog} from "@/services/common/commonApi";
import {validateFields} from "@/utils/validation";

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

interface bzenDept{
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
    const [Company, setCompanyList] = useState<Company[]>([]); //Pm,견인사 별 회사 목록
    const [isIdChecked, setIsIdChecked] = useState(false); // id 중복체크 여부
    const [bzenDeptlist , setBzenDeptlist] = useState<bzenDept[]>([]);//업체별 부서 리스트
    const [deptlist,setDeptList] = useState<any>([]); //운영자,관리자 부서 리스트
    const [regionList, setRegionList] = useState<zone[]>([]); //전체 대분류 권역 목록
    const { position, handleMouseDown, isDragging, popupRef } = useDrag(isOpen);

    //유효성 검사
    const [errors, setErrors] = useState({
        userId: '',
        userNm: '',
        password: '',
   //     email: '',
   //     telNum: ''
    });
    const errorStyle: React.CSSProperties = {
        color: '#ff4d4f',
        fontSize: '12px',
        marginTop: '4px',
        marginBlockEnd: 0,
        whiteSpace: 'pre-wrap'
    };

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

    //운영자,관리자 부서 리스트 조회
    const loadDeptList = useCallback(async (typeCd: string) => {
        if (!typeCd || !["DPTY01", "DPTY02"].includes(typeCd)) {
            setDeptList([]);
            return;
        }
        try {
            const response = await api.get(`/code/adminOper/${typeCd}`);
            setDeptList(response.data.data || []);
        } catch (error) {
            console.error("(운영자,관리자)부서 리스트 로드 실패:", error);
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

    const loadBzenDeptList = useCallback(async (bzentyId: string) => {
        if (!bzentyId) {
            setBzenDeptlist([]);
            return;
        }
        try {
            const response = await api.get(`/code/company/${bzentyId}`);
            setBzenDeptlist(response.data.data || []);
        } catch (error) {
            console.error("업체 부서 리스트 로드 실패:", error);
            setBzenDeptlist([]);
        }
    }, []);


    const handleSave = async () => {
        if (mode === 'CREATE' && !isIdChecked) {
            alert("아이디 중복확인을 진행해 주세요.");
            return;
        }
        if (formData.userDeptId === ''){
            alert("부서를 선택해 주세요.");
            return;
        }
        //유효성 검사 강제 실행
        const idRes = validateFields.userId(formData.userId);
        const nmRes = validateFields.userName(formData.userNm);
    //    const emailRes = validateFields.email(formData.email);
     //   const telRes = validateFields.phoneNumber(formData.telNum);

        // 비밀번호는 CREATE일 땐 필수, UPDATE일 땐 값이 있을 때만 검사
        const pwRes: boolean | string = true;
        const pwConfirmRes: boolean | string = true;

        // 2. 검사 결과 취합
        const newErrors = {
            userId: idRes === true ? '' : idRes,
            userNm: nmRes === true ? '' : nmRes,
       //     email: emailRes === true ? '' : emailRes,
        //    telNum: telRes === true ? '' : telRes,
            password: pwRes === true ? '' : pwRes,
            passwordConfirm: pwConfirmRes === true ? '' : pwConfirmRes,
        };

        setErrors(newErrors); // 화면에 에러들 한꺼번에 띄우기

        // 3. 에러가 하나라도 있는지 확인
        const hasError = Object.values(newErrors).some(msg => msg !== '');
        if (hasError) {
            alert("입력 정보를 다시 확인해주세요.");
            return; // 저장 중단!
        }

        if(mode === 'UPDATE'){
            if (confirm("수정 하시겠습니까?")) {
                try {
                    const param = {
                        userNm: formData.userNm,
                        pswd: formData.password, // 검증 완료된 안전한 비밀번호 복사
                        deptId: formData.userDeptId,
                        email: formData.email,
                        telNum: formData.telNum,
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
                        pswd: formData.password,
                        deptId: formData.userDeptId,
                        email: formData.email,
                        telNum: formData.telNum,
                        sttsCd: formData.sttsCd,
                        sareaIds: formData.sareaIds
                    };

                    await api.post(`/admin/user/register`, param);
                    alert("등록이 완료되었습니다.");
                    onRefreshList();
                    onClose();
                } catch (error) {
                    console.error("등록 실패:", error);
                    alert("등록에 실패했습니다.")
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

        const fetchUserDetail = async () => {
                try {
                    const response = await api.get(`/admin/user/detail/${data.userId}`);
                    setUserDetail(null);
                    setUserDetail(response.data);
                } catch (error) {
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
        fetchUserType();
        fetchHierarchyZones();

        if (mode === 'UPDATE' && data?.userId) {
            fetchUserDetail();
        } else {
            setUserDetail(null);
        }

    }, [isOpen, data, mode]);

    useEffect(() => {
      //  console.log("실제로 바뀐 userType 데이터:", userType);
      //   console.log("실제로 바뀐 pmCompanyList 데이터:", pmCompanyList);
       //  console.log("실제로 바뀐 formData 데이터:", formData);
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
                        loadBzenDeptList(userDetail.userBzentyId);
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
                loadDeptList('DPTY01'); // 기본값 관리자 부서 목록 호출
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [userDetail, mode, loadDeptList, loadCompanyList, loadBzenDeptList]);

    // 3. 인풋 값 핸들러
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData((prev: any) => ({ ...prev, [name]: value }));

        //필드별 유효성 검사
        let errMsg = '';

        if (name === "userId") {
            setIsIdChecked(false); // ID가 바뀌면 중복확인 리셋
            const result = validateFields.userId(value);
            errMsg = result === true ? '' : result; // true면 통과(''), 아니면 에러 메시지
        }
        else if (name === "userNm") {
            const result = validateFields.userName(value);
            errMsg = result === true ? '' : result;
        }
        else if (name === "email") {
            const result = validateFields.email(value);
            errMsg = result === true ? '' : result;
        }
        else if (name === "telNum") {
            const result = validateFields.phoneNumber(value);
            errMsg = result === true ? '' : result;
        }
        else if (name === "password") {
            const result = validateFields.password(value);
            errMsg = result === true ? '' : result;

            // 비밀번호를 수정할 때 확인 칸도 다시 비교해주는 센스!
            if (formData.passwordConfirm && value !== formData.passwordConfirm) {
                setErrors(prev => ({ ...prev, passwordConfirm: '비밀번호가 일치하지 않습니다.' }));
            } else {
                setErrors(prev => ({ ...prev, passwordConfirm: '' }));
            }
        }
        else if (name === "passwordConfirm") {
            errMsg = value === formData.password ? '' : '비밀번호가 일치하지 않습니다.';
        }

        // 검사한 필드라면 errors 상태를 업데이트합니다.
        if (["userId", "userNm", "password", "passwordConfirm", "email", "telNum"].includes(name)) {
            setErrors(prev => ({ ...prev, [name]: errMsg }));
        }


        // 아이디 입력칸의 글자가 하나라도 바뀌면 중복확인 상태를 초기화
        if (name === "userId") {
            setIsIdChecked(false);
        }
        // 사용자 종류(userTypeCd)가 변경된 경우
        if (name === "userTypeCd") {
            setBzenDeptlist([]);
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
                        loadBzenDeptList(firstCompanyId);
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
            loadBzenDeptList(value);
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

    // 사용자 종류 or 회사 변경시 디폴트 부서 아이디 자동 매핑
    useEffect(() => {
        // 1. 사용자 종류에 따라 검사할 타겟 리스트를 동적으로 결정합니다.
        const isManager = ["DPTY01", "DPTY02"].includes(formData?.userTypeCd);
        const targetList = isManager ? deptlist : bzenDeptlist;

        // 2. 타겟 리스트에 데이터가 존재할 때만 검사를 수행합니다.
        if (targetList && targetList.length > 0) {
            // 현재 폼 데이터의 부서 ID가 타겟 목록에 존재하는지 확인
            const hasValidDept = targetList.some((dept: any) => dept.deptId === formData?.userDeptId);

            // 존재하지 않거나 비어있다면, 타겟 리스트의 첫 번째 부서 ID를 강제로 꽂아줍니다!
            if (!hasValidDept) {
                setFormData((prev: any) => ({
                    ...prev,
                    userDeptId: targetList[0].deptId
                }));
            }
        }
    }, [deptlist, bzenDeptlist, formData?.userTypeCd]);

    //등록시 최로 권역 리스트 모두 선택 처리
    useEffect(() => {
        // 1. 등록(CREATE) 모드이면서 권역 리스트가 성공적으로 불러와졌을 때만 작동
        if ( regionList && regionList.length > 0) {

            // 2. 사용자 종류가 관리자/운영자(DPTY01, 02)가 아닐 때 (즉, PM사/견인사일 때)
            if (!["DPTY01", "DPTY02"].includes(formData?.userTypeCd)) {

                // regionList에서 sareaId 값만 싹 다 뽑아내어 문자열 배열로 만듭니다.
                const allRegionIds = regionList.map((region: any) => String(region.sareaId));

                // formData의 sareaIds에 전체 ID 배열을 강제로 세팅
                setFormData((prev: any) => ({
                    ...prev,
                    sareaIds: allRegionIds
                }));

            } else {
                // 3. 만약 사용자가 PM사를 눌렀다가 다시 '관리자'로 변경했다면 권역 체크를 깔끔하게 비워줍니다.
                setFormData((prev: any) => ({
                    ...prev,
                    sareaIds: []
                }));
            }
        }
    }, [formData?.userTypeCd, regionList, mode]);

    return(
    <div className="popupWrap">
        <div className="popupInner">
            <div className="popup popup_manager" ref={popupRef}
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
                                {/* 인풋과 버튼을 나란히 두기 위해 div로 살짝 묶어줍니다 (기존 CSS에 따라 div는 빼셔도 무방합니다) */}
                                <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                                    <input
                                        type="text"
                                        name="userId"
                                        value={formData?.userId || ''} // 🎯 1. undefined 경고 방지용 || '' 추가
                                        onChange={handleChange}
                                        className="menager_id"
                                        disabled={mode === 'UPDATE'} // 🎯 2. 수정(UPDATE) 모드일 때는 아이디를 못 바꾸게 잠금
                                        maxLength={20} // 🎯 3. 만들어둔 유효성 검사 함수 규칙에 맞춰 물리적으로 20자까지만 입력되게 차단
                                    />
                                    {mode === 'CREATE' && (
                                        <button
                                            className="duplicate"
                                            type="button"
                                            onClick={handleIdCheck}
                                        >
                                            중복확인
                                        </button>
                                    )}
                                </div>
                                {errors.userId && (
                                    <p style={errorStyle}>
                                        {errors.userId}
                                    </p>
                                )}
                                {mode === 'CREATE' && isIdChecked && !errors.userId && (
                                    <p style={{
                                        color: '#1890ff',
                                        fontSize: '12px',
                                        marginTop: '4px',
                                        marginBlockEnd: 0
                                    }}>
                                        ✓ 사용 가능한 아이디입니다.
                                    </p>
                                )}
                            </td>
                        </tr>
                        <tr>
                            <th>이름</th>
                            <td>
                                <input
                                    type="text"
                                    name="userNm"
                                    value={formData?.userNm || ''}
                                    onChange={handleChange}
                                    maxLength={50}
                                />
                                {errors.userNm && (
                                    <p style={errorStyle}>
                                        {errors.userNm}
                                    </p>
                                )}
                            </td>
                        </tr>
                        <tr>
                            <th>연락처</th>
                            <td>
                                <input
                                    type="text"
                                    name="telNum"
                                    placeholder="'-'을 포함해 주세요"
                                    value={formData?.telNum || ''}
                                    onChange={handleChange}
                                />
                                {/*{errors.telNum && (*/}
                                {/*    <p style={errorStyle}>*/}
                                {/*        {errors.telNum}*/}
                                {/*    </p>*/}
                                {/*)}*/}
                            </td>
                        </tr>
                        <tr>
                            <th>이메일</th>
                            <td>
                                <input
                                    type="text"
                                    name="email"
                                    value={formData?.email || ''}
                                    onChange={handleChange}
                                />
                                {/*{errors.email && (*/}
                                {/*    <p style={errorStyle}>*/}
                                {/*        {errors.email}*/}
                                {/*    </p>*/}
                                {/*)}*/}
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
                                {errors.password && (
                                    <p style={errorStyle}>
                                        {errors.password}
                                    </p>
                                )}
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
                                    <p style={errorStyle}>
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
                                        {mode=='CREATE'&&!formData?.userDeptId && (
                                            <option value="">부서를 선택하세요</option>
                                        )}
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
                                            {mode=='CREATE'&&!formData?.userDeptId && (
                                                <option value="">부서를 선택하세요</option>
                                            )}
                                            {/*<option value="">부서를 선택하세요</option>*/}
                                            {bzenDeptlist && bzenDeptlist.length > 0 && (
                                                bzenDeptlist.map((dept: any) => (
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
                                    name="sttsCd"
                                    value={formData?.sttsCd}
                                    onChange={handleChange}
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