export interface RadarAlertsSaveState {
    [group: string]: { [user: string] : RadarAlert[] };
}


interface RadarAlert {
    ticker: string;
    price: number;
}