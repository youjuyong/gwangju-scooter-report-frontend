"use client";

import React, {useContext, useEffect, useState} from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ExcelDownload from "@/components/admin/ExcelDownload";
import { ExcelContext } from '@/components/admin/ExcelContext';

export default function PointPage() {
    const pathname = usePathname();
    const userRole = "admin";

    // 1. 왼쪽 서브 내비게이션 메뉴 데이터 정의
    const subNavItems = [
        { id: 'pm', name: 'PM업체관리', path: `/${userRole}/pm` },
        { id: 'point', name: '배치포인트관리', path: `/${userRole}/point` },
        { id: 'zone', name: '권역관리', path: `/${userRole}/zone` },
        { id: 'code', name: '권역코드관리', path: `/${userRole}/code` },
        { id: 'setting', name: '운영설정관리', path: `/${userRole}/seting` },
    ];

    // 2. 배치포인트 레이어 팝업 관련 상태 관리
    const [isPopupOpen, setIsPopupOpen] = useState(true); // 퍼블리싱 확인을 위해 기본값 true 설정
    const [pmCompany, setPmCompany] = useState('지쿠');
    const [pointName, setPointName] = useState('');
    const [coordinates, setCoordinates] = useState('37.555277 , 127.045416');
    //엑셀 다운로드
    const {setGrid, setFileName}: any = useContext(ExcelContext);

    // //엑셀 다운로드
    // useEffect(() => {
    //     if (pmGridRef.current) {
    //         setGrid(pmGridRef.current);
    //         setFileName("배치포인트관리");
    //     }
    // }, [gridData, setGrid, setFileName]);

    // 3. 상단 기능 버튼 이벤트 핸들러
    const handleCreate = () => {
        console.log('등록 버튼 클릭');
        setIsPopupOpen(true);
    };

    const handleUpdate = () => {
        console.log('수정 버튼 클릭');
    };

    const handleDelete = () => {
        console.log('삭제 버튼 클릭');
    };

    const handleExcelDownload = () => {
        console.log('배치포인트 엑셀저장 클릭');
    };

    // 4. 팝업 내부 저장/취소 이벤트 핸들러
    const handlePopupSave = () => {
        console.log('팝업 저장:', { coordinates, pmCompany, pointName });
        // 카카오 지도 API 포인트 등록 로직 연동 지점
        setIsPopupOpen(false);
    };

    const handlePopupCancel = () => {
        setIsPopupOpen(false);
    };

    return (
        <div className="wrap point_wrap">
            {/* 왼쪽 서브 네비게이션 영역 */}
            <div className="subnav">
                <nav>
                    <ul>
                        {subNavItems.map((item) => {
                            // 현재 URL 주소가 설정된 메뉴의 path와 일치하면 'click' 클래스 부여
                            const isSubActive = pathname === item.path;
                            return (
                                <li key={item.id} className={isSubActive ? 'click' : ''}>
                                    <Link href={item.path}>
                                        {item.name}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>

            {/* 오른쪽 서브 아티클 영역 */}
            <div className="subarticle">
                {/* 검색 및 상단 제어 버튼 영역 */}
                <div className="searchBox">
                    <div className="btnSet">
                        <button onClick={handleCreate}>+ 등록</button>
                        <button onClick={handleUpdate}>수정</button>
                        <button onClick={handleDelete}>삭제</button>
                    </div>
                    <ExcelDownload></ExcelDownload>
                    {/*<button className="btnExcel" onClick={handleExcelDownload}>엑셀저장</button>*/}
                </div>

                {/* 본문 컨텐츠 영역 (그리드 + 지도) */}
                <div className="infoContent">

                    {/* 데이터 그리드 구역 */}
                    <div className="gridbox">
                        <div>그리드(그리드내부스크롤, 창 사이즈에 따라 실시간으로 사이즈 변하게)</div>
                    </div>

                    {/* 배치포인트 지도 및 팝업 구역 */}
                    <div className="point_map">

                        {/* 레이어 팝업 구역: 상태값에 따라 노출/숨김 처리 */}
                        {isPopupOpen && (
                            /* 요구사항: 마우스 클릭한 지점에 위치할 수 있도록 추후 카카오 지도 이벤트 커스텀 필요 */
                            <div className="popup popup_point">
                                <h3>배치포인트<span>[범위:50M]</span></h3>
                                <button className="popupClose" onClick={handlePopupCancel}>닫기</button>
                                <div className="popupconten">

                                    <table>
                                        <tbody>
                                        <tr>
                                            <th>좌표</th>
                                            <td>{coordinates}</td>
                                        </tr>
                                        <tr>
                                            <th>PM사</th>
                                            <td>
                                                <select
                                                    value={pmCompany}
                                                    onChange={(e) => setPmCompany(e.target.value)}
                                                >
                                                    <option value="지쿠">지쿠</option>
                                                    <option value="스윙">스윙</option>
                                                </select>
                                            </td>
                                        </tr>
                                        <tr>
                                            <th>배치포인트명</th>
                                            <td>
                                                <input
                                                    type="text"
                                                    value={pointName}
                                                    onChange={(e) => setPointName(e.target.value)}
                                                />
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>

                                    {/* 팝업 내부 하단 제어 버튼 그룹 */}
                                    <div className="btnSet">
                                        <button onClick={handlePopupCancel}>취소</button>
                                        <button className="red" onClick={handlePopupSave}>저장</button>
                                    </div>
                                </div>
                                <img src="./images/popup_arrow.png" className="poparrow" alt="화살표"/>
                            </div>
                        )}
                        {/* ./팝업 끝 */}

                        {/* 실제 지도가 바인딩될 구역 */}
                        <div className="map">
                            지도 나올 곳
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}