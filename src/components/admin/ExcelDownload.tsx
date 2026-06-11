import React, {useCallback, useContext, useState} from "react";
import {ExcelContext} from "./ExcelContext";

interface SaveAndResetProps {
    showDownload?: boolean;

}

const SaveAndReset: React.FC<SaveAndResetProps> = ({showDownload=true,}) => {
    const {grid, fileName}: any = useContext(ExcelContext);
    const [isDownload, setIsDownload] = useState(false);

    const onClickRefresh = useCallback(() => {
        window.location.reload();
    }, []);

    const onClickExcelDown = () => {
        setIsDownload(true);

        try {
            grid.excelDownload(fileName);
        } catch (error) {
            console.error("Excel Download Error:", error);
            alert("엑셀 저장 중 오류가 발생했습니다.");
        } finally {
            setIsDownload(false);
        }
    }

    return (



                        <button disabled={isDownload} onClick={onClickExcelDown} className="btnExcel">
                            {isDownload ? "저장 중..." : "엑셀저장"}
                        </button>



    )
};

export default React.memo(SaveAndReset);
