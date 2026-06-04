import Highcharts from 'highcharts';

// 공통 다크 테마 및 기본 레이아웃 세팅 (중복 코드 제거)
const baseOptions = (titleText: string, categories: string[]): Highcharts.Options => ({
    chart: {
        backgroundColor: '#1e293b',
        style: { fontFamily: 'inherit' },
        borderRadius: 8,
        reflow: true,
    },
    title: {
        text: titleText,
        align: 'left',
        style: { fontSize: '16px', fontWeight: 'bold', color: '#f8fafc' }
    },
    credits: { enabled: false },
    xAxis: {
        categories: categories,
        gridLineWidth: 1,
        gridLineColor: '#334155',
        gridLineDashStyle: 'Dash',
        labels: { style: { color: '#94a3b8' } },
        crosshair: { width: 1, color: '#6366f1', dashStyle: 'LongDash' }
    },
    yAxis: {
        title: { text: '건수 (건)', style: { color: '#94a3b8' } },
        min: 0,
        gridLineColor: '#334155',
        labels: { style: { color: '#94a3b8' } },
        crosshair: { width: 1, color: '#475569', dashStyle: 'ShortDot' }
    },
    tooltip: {
        shared: true,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderWidth: 1,
        borderColor: '#475569',
        style: { color: '#f8fafc' },
        valueSuffix: ' 건'
    },
    legend: {
        itemStyle: { color: '#cbd5e1' },
        itemHoverStyle: { color: '#ffffff' }
    }
});

/**
 *  꺾은선 차트 (Line Chart) 생성 유틸
 */
export const createLineChartOptions = (
    titleText: string,
    categories: string[],
    seriesData: Highcharts.SeriesOptionsType[]
): Highcharts.Options => {
    return Highcharts.merge(baseOptions(titleText, categories), {
        chart: { type: 'line' },
        plotOptions: {
            line: {
                dataLabels: {
                    enabled: true,
                    style: { color: '#f8fafc', textOutline: 'none' }
                },
                enableMouseTracking: true
            }
        },
        series: seriesData
    });
};

/**
 *  막대 차트 (Column/Bar Chart) 생성 유틸
 */
export const createBarChartOptions = (
    titleText: string,
    categories: string[],
    seriesData: Highcharts.SeriesOptionsType[]
): Highcharts.Options => {
    return Highcharts.merge(baseOptions(titleText, categories), {
        chart: { type: 'column' }, // 세로 막대 모양
        plotOptions: {
            column: {
                dataLabels: {
                    enabled: true,
                    style: { color: '#f8fafc', textOutline: 'none' }
                },
                borderWidth: 0,
                enableMouseTracking: true
            }
        },
        series: seriesData
    });
};

/**
 *   원형 차트 (Pie Chart) 생성 유틸 (민원 보기용)
 */
export const createPieChartOptions = (
    titleText: string,
    seriesName: string,
    data: { name: string; y: number; color?: string }[]
): Highcharts.Options => {
    return Highcharts.merge(baseOptions(titleText, []), {
        chart: { type: 'pie' },
        xAxis: { visible: false },
        yAxis: { visible: false },
        tooltip: { shared: false },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %',
                    style: { color: '#f8fafc', textOutline: 'none' }
                },
                showInLegend: true
            }
        },
        series: [{
            name: seriesName,
            colorByPoint: true,
            data: data
        }] as any
    });
};