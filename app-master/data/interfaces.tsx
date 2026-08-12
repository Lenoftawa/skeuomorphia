// Define interfaces
export interface Option {
    actionId: number;
    message: string;
}

export interface ScreenOption {
    left: Option;
    right: Option;
}

export interface Screen {
    title: string;
    options: ScreenOption[];
}