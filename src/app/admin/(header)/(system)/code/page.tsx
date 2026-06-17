"use client";

import React, { useState, useMemo, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

// 라온텍 그리드 라이브러리 임포트
import { RaontecGridHandle, RaontecTanstackGrid, CustomColumnDef } from "@rxjacx/raontec-grid";

// 데이터 인터페이스 정의
export interface ZoneCodeData {
    codeId: string;
    commonCode: string;
    hangulNm: string;
    englishNm: string;
    codeAbbr: string;
    attribute1: string;
    attribute2: string;
    note: string;
    useYn: string;
}

// 로딩 오버레이 더미 컴포넌트 (필요 시 실제 컴포넌트로 대체 가능)
function LoadingOverlay({ message }: { message: string }) {
    return (
        <div className="loadingOverlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, color: '#fff' }}>
            <div>{message}</div>
        </div>
    );
}

export default function ZoneCodePage() {
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(false); // 로딩 상태 제어용

    // 서브 내비게이션 아이템 정의 (사용자 역할 'admin' 기준 예시 주소)
    const subNavItems = [
        { id: 'pm', name: 'PM업체관리', path: '/admin/pm' },
        { id: 'point', name: '배치포인트관리', path: '/admin/point' },
        { id: 'zone', name: '권역관리', path: '/admin/zone' },
        { id: 'code', name: '권역코드관리', path: '/admin/code' }, // 현재 페이지 예시 경로
        { id: 'setting', name: '운영설정관리', path: '/admin/seting' },
    ];

    // 가상 데이터 상태
    const [gridData, setGridData] = useState<ZoneCodeData[]>([
        { codeId: "123456", commonCode: "Z001", hangulNm: "광주동구", englishNm: "Gwangju-Donggu", codeAbbr: "GJ_DG", attribute1: "VAL1", attribute2: "REG01", note: "특수권역", useYn: "사용" },
        { codeId: "123457", commonCode: "Z002", hangulNm: "광주서구", englishNm: "Gwangju-Seogu", codeAbbr: "GJ_SG", attribute1: "VAL2", attribute2: "REG02", note: "일반권역", useYn: "사용" },
        { codeId: "123458", commonCode: "Z003", hangulNm: "광주남구", englishNm: "Gwangju-Namgu", codeAbbr: "GJ_NG", attribute1: "VAL1", attribute2: "REG03", note: "제한구역", useYn: "사용안함" },
    ]);

    const [checkedRows, setCheckedRows] = useState<ZoneCodeData[]>([]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [appliedKeyword, setAppliedKeyword] = useState('');

    // 팝업 상태 및 입력 필드
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [popupMode, setPopupMode] = useState<'create' | 'update'>('create');

    const [inputCodeId, setInputCodeId] = useState('');
    const [inputCommonCode, setInputCommonCode] = useState('');
    const [inputHangulNm, setInputHangulNm] = useState('');
    const [inputEnglishNm, setInputEnglishNm] = useState('');
    const [inputCodeAbbr, setInputCodeAbbr] = useState('');
    const [inputAttribute1, setInputAttribute1] = useState('');
    const [inputAttribute2, setInputAttribute2] = useState('');
    const [inputNote, setInputNote] = useState('');
    const [selectUseYn, setSelectUseYn] = useState('사용');

    const zoneGridRef = useRef<RaontecGridHandle>(null);

    // 그리드 컬럼 설정
    const zoneGridColumns = useMemo<CustomColumnDef<ZoneCodeData>[]>(() => [
        { header: '코드ID', accessorKey: 'codeId', meta: { id: 'codeId', isKey: true } },
        { header: '공통코드', accessorKey: 'commonCode' },
        { header: '한글명', accessorKey: 'hangulNm' },
        { header: '영문명', accessorKey: 'englishNm' },
        { header: '코드약어', accessorKey: 'codeAbbr' },
        { header: '속성1', accessorKey: 'attribute1' },
        { header: '속성2', accessorKey: 'attribute2'},
        { header: '비고', accessorKey: 'note' },
        { header: '사용여부', accessorKey: 'useYn' },
    ], []);

    const filteredGridData = useMemo(() => {
        if (!appliedKeyword) return gridData;
        return gridData.filter(item =>
            item.hangulNm.includes(appliedKeyword) ||
            item.commonCode.includes(appliedKeyword) ||
            String(item.codeId).includes(appliedKeyword)
        );
    }, [gridData, appliedKeyword]);

    const handleSearch = () => {
        setAppliedKeyword(searchKeyword);
    };

    const handleCreateOpen = () => {
        setPopupMode('create');
        setInputCodeId(String(Math.floor(100000 + Math.random() * 900000)));
        setInputCommonCode('');
        setInputHangulNm('');
        setInputEnglishNm('');
        setInputCodeAbbr('');
        setInputAttribute1('');
        setInputAttribute2('');
        setInputNote('');
        setSelectUseYn('사용');
        setIsPopupOpen(true);
    };

    const handleUpdateOpen = () => {
        if (checkedRows.length === 0) {
            alert("수정할 권역코드를 체크박스에서 선택해 주세요.");
            return;
        }
        if (checkedRows.length > 1) {
            alert("수정은 하나의 항목만 체크한 상태에서 가능합니다.");
            return;
        }

        const target = checkedRows[0];
        setPopupMode('update');
        setInputCodeId(String(target.codeId));
        setInputCommonCode(target.commonCode);
        setInputHangulNm(target.hangulNm);
        setInputEnglishNm(target.englishNm);
        setInputCodeAbbr(target.codeAbbr);
        setInputAttribute1(target.attribute1);
        setInputAttribute2(target.attribute2);
        setInputNote(target.note);
        setSelectUseYn(target.useYn);
        setIsPopupOpen(true);
    };

    const handleDelete = () => {
        if (checkedRows.length === 0) {
            alert("삭제할 대상을 체크박스에서 선택해 주세요.");
            return;
        }

        if (window.confirm(`선택한 ${checkedRows.length}개의 권역코드를 삭제하시겠습니까?`)) {
            const checkedIds = checkedRows.map(r => r.codeId);
            setGridData(prev => prev.filter(item => !checkedIds.includes(item.codeId)));

            setCheckedRows([]);
            zoneGridRef.current?.clearSelectedRow();
            zoneGridRef.current?.clearRowSelection();
            alert("삭제되었습니다.");
        }
    };

    const handlePopupSave = () => {
        if (!inputCommonCode.trim() || !inputHangulNm.trim()) {
            alert("공통코드와 한글명은 필수 입력 항목입니다.");
            return;
        }

        const newRow: ZoneCodeData = {
            codeId: inputCodeId,
            commonCode: inputCommonCode.trim(),
            hangulNm: inputHangulNm.trim(),
            englishNm: inputEnglishNm.trim(),
            codeAbbr: inputCodeAbbr.trim(),
            attribute1: inputAttribute1.trim(),
            attribute2: inputAttribute2.trim(),
            note: inputNote.trim(),
            useYn: selectUseYn
        };

        if (popupMode === 'create') {
            setGridData(prev => [...prev, newRow]);
            alert("등록되었습니다.");
        } else {
            setGridData(prev => prev.map(item => item.codeId === inputCodeId ? newRow : item));
            alert("수정되었습니다.");
        }

        setIsPopupOpen(false);
        setCheckedRows([]);
        zoneGridRef.current?.clearSelectedRow();
        zoneGridRef.current?.clearRowSelection();
    };

    return (
        /* 👑 요청하신 wrap 및 로딩, subnav 레이아웃 연동 처리부 */
        <div className="wrap">
            {isLoading && <LoadingOverlay message={"데이터 로딩 중..."} />}

            {/* 서브 내비게이션 바 영역 */}
            <div className="subnav">
                <nav>
                    <ul>
                        {subNavItems.map((item) => {
                            // 현재 URL 주소 세그먼트와 설정된 고유 메뉴 패스가 매치되면 'click' 클래스 활성화
                            const isSubActive = pathname === item.path || (item.id === 'code'); // 예시 코드로 code 강제 활성화 처리 포함
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

            {/* 메인 콘텐츠 영역 (퍼블리싱 원본 사양) */}
            <div className="subarticle">

                {/* 검색 조건 제어 상단 바 */}
                <div className="searchBox">
                    <div className="btnSet">
                        <button onClick={handleCreateOpen}>+ 등록</button>
                        <button onClick={handleUpdateOpen}>수정</button>
                        <button onClick={handleDelete}>삭제</button>
                    </div>

                    <div className="search_right search_right_Excel">
                        <dl>
                            <dt>검색어</dt>
                            <dd>
                                <input
                                    type="text"
                                    className="searchinput"
                                    placeholder="검색어 입력"
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    onKeyDown={(e) => { if(e.key === 'Enter') handleSearch(); }}
                                />
                            </dd>
                        </dl>
                        <button className="btnSearch" onClick={handleSearch}>검색</button>
                    </div>

                    <button className="btnExcel" onClick={() => alert("엑셀 저장을 수행합니다.")}>엑셀저장</button>
                </div>

                {/* 그리드박스 바인딩 구역 */}
                <div className="infoContent">
                    <div className="gridbox" style={{ width: '100%', height: 'calc(100vh - 260px)', overflow: 'hidden' }}>
                        <RaontecTanstackGrid
                            ref={zoneGridRef}
                            data={filteredGridData}
                            columns={zoneGridColumns}
                            rowHeight={45}
                            enableRowSelection={true}
                            onSelectionChange={(rows: ZoneCodeData[]) => setCheckedRows(rows)}
                        />
                    </div>
                </div>

            </div>

            {/* 등록 및 수정 팝업 구조 */}
            {isPopupOpen && (
                <div className="popupWrap">
                    <div className="popupInner">
                        <div className="popup popup_code">
                            <h3>권역코드</h3>
                            <button className="popupClose" onClick={() => setIsPopupOpen(false)}>닫기</button>
                            <div className="popupconten">

                                <table>
                                    <tbody>
                                    <tr>
                                        <th>코드ID</th>
                                        <td>
                                            <input type="text" value={inputCodeId} disabled  />
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>콩통코드</th>
                                        <td>
                                            <input type="text" value={inputCommonCode} onChange={(e) => setInputCommonCode(e.target.value)} />
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>한글명</th>
                                        <td>
                                            <input type="text" value={inputHangulNm} onChange={(e) => setInputHangulNm(e.target.value)} />
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>영문명</th>
                                        <td>
                                            <input type="text" value={inputEnglishNm} onChange={(e) => setInputEnglishNm(e.target.value)} />
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>약어</th>
                                        <td>
                                            <input type="text" value={inputCodeAbbr} onChange={(e) => setInputCodeAbbr(e.target.value)} />
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>속성1</th>
                                        <td>
                                            <input type="text" value={inputAttribute1} onChange={(e) => setInputAttribute1(e.target.value)} />
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>속성2</th>
                                        <td>
                                            <input type="text" value={inputAttribute2} onChange={(e) => setInputAttribute2(e.target.value)} />
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>비고</th>
                                        <td>
                                            <input type="text" value={inputNote} onChange={(e) => setInputNote(e.target.value)} />
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>사용여부</th>
                                        <td>
                                            <select value={selectUseYn} onChange={(e) => setSelectUseYn(e.target.value)}>
                                                <option value="사용">사용</option>
                                                <option value="사용안함">사용안함</option>
                                            </select>
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>

                                <div className="btnSet">
                                    <button onClick={() => setIsPopupOpen(false)}>취소</button>
                                    <button className="red" onClick={handlePopupSave}>저장</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}