import { useState, useEffect, useCallback } from 'react';
import api from "@/services/api";
import { getSystemHierarchyApi } from "@/services/system/systemApi";
import { getRegisterRoleApi } from "@/services/register/registerApi";
import { registerMenuLog } from "@/services/common/commonApi";
import { validateFields } from "@/utils/validation";
import { getAdminDeptList, getBzenDeptList, updateAdminUser, createAdminUser } from "@/services/management/adminMangeMent";
import { AdminDeptListResponse } from "@/types/managment";
import { roleResponse } from "@/types/regiser";

interface UseManagerFormProps {
    isOpen: boolean;
    data: any | null;
    mode: 'CREATE' | 'UPDATE';
    onClose: () => void;
    onRefreshList: () => void;
}
// 폼 기본 데이터
const INITIAL_FORM_DATA = {
    userId: '', userNm: '', email: '', telNum: '',
    password: '', passwordConfirm: '',
    userTypeCd: 'DPTY01', userTypeNm: '관리자',
    userDeptId: '', userBzentyId: '', sttsCd: 'USTS02', sareaIds: []
};

export function useManagerForm({ isOpen, data, mode, onClose, onRefreshList }: UseManagerFormProps) {
    const [userDetail, setUserDetail] = useState<any | null>(null);
    const [userType, setUserType] = useState<roleResponse[]>([]);
    const [Company, setCompanyList] = useState<any[]>([]);
    const [isIdChecked, setIsIdChecked] = useState(false);
    const [bzenDeptlist, setBzenDeptlist] = useState<any[]>([]);
    const [deptlist, setDeptList] = useState<AdminDeptListResponse[]>([]);
    const [regionList, setRegionList] = useState<any[]>([]);

    const [errors, setErrors] = useState({
        userId: '',
        userNm: '',
        telNum: '',
        email:'',
        password: '',
        passwordConfirm: ''
    });

    const [formData, setFormData] = useState<any>({
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

    // 운영자, 관리자 부서 리스트 조회
    const loadDeptList = useCallback(async (typeCd: string) => {
        if (!typeCd || !["DPTY01", "DPTY02"].includes(typeCd)) {
            setDeptList([]);
            return [];
        }
        try {
            const resData = await getAdminDeptList(typeCd);
            setDeptList(resData || []);
            return resData || [];
        } catch (error) {
            console.error("(운영자,관리자)부서 리스트 로드 실패:", error);
            return [];
        }
    }, []);

    // PM, 견인 업체 리스트 조회
    const loadCompanyList = useCallback(async (typeCd: string) => {
        if (!typeCd || ["DPTY01", "DPTY02"].includes(typeCd)) {
            setCompanyList([]);
            return [];
        }
        try {
            let response = null;
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
            return [];
        }
    }, []);

    // PM, 견인 업체별 부서 리스트 조회
    const loadBzenDeptList = useCallback(async (bzentyId: string) => {
        if (!bzentyId) {
            setBzenDeptlist([]);
            return [];
        }
        try {
            const response = await getBzenDeptList(bzentyId);
            setBzenDeptlist(response || []);
            return response || [];
        } catch (error) {
            console.error("업체 부서 리스트 로드 실패:", error);
            setBzenDeptlist([]);
            return [];
        }
    }, []);

    // 아이디 중복체크
    const handleIdCheck = async () => {
        const userId = formData.userId;
        if (!userId || userId.trim() === "") {
            alert("아이디를 입력해 주세요.");
            return;
        }
        try {
            await api.get('/admin/user/check-id', { params: { userId } });
            alert("사용 가능한 아이디입니다.");
            setIsIdChecked(true);
        } catch (error) {
            alert("이미 사용 중이거나 사용할 수 없는 아이디입니다.");
            setIsIdChecked(false);
        }
    };

    // 저장 / 수정 처리
    const handleSave = async () => {
        if (mode === 'CREATE' && !isIdChecked) {
            alert("아이디 중복확인을 진행해 주세요.");
            return;
        }
        if (formData.userDeptId === '') {
            alert("부서를 선택해 주세요.");
            return;
        }

        const idRes = validateFields.userId(formData.userId);
        const nmRes = validateFields.userName(formData.userNm);
        const telRes = formData.telNum ? validateFields.phoneNumber(formData.telNum) : true;
        const emailRes = formData.email ? validateFields.email(formData.email) : true;

        const newErrors = {
            userId: idRes === true ? '' : idRes,
            userNm: nmRes === true ? '' : nmRes,
            telNum: telRes === true ? '' : telRes,
            email: emailRes === true ? '' : emailRes,
            password: '',
            passwordConfirm: '',
        };

        setErrors(newErrors);

        const hasError = Object.values(newErrors).some(msg => msg !== '');
        if (hasError) {
            alert("입력 정보를 다시 확인해주세요.");
            return;
        }

        const param = {
            userNm: formData.userNm,
            pswd: formData.password,
            deptId: formData.userDeptId,
            email: formData.email,
            telNum: formData.telNum,
            sttsCd: formData.sttsCd,
            sareaIds: formData.sareaIds
        };

        try {
            if (mode === 'UPDATE') {
                if (confirm("수정 하시겠습니까?")) {
                    await updateAdminUser(formData.userId, param);
                    alert("수정이 완료되었습니다.");
                    onRefreshList();
                    handleClosePopup();
                }
            } else if (mode === 'CREATE') {
                if (confirm("저장 하시겠습니까?")) {
                    const createParam = { userId: formData.userId, ...param };
                    await createAdminUser(createParam);
                    alert("등록이 완료되었습니다.");
                    onRefreshList();
                    handleClosePopup();
                }
            }
        } catch (error) {
            console.error(`${mode} 처리 실패:`, error);
            alert("요청 처리에 실패했습니다.");
        }
    };

    // 인풋 값 핸들러
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));

        let errMsg = '';
        if (name === "userId") {
            setIsIdChecked(false);
            const result = validateFields.userId(value);
            errMsg = result === true ? '' : result;
        } else if (name === "userNm") {
            const result = validateFields.userName(value);
            errMsg = result === true ? '' : result;
        } else if (name === "email") {
            if (value.trim() === "") {
                errMsg = '';
            } else {
                const result = validateFields.email(value);
                errMsg = result === true ? '' : result;
            }
        } else if (name === "telNum") {
            if (value.trim() === "") {
                errMsg = '';
            } else {
                const result = validateFields.phoneNumber(value);
                errMsg = result === true ? '' : result;
            }
        } else if (name === "password") {
            const result = validateFields.password(value);
            errMsg = result === true ? '' : result;
        } else if (name === "passwordConfirm") {
            errMsg = value === formData.password ? '' : '비밀번호가 일치하지 않습니다.';
        }

        if (["userId", "userNm", "password", "passwordConfirm", "email", "telNum"].includes(name)) {
            setErrors(prev => ({ ...prev, [name]: errMsg }));
        }

        // 사용자 종류(userTypeCd)가 변경된 경우 연쇄 호출
        if (name === "userTypeCd") {
            setBzenDeptlist([]);
            setDeptList([]);

            if (value === "DPTY01" || value === "DPTY02") { // 관리자or운영자
                const fetchAndSetDept = async () => {
                    const fetchedDepts = await loadDeptList(value);
                    setFormData((prev: any) => ({
                        ...prev,
                        userTypeCd: value,
                        userBzentyId: "",
                        // 리스트가 있으면 첫 번째 부서를, 없으면 빈 값을 넣음 (자동 매핑!)
                        userDeptId: fetchedDepts.length > 0 ? fetchedDepts[0].deptId : "",
                        sareaIds: []
                    }));
                };
                fetchAndSetDept();
            } else { //견인TOW or PM
                const fetchAndSelectFirstCompany = async () => {
                    const compList = await loadCompanyList(value);

                    if (compList && compList.length > 0) {
                        const firstCompanyId = compList[0].bzentyId;

                        const fetchedBzenDepts = await loadBzenDeptList(firstCompanyId);

                        setFormData((prev: any) => {
                            //  CREATE 모드일 때만 전체 권역을 가져오고, UPDATE일 땐 기존 값을 지킵니다.
                            const nextSareaIds = mode === 'CREATE'
                                ? regionList.map((region: any) => String(region.sareaId))
                                : prev.sareaIds;

                            return {
                                ...prev,
                                userTypeCd: value,
                                userBzentyId: firstCompanyId,
                                userDeptId: fetchedBzenDepts.length > 0 ? fetchedBzenDepts[0].deptId : "",
                                sareaIds: nextSareaIds // 분기된 값 적용
                            };
                        });
                        loadBzenDeptList(firstCompanyId);
                    } else {    // 등록 모드 일시 권역 모두 체크
                        setFormData((prev: any) => {
                            const nextSareaIds = mode === 'CREATE'
                                ? regionList.map((region: any) => String(region.sareaId))
                                : prev.sareaIds;

                            return {
                                ...prev,
                                userTypeCd: value,
                                userBzentyId: "",
                                userDeptId: "",
                                sareaIds: nextSareaIds
                            };
                        });
                    }
                };
                fetchAndSelectFirstCompany();
            }
        }
        if (name === "userBzentyId") {
            const fetchAndSetBzenDept = async () => {
                const fetchedBzenDepts = await loadBzenDeptList(value);
                setFormData((prev: any) => ({
                    ...prev,
                    userBzentyId: value,
                    // 회사 변경 시 해당 회사의 첫 번째 부서로 자동 셋업
                    userDeptId: fetchedBzenDepts.length > 0 ? fetchedBzenDepts[0].deptId : ""
                }));
            };
            fetchAndSetBzenDept();
        }
    }

    const handleClosePopup = () => {
        setUserDetail(null);
        setFormData(INITIAL_FORM_DATA);
        setIsIdChecked(false);
        setErrors({ userId: '', userNm: '',  telNum: '',email:'',password: '', passwordConfirm: '' });

        onClose();
    };

    // 권역 체크박스 핸들러
    const handleCheckboxChange = (sareaId: string, checked: boolean) => {
        setFormData((prev: any) => {
            const currentIds = prev.sareaIds || [];
            const nextIds = checked
                ? [...currentIds, String(sareaId)]
                : currentIds.filter((id: string) => id !== String(sareaId));
            return { ...prev, sareaIds: nextIds };
        });
    };

    // 팝업 생명주기 및 초기화 로직
    useEffect(() => {
        if (!isOpen) return;
        if (mode === 'UPDATE' && !data?.userId) return;

        const fetchData = async () => {
            try {
                if (mode === 'UPDATE' && data?.userId) {
                    // 권역, 유저타입, 유저 상세정보
                    const [zoneRes, roleRes, detailRes] = await Promise.all([
                        getSystemHierarchyApi(),
                        getRegisterRoleApi(),
                        api.get(`/admin/user/detail/${data.userId}`)
                    ]);

                    const allZones = zoneRes.data?.data || zoneRes || [];
                    setRegionList(allZones.filter((item: any) => !item.upSarea?.sareaId));
                    setUserType(roleRes);

                    const fetchedDetail = detailRes.data;
                    const type = fetchedDetail.userTypeCd;
                    const companyId = fetchedDetail.userBzentyId;

                    if (type === "DPTY01" || type === "DPTY02") {
                        await loadDeptList(type);
                    } else {
                        await Promise.all([
                            loadCompanyList(type),
                            companyId ? loadBzenDeptList(companyId) : Promise.resolve([])
                        ]);
                    }

                    const checkedIds = (fetchedDetail.zoneList || [])
                        .filter((zone: any) => zone.assigned === true)
                        .map((zone: any) => String(zone.sareaId));

                    setUserDetail(fetchedDetail);
                    setFormData({
                        userId: fetchedDetail.userId || '',
                        userNm: fetchedDetail.userNm || '',
                        email: fetchedDetail.userEail,
                        telNum: fetchedDetail.telNo,
                        password: '',
                        passwordConfirm: '',
                        userTypeNm: fetchedDetail.userTypeNm || '관리자',
                        userTypeCd: fetchedDetail.userTypeCd,
                        userDeptId: fetchedDetail.userDeptId,
                        sareaIds: checkedIds,
                        sttsCd: fetchedDetail.sttsCd,
                        userBzentyId: companyId || '',
                    });

                } else { // 등록모드 : 공통권역, 사용자 종류 리스트 , 기본 관리자 부서 리스트
                    const [zoneRes, roleRes, fetchedDepts] = await Promise.all([
                        getSystemHierarchyApi(),
                        getRegisterRoleApi(),
                        loadDeptList('DPTY01')
                    ]);

                    const allZones = zoneRes.data?.data || zoneRes || [];
                    setRegionList(allZones.filter((item: any) => !item.upSarea?.sareaId));
                    setUserType(roleRes);

                    if (fetchedDepts && fetchedDepts.length > 0) {
                        setFormData((prev: any) => ({
                            ...prev,
                            userDeptId: fetchedDepts[0].deptId
                        }));
                    }
                }
            } catch (error) {
                console.error("초기 마스터 데이터 로드 실패:", error);
            }
        };

        fetchData();
        registerMenuLog("OPR5200").catch(err => console.error("메뉴 이력 적재 실패:", err));
    }, [isOpen, data, mode, loadDeptList, loadCompanyList, loadBzenDeptList]);

    return {
        formData,
        errors,
        userType,
        Company,
        bzenDeptlist,
        deptlist,
        regionList,
        isIdChecked,
        handleChange,
        handleIdCheck,
        handleSave,
        handleCheckboxChange,
        handleClosePopup
    };
}