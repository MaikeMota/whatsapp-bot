interface Sound {
    data: string;
    mimetype: string;
    addedBy: string;
    addedAt: number;
}

export interface SoundBoardSaveState {
    [key: string]: Sound;
}