/**
 * 1. 공통 정규식(Regex) 모음
 */
export const REGEX = {
    // 숫자만 정확히 입력
    ONLY_NUMBER: /^[0-9]+$/,

    // 영문, 숫자, 특수문자만 허용 (한글 제외)
    NO_KOREAN: /^[A-Za-z0-9~!@#$%^&*()_+|<>?:{}]+$/,

    // 표준 이메일 형식
    EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

    // 휴대폰 번호 형식 (010-1234-5678)
    PHONE_NUMBER: /^010-\d{3,4}-\d{4}$/,

    // 연속되거나 반복되는 문자 체크용 (3자 이상)
    REPEATED_CHAR: /(.)\1\1/,
};

/**
 * 2. 키보드 연속 문자열(QWER, 1234 등) 검사 함수
 */
const checkKeyboardOrSequential = (str: string): boolean => {
    const keyboardRows = [
        "qwertyuiop", "asdfghjkl", "zxcvbnm",
        "1234567890"
    ];
    const lowerStr = str.toLowerCase();

    for (let i = 0; i < lowerStr.length - 2; i++) {
        const triple = lowerStr.slice(i, i + 3);

        // 1) 123, abc 같은 단순 일련번호/알파벳 순서 검사
        const char1 = triple.charCodeAt(0);
        const char2 = triple.charCodeAt(1);
        const char3 = triple.charCodeAt(2);
        if ((char2 === char1 + 1 && char3 === char2 + 1) || (char2 === char1 - 1 && char3 === char2 - 1)) {
            return true;
        }

        // 2) qwe, asd 같은 키보드 배열 배열 순서 검사
        for (const row of keyboardRows) {
            if (row.includes(triple) || row.split("").reverse().join("").includes(triple)) {
                return true;
            }
        }
    }
    return false;
};

/**
 * 3. 기획서 기준 유효성 체크 함수 모음
 */
export const validateFields = {
    // 권역 관리 -> 하위권역 id (숫자 10자리)
    subZoneId: (value: string) => {
        if (!value) return "하위권역 ID를 입력해주세요.";
        if (value.length !== 10 || !REGEX.ONLY_NUMBER.test(value)) {
            return "하위권역 ID는 숫자 10자리여야 합니다.";
        }
        return true;
    },

    // 공통코드관리 -> 코드 id (한글 없이 최대 10자)
    codeId: (value: string) => {
        if (!value) return "코드 ID를 입력해주세요.";
        if (value.length > 10) return "코드 ID는 최대 10자까지 가능합니다.";
        if (!REGEX.NO_KOREAN.test(value)) return "코드 ID에 한글은 포함될 수 없습니다.";
        return true;
    },

    // 사용자 관리 -> 아이디 (한글 없이 최대 20자)
    userId: (value: string) => {
        if (!value) return "아이디를 입력해주세요.";
        if (value.length > 20) return "아이디는 최대 20자까지 가능합니다.";
        if (!REGEX.NO_KOREAN.test(value)) return "아이디에 한글은 포함될 수 없습니다.";
        return true;
    },

    // 사용자 관리 -> 비밀번호 (KISA 가이드라인 완벽 반영)
    password: (value: string) => {
        if (!value) return "비밀번호를 입력해주세요.";

        // 종류 분석 (영문 대소문자, 숫자, 특수문자 그룹 분리 가능하나 크게 [문자/숫자/특수문자] 매칭)
        const hasLetter = /[A-Za-z]/.test(value);
        const hasDigit = /[0-9]/.test(value);
        const hasSpecial = /[~!@#$%^&*()_+|<>?:{}]/.test(value);

        // 결합된 문자 종류의 개수 카운트
        const typeCount = [hasLetter, hasDigit, hasSpecial].filter(Boolean).length;

        // 조건 1: 두 종류 이상 조합 시 최소 8자리
        if (typeCount >= 2 && value.length < 8) {
            return "문자, 숫자, 특수문자 중 2종류 이상 조합 시 최소 8자리 이상이어야 합니다.";
        }
        // 조건 2: 한 가지 종류로만 구성 시 최소 10자리
        if (typeCount === 1 && value.length < 10) {
            return "한 가지 종류의 문자로만 구성 시 최소 10자리 이상이어야 합니다.";
        }

        // 조건 3: 동일한 문자 3번 이상 반복 차단 (aaa, 111 등)
        if (REGEX.REPEATED_CHAR.test(value)) {
            return "동일한 문자를 연속으로 3번 이상 반복하여 사용할 수 없습니다.";
        }

        // 조건 4: 키보드 연속 배열 및 일련번호(qwer, 123 등) 3자 이상 차단
        if (checkKeyboardOrSequential(value)) {
            return "키보드 연속 문자열이나 순차적인 일련번호(3자 이상)는 사용할 수 없습니다.";
        }

        return true;
    },

    // 사용자 관리 -> 이메일
    email: (value: string) => {
        if (!value) return "이메일을 입력해주세요.";
        if (!REGEX.EMAIL.test(value)) return "올바른 이메일 형식이 아닙니다.";
        return true;
    },

    // 사용자 관리 -> 연락처 (000-0000-0000)
    phoneNumber: (value: string) => {
        if (!value) return "연락처를 입력해주세요.";
        if (!REGEX.PHONE_NUMBER.test(value)) return "연락처는 010-0000-0000 형식이어야 합니다.";
        return true;
    }
};