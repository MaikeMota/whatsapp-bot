interface Sound {
    data: string;
    addedBy: string;
    addedAt: number;
}

export interface SoundBoardSaveState {
    [key: string]: Sound;
}