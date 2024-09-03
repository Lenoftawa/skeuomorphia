// Define interfaces
export interface Option {
    id: number;
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