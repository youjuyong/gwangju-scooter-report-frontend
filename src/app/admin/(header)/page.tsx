"use client";

import React, {useCallback, useEffect, useMemo, useState} from "react";
import {getOutlineType} from "@/services/common/commonApi";
import {useAlert} from "@/components/popup/PopupProvider";
import {Circle, Map, MapMarker} from "react-kakao-maps-sdk";
import {CityOutline} from "@/components/dashboard/CityOutline";

export default function DashboardPage() {
    const [isToggleChecked, setIsToggleChecked] = useState(false);
    const [activeListId, setActiveListId] = useState<number | null>(null);
    const [isLeftOff, setIsLeftOff] = useState(false);
    const [isUpperOff, setIsUpperOff] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [status, setStatus] = useState("");

    const showAlert = useAlert();
    const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
    const [address, setAddress] = useState<string>("위치를 선택해 주세요");
    const [zoneId, setZoneId] = useState<string>("");
    const [outlinePath, setOutlinePath] = useState([]);
    const [bachList, setBachList] = useState<any[]>([]);
    const [jibunAddress, setJibunAddress] = useState<string>("");

    const [mapInstance, setMapInstance] = useState<any>(null);
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);

    const [isMobileSize, setIsMobileSize] = useState<boolean>(
        typeof window !== "undefined" ? window.innerWidth <= 1430 : false
    );

    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleResizeMode = () => {
            const mobileSize = window.innerWidth <= 1430;
            setIsMobileSize(mobileSize);
        };

        window.addEventListener("resize", handleResizeMode);
        return () => window.removeEventListener("resize", handleResizeMode);
    }, []);

    useEffect(() => {
        if (!mapInstance || !position) return;

        mapInstance.relayout();

        const {kakao} = window;
        const projection = mapInstance.getProjection();

        const currentLatLng = new kakao.maps.LatLng(position.lat, position.lng);
        const pixelPoint = projection.pointFromCoords(currentLatLng);

        const realTimeIsMobile = window.innerWidth <= 1430;

        let offsetX = isLeftOff ? 0 : (320 / 2);
        if (!realTimeIsMobile && isLeftOff) {
            offsetX = offsetX + 160;
        }

        const offsetY = isUpperOff ? 0 : ((isMobileSize ? 86 : 51) / 2);

        const correctedPixel = new kakao.maps.Point(
            pixelPoint.x + offsetX,
            pixelPoint.y + offsetY
        );

        const correctedLatLng = projection.coordsFromPoint(correctedPixel);

        const center = {
            lat: correctedLatLng.getLat(),
            lng: correctedLatLng.getLng()
        };

        setMapCenter(center);

        mapInstance.setCenter(correctedLatLng);
    }, [isLeftOff, isUpperOff, mapInstance, position]);

    useEffect(() => {
        if (!mapInstance) return;

        const handleResize = () => {
            const {kakao} = window;
            if (!kakao || !mapInstance) return;

            const targetCenter = mapCenter || position;
            if (!targetCenter) return;

            mapInstance.relayout();

            const projection = mapInstance.getProjection();

            const currentLatLng = new kakao.maps.LatLng(targetCenter.lat, targetCenter.lng);
            const pixelPoint = projection.pointFromCoords(currentLatLng);

            const realTimeIsMobile = window.innerWidth <= 1430;

            const moveLatLng = new kakao.maps.LatLng(targetCenter.lat, targetCenter.lng);

            let offsetX = 0;
            if (!isLeftOff) {
                offsetX = isMobileSize ? 0 : (320 / 2);
            }

            let offsetY = 0;
            if (!isUpperOff) {
                const topBarHeight = isMobileSize ? 86 : 51;
                offsetY = topBarHeight / 2;
            }

            const correctedPixel = new kakao.maps.Point(
                pixelPoint.x + offsetX,
                pixelPoint.y + offsetY
            );

            const correctedLatLng = projection.coordsFromPoint(correctedPixel);
            mapInstance.setCenter(correctedLatLng);

            if (isLeftOff || isUpperOff) {
                let offsetX = 0;
                let offsetY = 0;
                if (!realTimeIsMobile) {
                    if (isLeftOff) {
                        offsetX = offsetX + 160;
                    }
                    if (isUpperOff) {
                        offsetY = offsetY + ((realTimeIsMobile ? 86 : 51) / 2);
                    }
                }
                const correctedPixel = new kakao.maps.Point(
                    pixelPoint.x + offsetX,
                    pixelPoint.y + offsetY
                );

                const correctedLatLng = projection.coordsFromPoint(correctedPixel);
                mapInstance.setCenter(correctedLatLng);
            } else {
                mapInstance.setCenter(moveLatLng);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [mapInstance, mapCenter, position, isLeftOff, isUpperOff]);

    const handleListClick = (id: number) => {
        setActiveListId(id);
        setIsPopupOpen(true);
        if (typeof window !== "undefined" && window.innerWidth <= 1430) {
            setIsLeftOff(true);
        }
    };

    const fetchAddressInfo = useCallback((lat: number, lng: number) => {
        const {kakao} = window;
        if (!kakao || !kakao.maps.services) return;
        kakao.maps.load(() => {
            const geocoder = new kakao.maps.services.Geocoder();

            geocoder.coord2Address(lng, lat, (result: any, status: any) => {
                if (status === kakao.maps.services.Status.OK) {
                    const addr = result[0].road_address
                        ? result[0].road_address.address_name
                        : result[0].address.address_name;
                    setAddress(addr);

                    if (result[0].address && result[0].address.address_name) {
                        setJibunAddress(result[0].address.address_name);
                    } else {
                        setJibunAddress("");
                    }
                } else {
                    setAddress("주소를 찾을 수 없는 지역입니다.");
                }
            });

            geocoder.coord2RegionCode(lng, lat, (result: any, status: any) => {
                if (status === kakao.maps.services.Status.OK) {
                    const zoneInfo = result.find((item: any) => item.region_type === 'B');
                    if (zoneInfo) {
                        setZoneId(zoneInfo.code);
                    }
                }
            });
        });
    }, []);

    useEffect(() => {
        if (!navigator.geolocation) {
            showAlert("GPS를 지원하지 않는 기기입니다.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newPos = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                };
                setPosition(newPos);
                fetchAddressInfo(newPos.lat, newPos.lng);
            },
            (err) => {
                console.warn("GPS 획득 실패:", err);

                navigator.geolocation.getCurrentPosition(
                    (secondPos) => {
                        const newPos = {
                            lat: secondPos.coords.latitude,
                            lng: secondPos.coords.longitude,
                        };
                        setPosition(newPos);
                        fetchAddressInfo(newPos.lat, newPos.lng);
                    },
                    (secondErr) => {
                        console.error("최종 위치 획득 실패, 기본 위치로 지도를 엽니다:", secondErr);

                        const defaultPos = {lat: 37.42870, lng: 127.25618};
                        setPosition(defaultPos);
                        fetchAddressInfo(defaultPos.lat, defaultPos.lng);
                    },
                    {enableHighAccuracy: true, timeout: 15000, maximumAge: 60000}
                );
            },
            {enableHighAccuracy: false, timeout: 6000, maximumAge: Infinity}
        );

        const initData = async () => {
            try {
                const [outlineRes]: any = await Promise.all([
                    getOutlineType()
                ]);

                if (outlineRes && Array.isArray(outlineRes)) {
                    const formattedPath: any = outlineRes
                        .sort((a: any, b: any) => a.ord - b.ord)
                        .map((item: any) => ({
                            lat: Number(item.ycrdn),
                            lng: Number(item.xcrdn)
                        }));
                    setOutlinePath(formattedPath);
                }
            } catch (err) {
                console.error("초기 데이터 로드 실패:", err);
            }
        };
        initData();
    }, [fetchAddressInfo]);

    const optimizedPath = useMemo(() => {
        if (!outlinePath || outlinePath.length === 0) return [];
        return outlinePath.filter((_: any, index: number) => index % 10 === 0);
    }, [outlinePath]);

    return (
        <div className={`wrap ${isLeftOff ? "leftoff" : "lefton"} ${isUpperOff ? "off" : "on"} `}>
            <div className="subnav dashboardTop">
                <dl>
                    <dt>모드선택</dt>
                    <dd>
                        <label className="switch">
                            <input
                                type="checkbox"
                                id="toggle"
                                checked={isToggleChecked}
                                onChange={(e) => setIsToggleChecked(e.target.checked)}
                            />
                            <span className="modeslider">
                              <span className="text on">자동</span>
                              <span className="text off">수동</span>
                            </span>
                        </label>
                    </dd>
                    <dt>PM</dt>
                    <dd className="pm">
                        <button className="click"><img src="./../assets/style_admin/images/gcoo.png" alt="지쿠"/>지쿠
                        </button>
                        <button><img src="./../assets/style_admin/images/swing.png" alt="스윙"/>스윙</button>
                    </dd>
                </dl>
                <dl>
                    <dt>상태/건수</dt>
                    <dd className="status status1">
                        <button className="icon1 click" disabled={!isToggleChecked}>미승인 [0]</button>
                        {/*수동모드 전환 시 disabled 삭제*/}
                        <button className="icon2 click">미배정 [0]</button>
                        <button className="icon3 click">처리중 [0]</button>
                        <button className="icon4 click">처리완료 [0]</button>
                    </dd>
                    <dd className="status status2">
                        <button className="icon5 click" disabled={!isToggleChecked}>견인미승인 [0]</button>
                        {/*수동모드 전환 시 disabled 삭제*/}
                        <button className="icon6">견인요청 [0]</button>
                        <button className="icon7">견인처리중 [0]</button>
                        <button className="icon8">견인완료 [0]</button>
                    </dd>
                </dl>
            </div>

            <button className="btnarrow" onClick={() => setIsUpperOff(!isUpperOff)}></button>
            {/*모바일용 상단 열기닫기 버튼(대시보드에서만 있음)*/}

            <div className="article">
                <section className="listBox">
                    <button className="btnarrow_left" onClick={() => setIsLeftOff(!isLeftOff)}></button>
                    {/*모바일용 왼쪽 열기닫기 버튼 / 브라우저 width 1430px 이하 에서 목록 클릭 시 wrap에 leftoff 들어가게(리스트창닫힘) 해주세요 (지금 구현되어있는거에서 목록 클릭시에도 동작 되게 추가) / 다시 열기 누르면 클릭한 내용(팝업 및 리스트 선택 상태) 닫히 도록(리셋)*/}

                    {/*자동/수동모드 안내*/}
                    <div className="leftinfo">
                        {isToggleChecked ? (
                            <div className="hand">수동모드</div>
                        ) : (
                            <div className="auto"><img src="../../../assets/style_admin/images/icon_self.png" alt="자동"/>자동
                                승인 처리중..</div>
                        )}
                    </div>

                    {/*킥보드리스트*/}
                    <div className="listconten">
                        <h2>목록</h2>
                        <ul className="">
                            {/*선택 된 li에 click 넣기*/}
                            <li
                                className={activeListId === 1 ? "click" : ""}
                                onClick={() => handleListClick(1)}
                            >
                                <div className="listtop">
                                    <p className="state st2">미배정</p> {/*미승인 st1 , 미배정: st2, 처리중: st3 , 처리완료: st4 , 견인미승인:st5 , 견인요청: st6 , 견인처리중: st7 , 견인완료: st8*/}
                                    <div className="pmname"><img src="../../../assets/style_admin/images/gcoo.png"
                                                                 alt="지쿠"/>지쿠
                                    </div>
                                </div>
                                <div className="address">경기도 광주시 탄벌동 28-4</div>
                                <div className="details">
                                    <div className="detail_tableBox">
                                        <table>
                                            <tbody>
                                            <tr>
                                                <th>신고일시</th>
                                                <td>2026-01-07 10:00</td>
                                            </tr>
                                            <tr>
                                                <th>위반유형</th>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <th>상세설명</th>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <th>처리자ID</th>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <th>처리일자</th>
                                                <td className="blue">-</td>
                                            </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <img src="./images/img.jpg" alt="킥보드"/>
                                </div>
                                {/*수동모드(미승인) 일때만 나올 버튼*/}
                                {isToggleChecked && (
                                    <div className="btnSet">
                                        <button>반려</button>
                                        {/*반려 시 아예 삭제*/}
                                        <button className="red">승인</button>
                                        {/*승인 시 미배정으로 변경*/}
                                    </div>
                                )}
                            </li>

                            {/*선택 된 li에 click 넣기*/}
                            <li
                                className={activeListId === 2 ? "click" : ""}
                                onClick={() => handleListClick(2)}
                            >
                                <div className="listtop">
                                    <p className="state st3">처리중</p> {/*미승인 st1 , 미배정: st2, 처리중: st3 , 처리완료: st4 , 견인미승인:st5 , 견인요청: st6 , 견인처리중: st7 , 견인완료: st8*/}
                                    <div className="pmname"><img src="../../../assets/style_admin/images/swing.png"
                                                                 alt="스윙"/>스윙
                                    </div>
                                </div>
                                <div className="address">경기도 광주시 탄벌동 28-4</div>
                                <div className="details">
                                    <div className="detail_tableBox">
                                        <table>
                                            <tbody>
                                            <tr>
                                                <th>신고일시</th>
                                                <td>2026-01-07 10:00</td>
                                            </tr>
                                            <tr>
                                                <th>위반유형</th>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <th>상세설명</th>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <th>처리자ID</th>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <th>처리일자</th>
                                                <td className="blue">-</td>
                                            </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <img src="./images/img.jpg" alt="킥보드"/>
                                </div>
                            </li>
                        </ul>
                    </div>
                </section>

                {/*지도*/}
                <section className="mapBox">
                    {/*마커*/}
                    <div
                        className="marker marker5 click"> {/* marker1(미승인) ~ marker8(견인완료) 순서대로 번호 / 클릭 시 click 넣기*/}
                        <div className="img">
                            <p className="tow"></p>
                            <img src="./images/gcoo.png" alt="로고"/> {/*로고이미지*/}
                        </div>
                    </div>
                    {/*./마커 끝*/}

                    {/*배치존*/}
                    <div
                        className="zone"> {/*zone 의 width:50px; height: 50px; 임의로 50으로 해놨습니다. 상황에 맞게 사이즈 변경해 주세요.*/}
                        <span className="spot"></span>
                        <span className="round"></span>
                    </div>
                    {/*./배치존 끝*/}

                    {/*수동모드일 때 신규신고 알림*/}
                    {isToggleChecked && (
                        <div className="alarm">
                            <h3>신규신고</h3>
                            <div className="alarmBox">
                                <ul>
                                    <li>
                                        <p>경안천로 159 역순으로 쌓이도록</p> {/*도,시 제외한 나머지 주소만 보이게*/}
                                        <button>확인하기</button>
                                        {/*해당 팝업 띄움(선택상태로)*/}
                                    </li>
                                    <li>
                                        <p>경안천로 159 두번째알림</p>
                                        <button>확인하기</button>
                                    </li>
                                    <li>
                                        <p>경안천로 159 첫번째 알림</p>
                                        <button>확인하기</button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        /*수동모드일 때 신규신고 알림 끝*/
                    )}

                    {/*상세 (다른 아이콘 또는 다른 리스트 누르면 내용 바뀌도록)*/}
                    {isPopupOpen && (
                        <>
                            <div className="popup popup_kick">
                                <h3>신고정보</h3>
                                <button className="popupClose" onClick={() => setIsPopupOpen(false)}>닫기</button>
                                <div className="popupconten">
                                    <p className="state st2">미배정</p> {/*미승인 st1 , 미배정: st2, 처리중: st3 , 처리완료: st4 , 견인미승인:st5 , 견인요청: st6 , 견인처리중: st7 , 견인완료: st8*/}
                                    <div className="address">경기도 광주시 탄벌동 28-4</div>
                                    <table>
                                        <tbody>
                                        <tr>
                                            <th>신고일시</th>
                                            <td>2026년 1월 20일 05:00</td>
                                        </tr>
                                        <tr>
                                            <th>신고번호</th>
                                            <td></td>
                                        </tr>
                                        <tr>
                                            <th>신고자ID</th>
                                            <td></td>
                                        </tr>
                                        <tr>
                                            <th>위반유형</th>
                                            <td></td>
                                        </tr>
                                        <tr>
                                            <th>상세설명</th>
                                            <td></td>
                                        </tr>
                                        <tr>
                                            <th>PM사</th>
                                            <td>지쿠</td>
                                        </tr>
                                        <tr>
                                            <th>킥보드ID</th>
                                            <td></td>
                                        </tr>
                                        </tbody>
                                    </table>

                                    <div className="kickimg">
                                        <div className="imgli">
                                            <div className="imgsize">
                                                <img src="./images/img.jpg" alt="이미지1"/>
                                            </div>
                                        </div>
                                        <div className="imgli lastimgli">
                                            <div className="imgsize">
                                                <img src="./images/img.jpg" alt="이미지2"/>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="table2">
                                        <table>
                                            <tbody>
                                            <tr>
                                                <th>처리자ID</th>
                                                <td></td>
                                            </tr>
                                            <tr>
                                                <th>처리일시</th>
                                                <td className="blue">2025</td>
                                            </tr>
                                            <tr>
                                                <th>처리사유</th>
                                                <td>사유가 나옵니다.</td>
                                            </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/*처리완료시 나올 처리완료사진*/}
                                    <div className="kickimg kickimg_ok">
                                        <div className="imgli">
                                            <div className="imgsize">
                                                <img src="./images/img.jpg" alt="이미지1"/>
                                            </div>
                                        </div>
                                        <div className="imgli lastimgli">
                                            <div className="imgsize">
                                                {/*<img src="./images/img.jpg" alt="이미지2">*/} {/*두번째 사진 없을 시 img 만 삭제*/}
                                            </div>
                                        </div>
                                    </div>
                                    {/*./처리완료시 나올 처리완료사진 끝*/}

                                    {/*수동모드일 때 나올 버튼*/}
                                    {isToggleChecked && (
                                        <div className="btnSet">
                                            <button>반려</button>
                                            {/*반려 시 리스트에서 삭제*/}
                                            <button className="red">승인</button>
                                            {/*승인 시 미배정으로 변경*/}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/*/.상세끝*/}
                        </>
                    )}

                    <div className="map">
                        {typeof window !== "undefined" && window.kakao && position && (
                            <Map
                                center={mapCenter || position || {lat: 37.42870, lng: 127.25618}}
                                style={{width: "100%", height: "100%", minHeight: "300px"}}
                                level={3}
                                onCreate={(map) => setMapInstance(map)}
                                onDragEnd={(map) => {
                                    const actualCenter = map.getCenter();
                                    setMapCenter({
                                        lat: actualCenter.getLat(),
                                        lng: actualCenter.getLng()
                                    });
                                }}
                                onIdle={(map) => {
                                    const actualCenter = map.getCenter();
                                    fetchAddressInfo(actualCenter.getLat(), actualCenter.getLng());
                                }}
                            >
                                <MapMarker position={position}/>

                                {bachList?.map((item) => {
                                    const centerLatLng = {
                                        lat: Number(item.lat),
                                        lng: Number(item.lot),
                                    };

                                    return (
                                        <React.Fragment key={item.btchZoneId}>
                                            <Circle
                                                center={centerLatLng}
                                                radius={15}
                                                strokeWeight={1}
                                                strokeColor={"rgba(255, 0, 255, 0.4)"}
                                                strokeOpacity={0.8}
                                                strokeStyle={"solid"}
                                                fillColor={"rgba(255, 0, 255, 0.2)"}
                                                fillOpacity={0.5}
                                            />

                                            <Circle
                                                center={centerLatLng}
                                                radius={1}
                                                strokeWeight={1}
                                                strokeColor={"#ff00dc"}
                                                strokeOpacity={0.1}
                                                fillColor={"#ff00dc"}
                                                fillOpacity={1}
                                            />
                                        </React.Fragment>
                                    );
                                })}
                                {outlinePath.length > 0 && (
                                    <CityOutline path={optimizedPath}/>
                                )}
                            </Map>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}