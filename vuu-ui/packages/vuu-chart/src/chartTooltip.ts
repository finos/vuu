import { DataSourceValue } from "./ChartSeries";

export interface TooltipParams {
    axisValueLabel: string
    color: string;
    componentType: string;
    componentSubType: string;
    data: DataSourceValue;
    seriesName: string;
    seriesType: 'line' | 'scatter';
    value: number;
}

export const chartTooltip = (params: TooltipParams[]) => {

    if (params.length > 0){
        const [{axisValueLabel}] = params;

        const values = [];

        for (const {color, seriesName, seriesType, value} of params){
            if (seriesType === 'line'){
                values.push({color, value, seriesName})
            }
        }
        
        const tooltipEntries = values.map(({color, value, seriesName}) => 
                ['<div class="vuuChart-tooltip-entry">',
                 `<span class="vuuChart-tooltip-icon" style="background:${color};"></span>`,
                 `<span class="vuuChart-tooltip-label">${seriesName}</span>`,
                 `<span class="vuuChart-tooltip-value">${value ?? 'n/a'}</span>`,
                 '</div>'
                ].join(""));


        return [
            `<div class="vuuChart-tooltip-title">${axisValueLabel}</div>`,
            '<div class="vuuChart-tooltip-container">']
            .concat(tooltipEntries)
            .concat('</div>')
            .join("");

    }

}
