"use server";

export async function getReportTerms() {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_INTERNAL_API_URL || "";
        const response = await fetch(`${baseUrl}/api/ntc/type?ntcTypeCd=NTCT02`, {
            method: 'GET',
            cache: 'force-cache',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const result = await response.json();
            return result.data?.cnData || "등록된 내용이 없습니다.";
        }
        return "등록된 내용을 불러오지 못했습니다.";
    } catch (error) {
        console.error("서버 약관 페칭 에러:", error);
        return "데이터를 불러오는 데 실패했습니다.";
    }
}