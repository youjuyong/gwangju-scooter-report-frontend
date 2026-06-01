"use client";

import React, {useState} from "react";

export default function DashboardPage() {
    const [isToggleChecked, setIsToggleChecked] = useState(false);

    return (
        <>
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
                        <button className="icon1 click" disabled>미승인 [0]</button>
                        {/*수동모드 전환 시 disabled 삭제*/}
                        <button className="icon2 click">미배정 [0]</button>
                        <button className="icon3 click">처리중 [0]</button>
                        <button className="icon4 click">처리완료 [0]</button>
                    </dd>
                    <dd className="status status2">
                        <button className="icon5 click" disabled>견인미승인 [0]</button>
                        {/*수동모드 전환 시 disabled 삭제*/}
                        <button className="icon6">견인요청 [0]</button>
                        <button className="icon7">견인처리중 [0]</button>
                        <button className="icon8">견인완료 [0]</button>
                    </dd>
                </dl>
            </div>

            <button className="btnarrow"></button>
            {/*모바일용 상단 열기닫기 버튼(대시보드에서만 있음)*/}

            <div className="article">
                <section className="listBox">
                    <button className="btnarrow_left"></button>
                    {/*모바일용 왼쪽 열기닫기 버튼 / 브라우저 width 1430px 이하 에서 목록 클릭 시 wrap에 leftoff 들어가게(리스트창닫힘) 해주세요 (지금 구현되어있는거에서 목록 클릭시에도 동작 되게 추가) / 다시 열기 누르면 클릭한 내용(팝업 및 리스트 선택 상태) 닫히 도록(리셋)*/}

                    {/*자동/수동모드 안내*/}
                    <div className="leftinfo">
                        <div className="auto"><img src="./images/icon_self.png" alt="자동"/>자동 승인 처리중..</div>
                        {/*자동모드일 때 */}
                        {/*<div className="hand">수동모드</div>*/}{/*수동모드일 때 */}
                    </div>

                    {/*킥보드리스트*/}
                    <div className="listconten">
                        <h2>목록</h2>
                        <ul className="">
                            <li className="click"> {/*선택 된 li에 click 넣기*/}
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
                                <div className="btnSet">
                                    <button>반려</button>
                                    {/*반려 시 아예 삭제*/}
                                    <button className="red">승인</button>
                                    {/*승인 시 미배정으로 변경*/}
                                </div>
                            </li>

                            <li> {/*선택 된 li에 click 넣기*/}
                                <div className="listtop">
                                    <p className="state st3">처리중</p> {/*미승인 st1 , 미배정: st2, 처리중: st3 , 처리완료: st4 , 견인미승인:st5 , 견인요청: st6 , 견인처리중: st7 , 견인완료: st8*/}
                                    <div className="pmname"><img src="./images/swing.png" alt="스윙"/>스윙</div>
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
                    {/*./수동모드일 때 신규신고 알림 끝*/}

                    {/*상세 (다른 아이콘 또는 다른 리스트 누르면 내용 바뀌도록)*/}
                    <div className="popup popup_kick">
                        <h3>신고정보</h3>
                        <button className="popupClose">닫기</button>
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
                            <div className="btnSet">
                                <button>반려</button>
                                {/*반려 시 리스트에서 삭제*/}
                                <button className="red">승인</button>
                                {/*승인 시 미배정으로 변경*/}
                            </div>
                        </div>
                    </div>
                    {/*/.상세끝*/}

                    <div className="map">지도 나올 곳</div>
                </section>
            </div>
        </>
    );
}