export const ExpandableCell = ({ row, getValue }: { row: any, getValue: () => any }) => (
    <>
        <div className="grid-expand-content">
            {/* 1. 여기서 row 객체로부터 꺼내서 바로 사용합니다 */}
            {row.getCanExpand() && (
                <button
                    onClick={row.getToggleExpandedHandler()} // 여기서 실행!
                    style={{
                        color: row.getIsExpanded()? '#fe493b' : '#555555'

                    }}>
                    {row.getIsExpanded() ? '▼' : '▶'}
                </button>
            )}
        </div>
        {getValue()}
    </>
)