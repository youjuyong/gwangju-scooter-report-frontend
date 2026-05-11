"use client";

import React, {useEffect, useState} from "react";
import "@/css/base_style.css";
import "@/css/style.css";
import {useParams} from "next/navigation";
import {getReportList} from "@/services/report/reportApi";

export default function ReportRecoveryPage() {
    const {dclrId} = useParams<{ dclrId: string }>();
    const [isLoading, setIsLoading] = useState(true);
    const [report, setReport] = useState<any>(null);
    const [reportList, setReportList] = useState<any[]>([]);

    useEffect(() => {
        const fetchList = async () => {
            try {
                const res = await getReportList();
                if (res.success) {
                    setReportList(res.data);
                }
            } catch (error) {
                console.error("목록 로드 실패:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchList();
    }, []);

    useEffect(() => {
        const fetchDetail = async () => {
            if (!dclrId) {
                setIsLoading(false);
                return;
            }
            try {
                // const res = await getReportDetail(dclrId);
                // if (res.success) {
                //     setReport(res.data);
                // }
            } catch (error) {
                console.error("상세 내역 로드 실패:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetail();
    }, [dclrId]);

    const [previews, setPreviews] = useState<{ [key: string]: string }>({
        photo1: "",
        photo2: "",
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {id, files} = e.target;
        if (files && files[0]) {
            const file = files[0];

            // 10KB 용량 제한 체크 (10 * 1024 bytes)
            const MIN_SIZE = 10 * 1024;
            if (file.size < MIN_SIZE) {
                alert("이미지 용량이 너무 작습니다. 10KB 이상의 사진을 등록해 주세요.");
                e.target.value = "";
                return;
            }

            const previewUrl = URL.createObjectURL(file);
            setPreviews((prev) => ({...prev, [id]: previewUrl}));
        }
    };

    const handleRemoveImage = (id: string) => {
        if (previews[id]) {
            URL.revokeObjectURL(previews[id]);
            setPreviews((prev) => ({...prev, [id]: ""}));
        }
    };

    return (
        <div className="wrap noMenubody noMenubodyLine">
            <header>
                <h1>킥보드 회수 등록</h1>
                <button type="button" className="back" onClick={() => window.history.back()}>
                    뒤로 가기
                </button>
            </header>

            <main className="sub_article">
                <div className="detailBox">
                    <p className="situation si1">처리중</p>
                    <p className="add">경기도 광주시 탄벌동</p>
                    <dl>
                        <dt>신고일시</dt>
                        <dd>2026-01-07 10:11</dd>
                    </dl>
                    <dl>
                        <dt>킥보드ID</dt>
                        <dd>123456</dd>
                    </dl>
                    <dl>
                        <dt>위반유형</dt>
                        <dd>보도와 차도가 구분된 도로</dd>
                    </dl>
                    <dl>
                        <dt>상세설명</dt>
                        <dd>설명이 블라블라 나옵니다.</dd>
                    </dl>
                    <dl>
                        <dt className="result_photo_title">등록한 사진</dt>
                        <dd className="result_meimg">
                            <div className="imgli">
                                <div className="imgsize">
                                    <img src="/images/sample1.jpg" alt="주정차 위반 신고 촬영한 사진1"/>
                                </div>
                            </div>
                            <div className="imgli lastimgli">
                                <div className="imgsize">
                                    <img src="/images/sample2.jpg" alt="주정차 위반 신고 촬영한 사진2"/>
                                </div>
                            </div>
                        </dd>
                    </dl>
                </div>

                <div className="detailBox_re">
                    <div className="re_con">
                        <dl>
                            <dt>처리자</dt>
                            <dd>처리자 ID</dd>
                        </dl>

                        <div>
              <span className="listtitle" id="photo-label">
                사진등록
              </span>
                            <div className="pic-list" role="group" aria-labelledby="photo-label">
                                <ul>
                                    {["photo1", "photo2"].map((id, index) => (
                                        <li key={id}>
                                            <div className="imgsize">
                                                {previews[id] ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            className="pic-del"
                                                            onClick={() => handleRemoveImage(id)}
                                                        >
                                                            삭제
                                                        </button>
                                                        <img src={previews[id]} alt={`회수 사진 ${index + 1}`}/>
                                                    </>
                                                ) : (
                                                    <>
                                                        <input
                                                            type="file"
                                                            id={id}
                                                            className="visually-hidden"
                                                            accept="image/*"
                                                            onChange={handleFileChange}
                                                        />
                                                        <label htmlFor={id} className="camerain">
                                                            {index === 0 ? "첫 번째 촬영" : "두 번째 촬영"}
                                                        </label>
                                                    </>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <button type="button" className="btn_ok">
                        처리완료
                    </button>
                </div>
            </main>
        </div>
    );
}