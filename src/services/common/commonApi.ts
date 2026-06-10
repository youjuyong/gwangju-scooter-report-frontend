import api from "@/services/api";

/**
 * 코드 분류별 코드 리스트 조회
 */
export const getCodeType = async (code: string) => {
    const response = await api.get(`/code/${code}`);

    return response.data;
};




export const getOutlineType = async () => {
    if (typeof window !== 'undefined') {
        const cachedData = localStorage.getItem('outline_type_cache');
        const cachedTime = localStorage.getItem('outline_type_cache_time');
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;

        if (cachedData && cachedTime) {
            if (Date.now() - Number(cachedTime) < ONE_DAY_MS) {
                return JSON.parse(cachedData);
            }
        }
    }

    const response = await api.get(`system/outline`);
    const freshData = response.data.data;

    if (typeof window !== 'undefined') {
        localStorage.setItem('outline_type_cache', JSON.stringify(freshData));
        localStorage.setItem('outline_type_cache_time', String(Date.now()));
    }
};


export const registerGuestMenuLog = async (menuId: string) => {
    const response = await api.post(`system/menu/guest-log`, null, {
        params: { 
            menuId: menuId 
        }
    });

    return response.data;
};

export const registerMenuLog = async (menuId: string) => {
    const response = await api.post(`system/menu/log`, null, {
        params: { 
            menuId: menuId 
        }
    });

    return response.data;
};