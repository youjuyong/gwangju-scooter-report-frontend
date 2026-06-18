"use client";

import React, {useEffect, useState} from 'react';
import {useDrag} from "@/hooks/userDrag";
import api from "@/services/api";
import {getSystemHierarchyApi} from "@/services/system/systemApi";

interface PmCompany {
    bzentyId: string;
    bzentyNm: string;
}

interface ManagerDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
   // onRefreshList: () => void;
    data: any | null;
    mode : 'CREATE' | 'UPDATE';
   // isDashBoard?: boolean;
}
export default function MangerPopup({isOpen,onClose,data,mode}:ManagerDetailModalProps){
    const [pmCompanyList, setPmCompanyList] = useState<PmCompany[]>([]);
    const {position, handleMouseDown, isDragging} = useDrag(isOpen); // 팝업 드래그
    const [formData, setFormData] = useState<any>({
        id: '',
        name: '',
        password: '',
        passwordConfirm: '',
        userType: '관리자',
        pmCompany: '-',
        isUse: '사용',
        regions: [] as string[] // 담당권역 체크박스용 배열
    });

    useEffect(()=>{
        console.log(data);
        if(mode === 'UPDATE'){
            if (!isOpen || !data.userId) return;
        }else{
            if (!isOpen) return;
        }

        const fetchPmCompanies = async () => {
            try {
                const response = await api.get('/pm/pm-companies');
                const data = response.data;
                setPmCompanyList(data);
                console.log(pmCompanyList);
            } catch (error) {
                console.error("PM사 목록 로드 실패:", error);
            }
        };

        //TODO 담당권역 불러오는 api 추가
       const fetchHierarchyZones = async ()=>{
           try{
             const response =  await getSystemHierarchyApi();
             console.log(response);
           }catch (error){
               console.error("권역 데이터 로드 실패:", error);
           }

       }
        fetchPmCompanies();
        fetchHierarchyZones();
    },[])

    useEffect(() => {
        console.log(data)
        const timer = setTimeout(() => {
            if (mode === 'UPDATE' && data) {
                setFormData({
                    id: data.userId || '',
                    name: data.userNm || '',
                    password: '',
                    passwordConfirm: '',
                    userType: data.deptTypeNm || '관리자',
                    pmCompany: data.deptNm || '-',
                    isUse: data.isUse || '사용',
                    regions: data.regions || []
                });
                console.log(formData);
            } else {
                setFormData({
                    id: '', name: '', password: '', passwordConfirm: '',
                    userType: '관리자', pmCompany: '-', isUse: '사용', regions: []
                });
            }
        }, 0);
        return () => clearTimeout(timer); // 메모리 누수 방지 리턴
    }, [mode, data?.userId]);
    // 3. 인풋 값 핸들러
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    // 4. 권역 체크박스 전용 핸들러
    const handleCheckboxChange = (regionName: string, checked: boolean) => {
        setFormData((prev:any) => {
            const nextRegions = checked
                ? [...prev.regions, regionName]
                : prev.regions.filter((r:any) => r !== regionName);
            return { ...prev, regions: nextRegions };
        });
    };

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
                                    name="id"
                                    value={formData.id}
                                    onChange={handleChange}
                                    disabled={mode !== 'UPDATE'}
                                />
                            </td>
                        </tr>
                        <tr>
                            <th>이름</th>
                            <td>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </td>
                        </tr>
                        <tr>
                            <th>비밀번호</th>
                            <td>
                                <input type="text"/>
                            </td>
                        </tr>
                        <tr>
                            <th>비밀번호확인</th>
                            <td>
                                <input type="text"/>
                            </td>
                        </tr>
                        <tr>
                            <th>사용자 종류</th>
                            <td>
                                <select name="userType" value={formData.userType} onChange={handleChange}>
                                    <option value="관리자">관리자</option>
                                    <option value="지역담당자">지역담당자</option>
                                    <option value="PM사">PM사</option>
                                    <option value="견인사">견인업체</option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <th>PM사</th>
                            <td>
                                {formData.userType === 'PM사' ? (
                                    /* 🎯 PM사일 때: 수정 모드면 비활성화(disabled), 등록 모드면 활성화 */
                                    <select
                                        name="pmCompany"
                                        value={formData.pmCompany}
                                        onChange={handleChange}
                                        disabled={mode !== 'UPDATE'}
                                    >{pmCompanyList.length === 0 ? (
                                        <option value="">등록된 PM사 없음</option>
                                    ) : (
                                        pmCompanyList.map((company) => (
                                            <option key={company.bzentyId} value={company.bzentyId}>
                                                {company.bzentyNm}
                                            </option>
                                        ))
                                    )}
                                    </select>
                                ) : (
                                    <select disabled value="-">
                                        <option value="-">-</option>
                                    </select>
                                )}
                            </td>
                        </tr>
                        <tr>
                            <th>사용여부</th>
                            <td>
                                <select>
                                    <option>사용</option>
                                    <option>사용안함</option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <th>담당권역</th>
                            <td style={{padding: '10px 0px'}}>
                                <label><input type="checkbox"/> 경안동</label>
                                <label><input type="checkbox"/> 능평동</label>
                                <label><input type="checkbox"/> 오포1동</label>
                                <label><input type="checkbox"/> 곤지암읍</label>
                                <label><input type="checkbox"/> 도척면</label>
                                <label><input type="checkbox"/> 오포2동</label>
                                <label><input type="checkbox"/> 광남1동</label>
                                <label><input type="checkbox"/> 송정동</label>
                                <label><input type="checkbox"/> 초월읍</label>
                                <label><input type="checkbox"/> 광남2동</label>
                                <label><input type="checkbox"/> 신현동</label>
                                <label><input type="checkbox"/> 탄벌동</label>
                                <label><input type="checkbox"/> 남종면</label>
                                <label><input type="checkbox"/> 쌍령동</label>
                                <label><input type="checkbox"/> 퇴촌면</label>
                                <label><input type="checkbox"/> 남한산성면</label>
                            </td>
                        </tr>
                        </tbody>
                    </table>

                    <div className="btnSet">
                        <button>취소</button>
                        <button className="red">저장</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    )
}