import { useState } from 'react';
import { containsSQLInjection } from '@/utils/security';

export const useSqlValidator = () => {
    const [isValid, setIsValid] = useState(true);

    const validate = (value: string) => {
        if (containsSQLInjection(value)) {
            setIsValid(false);
            alert("⚠️ 보안 위험: 입력값에 허용되지 않는 키워드(SELECT, UPDATE 등)가 포함되어 있습니다.");
            return false;
        }
        setIsValid(true);
        return true;
    };

    return { isValid, validate };
};

// 입력값에 해당하는 버튼 함수에 추가해서 검증
// // 전송 직전에 검사!
// if (!validate(입력값)) {
//     return; // 검사 탈락 시 여기서 중단 (alert은 훅 내부에서 뜸)
// }