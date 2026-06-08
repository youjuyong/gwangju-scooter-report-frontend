import api from "@/services/api";

/**
 * 코드 분류별 코드 리스트 조회
 */
export const getCodeType = async (code: string) => {
    const response = await api.get(`/code/${code}`);

    return response.data;
};




export const getOutlineType = async () => {
    const response = await api.get(`system/outline`);

    return response.data.data;
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