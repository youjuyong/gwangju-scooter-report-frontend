import { useState } from 'react';
import { containsSQLInjection } from '@/utils/security';
import {toast} from "react-hot-toast";
import {handleApiError} from "@/hooks/errorHandler";

export const useSqlValidator = () => {
    const [isValid, setIsValid] = useState(true);

    const sqlValidate = (value: string) => {
        if (containsSQLInjection(value)) {
            setIsValid(false);

            // toast.error 내부에 (t) => (...) 형태의 JSX를 전달합니다.
            toast.error((t) => (
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>

                    <button
                        type="button" // form 전송 방지
                        onClick={() => toast.dismiss(t.id)}
                        style={{
                            background: 'transparent', // 배경 투명하게
                            border: 'none', // 테두리 없애기
                            color: '#ff4b4b', // 에러 색상과 통일
                            padding: '4px', // 클릭 영역 확보
                            fontSize: '18px', // 아이콘 크기
                            lineHeight: '1', // 세로 정렬
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            opacity: '0.8', // 살짝 투명하게
                            transition: 'opacity 0.2s', // 호버 효과
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')} // 호버 시 진하게
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
                    >
                        &times; {/*  X 아이콘 */}
                    </button>
                    <span>⚠️ 보안 위험: 허용되지 않는 키워드가 포함되어 있습니다.</span>
                </div>
            ), {
                icon: null,
                duration: 6000,
                position: 'top-center',
            });

            return false;
        }

        setIsValid(true);
        return true;
    };

    return {isValid, sqlValidate};
};

// 입력값에 해당하는 버튼 함수에 추가해서 검증
// // 전송 직전에 검사!
// if (!validate(입력값)) {
//     return; // 검사 탈락 시 여기서 중단 (alert은 훅 내부에서 뜸)
// }