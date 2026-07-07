"use client";

import React from 'react';
import { useDrag } from "@/hooks/userDrag";
import { useManagerForm } from "@/hooks/useManagerForm";

interface ManagerDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRefreshList: () => void;
    data: any | null;
    mode: 'CREATE' | 'UPDATE';
}

export default function MangerPopup({ isOpen, onClose, data, mode, onRefreshList }: ManagerDetailModalProps) {
    // 1. 드래그 레이아웃 기능 유지
    const { position, handleMouseDown, isDragging, popupRef } = useDrag(isOpen);

    // 2. 🌟 커스텀 훅 도입하여 비즈니스 로직 완전 위임
    const {
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
    } = useManagerForm({ isOpen, data, mode, onClose, onRefreshList });

    const errorStyle: React.CSSProperties = {
        color: '#ff4d4f',
        fontSize: '12px',
        marginTop: '4px',
        marginBlockEnd: 0,
        whiteSpace: 'pre-wrap'
    };

    if (!isOpen) return null;

    return (
        <div className="popupWrap">
            <div className="popupInner">
                <div className="popup popup_manager" ref={popupRef}
                     style={{
                         transform: `translate(${position.x}px, ${position.y}px)`,
                         transition: isDragging ? 'none' : 'transform 0.1s ease'
                     }}>
                    <h3 onMouseDown={handleMouseDown} style={{ cursor: 'move', userSelect: 'none' }}>
                        관리자
                    </h3>
                    <button className="popupClose" onClick={handleClosePopup}>닫기</button>
                    <div className="popupconten">
                        <table>
                            <tbody>
                            <tr>
                                <th>ID</th>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <input
                                            type="text"
                                            name="userId"
                                            value={formData?.userId || ''}
                                            onChange={handleChange}
                                            className="menager_id"
                                            disabled={mode === 'UPDATE'}
                                            maxLength={20}
                                        />
                                        {mode === 'CREATE' && (
                                            <button className="duplicate" type="button" onClick={handleIdCheck}>
                                                중복확인
                                            </button>
                                        )}
                                    </div>
                                    {errors.userId && <p style={errorStyle}>{errors.userId}</p>}
                                    {mode === 'CREATE' && isIdChecked && !errors.userId && (
                                        <p style={{ color: '#1890ff', fontSize: '12px', marginTop: '4px', marginBlockEnd: 0 }}>
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
                                    {errors.userNm && <p style={errorStyle}>{errors.userNm}</p>}
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
                                    {errors.telNum && (
                                        <p style={errorStyle}>
                                            {errors.telNum}
                                        </p>
                                    )}
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
                                    {errors.email && (
                                        <p style={errorStyle}>
                                            {errors.email}
                                        </p>
                                    )}
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
                                    {errors.password && <p style={errorStyle}>{errors.password}</p>}
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
                                        <p style={errorStyle}>비밀번호가 일치하지 않습니다.</p>
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <th>사용자 종류</th>
                                <td>
                                    <select name="userTypeCd" value={formData?.userTypeCd} onChange={handleChange}>
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
                                        <select name="userDeptId" value={formData?.userDeptId || ""} onChange={handleChange}>
                                            {deptlist.map((type: any) => (
                                                <option key={type.deptId} value={type.deptId}>
                                                    {type.deptNm}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    <tr>
                                        <th>회사</th>
                                        <td>
                                            <select name="userBzentyId" value={formData?.userBzentyId || ""} onChange={handleChange}>
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
                                            <select name="userDeptId" value={formData?.userDeptId || ""} onChange={handleChange} disabled={!formData?.userBzentyId}>
                                                {bzenDeptlist.map((dept: any) => (
                                                    <option key={dept.deptId} value={dept.deptId}>
                                                        {dept.deptNm}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                </>
                            )}
                            <tr>
                                <th>계정상태</th>
                                <td>
                                    <select name="sttsCd" value={formData?.sttsCd} onChange={handleChange}>
                                        <option value="USTS02">사용</option>
                                        <option value="USTS03">사용안함</option>
                                    </select>
                                </td>
                            </tr>
                            {!["DPTY01", "DPTY02"].includes(formData?.userTypeCd) && (
                                <tr>
                                    <th>담당권역</th>
                                    <td style={{ padding: '10px 0px' }}>
                                        {regionList.map((region: any) => (
                                            <label key={region.sareaId}>
                                                <input
                                                    type="checkbox"
                                                    checked={formData?.sareaIds?.includes(String(region.sareaId)) || false}
                                                    onChange={(e) => handleCheckboxChange(String(region.sareaId), e.target.checked)}
                                                />
                                                {" "}{region.sareaNm}
                                            </label>
                                        ))}
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>

                        <div className="btnSet">
                            <button onClick={handleClosePopup}>취소</button>
                            <button className="red" onClick={handleSave}>저장</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}