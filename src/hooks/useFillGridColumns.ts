import { RefObject, useEffect, useMemo, useRef, useState } from 'react';
import { CustomColumnDef } from '@rxjacx/raontec-grid';

const SCROLLBAR_BUFFER = 2;

/**
 * 컬럼 지정폭 합이 그리드 영역 실제 너비보다 좁을 때
 */
export function useFillGridColumns<T>(
    baseColumns: CustomColumnDef<T>[],
    ready: boolean = true
): { gridBoxRef: RefObject<HTMLDivElement | null>; columns: CustomColumnDef<T>[] } {
    const gridBoxRef = useRef<HTMLDivElement>(null);
    const [gridWidth, setGridWidth] = useState(0);

    useEffect(() => {
        if (!ready) return;
        const el = gridBoxRef.current;
        if (!el) return;

        const observer = new ResizeObserver((entries) => {
            setGridWidth(entries[0]?.contentRect.width ?? 0);
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, [ready]);

    const columns = useMemo<CustomColumnDef<T>[]>(() => {
        if (!gridWidth) return baseColumns;

        const fixedTotal = baseColumns.reduce((sum, col) => sum + (col.size ?? 0), 0);
        const availableWidth = gridWidth - SCROLLBAR_BUFFER;

        if (fixedTotal === 0 || availableWidth <= fixedTotal) return baseColumns;

        const scale = availableWidth / fixedTotal;
        return baseColumns.map((col) => ({
            ...col,
            size: Math.round((col.size ?? 0) * scale),
        }));
    }, [baseColumns, gridWidth]);

    return { gridBoxRef, columns };
}
