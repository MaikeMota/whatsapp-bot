export interface Sound {
    data: string;
    mimetype: string;
    addedBy: string;
    addedAt: number;
    reproductionCount: number;
    description: string;
}

export interface SoundBoardSaveState {
    [key: string]: Sound;
}