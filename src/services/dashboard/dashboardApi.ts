import api from "@/services/api";

export const getDashboardList = async (token?: string) => {
    const response = await api.get('/dclr/dashboard/list', {
        headers: token ? {Authorization: `Bearer ${token}`} : undefined
    });
    return response.data;
}

export const getAutoApprove = async () => {
    const response = await api.get('/system/auto-approve');
    return response.data;
}

export const patchAutoApprove = async (isManual: boolean) => {
    const value = isManual ? "Y" : "N";

    const response = await api.patch('/system/auto-approve', {paramVl: value});
    return response.data;
}