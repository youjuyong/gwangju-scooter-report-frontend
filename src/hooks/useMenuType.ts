import { useState, useEffect } from 'react';
import { getCodeType } from  "@/services/common/commonApi";

export function useMenuTypes() {
    const [menuTypeList, setMenuTypeList] = useState<{ cdId: string; cdNm: string; }[]>([]);
    const [menuType, setMenuType] = useState<string>('');
    const [menuTypeNm, setMenuTypeNm] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchMenuTypes = async () => {
            try {
                setIsLoading(true);
                const response = await getCodeType('MNUT');
                const datalist = response.data;

                if (datalist && datalist.length > 0) {
                    const extractedList = datalist.map((item: { cdId: string; cdNm: string; }) => ({
                        cdId: item.cdId,
                        cdNm: item.cdNm
                    }));

                    setMenuTypeList(extractedList);
                    setMenuType(datalist[0].cdId);
                    setMenuTypeNm(datalist[0].cdNm);
                }
            } catch (error) {
                console.error("데이터 가져오기 실패:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMenuTypes();
    }, []);

    // 컴포넌트에서 필요한 상태와 상태변경 함수(setState)들을 객체로 반환합니다.
    return {
        menuTypeList,
        menuType,
        menuTypeNm,
        setMenuType,
        setMenuTypeNm,
        isLoading
    };
}