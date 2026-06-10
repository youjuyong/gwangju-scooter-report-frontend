import {createContext, useState} from "react";

const ExcelContext = createContext({});

const ExcelProvider = ({children}: any) => {
    const [grid, setGrid] = useState(null);
    const [fileName, setFileName] = useState("");

    return (
        <ExcelContext.Provider value={{grid, setGrid, fileName, setFileName}}>
            {children}
        </ExcelContext.Provider>
    );
};

export {ExcelContext, ExcelProvider};