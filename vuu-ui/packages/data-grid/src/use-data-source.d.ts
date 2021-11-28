export default function useDataSource(dataSource: any, subscriptionDetails: any, renderBufferSize: any, callback: any): (any[] | ((lo: any, hi: any) => void))[];
export class MovingWindow {
    constructor({ lo, hi }: {
        lo: any;
        hi: any;
    });
    range: any;
    data: any[];
    rowCount: number;
    setRowCount: (rowCount: any) => void;
    add(data: any): void;
    getAtIndex(index: any): any;
    isWithinRange(index: any): any;
    setRange(from: any, to: any): void;
}
