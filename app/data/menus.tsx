import { Screen } from "./interfaces";

export const screenBase: Screen = {
    title: "Are you sure you want to print a $100 banknote?",
    options: [
        {
            left: {
                id: 1,
                message: "1L", 
            },
            right: {
                id: 5,
                message: "1R", 
            },
        },
        {
            left: {
                id: 2,
                message: "2L", 
            },
            right: {
                id: 6,
                message: "2R", 
            },
        },
        {
            left: {
                id: 3,
                message: "3L", 
            },
            right: {
                id: 7,
                message: "3R", 
            },
        },
        {
            left: {
                id: 4,
                message: "4L", 
            },
            right: {
                id: 8,
                message: "4R", 
            },
        },
    ],
};

export const screenDisconnected: Screen = {
    title: "Please Authenticate to the ATM",
    options: [
        {
            left: {
                id: 11,
                message: "", 
            },
            right: {
                id: 15,
                message: "", 
            },
        },
        {
            left: {
                id: 12,
                message: "", 
            },
            right: {
                id: 16,
                message: "", 
            },
        },
        {
            left: {
                id: 13,
                message: "", 
            },
            right: {
                id: 17,
                message: "", 
            },
        },
        {
            left: {
                id: 14,
                message: "Login to ATM", 
            },
            right: {
                id: 18,
                message: "Login to ATM", 
            },
        },
    ],
};

export const screenMainMenu: Screen = {
    title: "Select a Option",
    options: [
        {
            left: {
                id: 21,
                message: "", 
            },
            right: {
                id: 25,
                message: "", 
            },
        },
        {
            left: {
                id: 22,
                message: "", 
            },
            right: {
                id: 26,
                message: "", 
            },
        },
        {
            left: {
                id: 23,
                message: "Withdraw", 
            },
            right: {
                id: 27,
                message: "Deposit", 
            },
        },
        {
            left: {
                id: 24,
                message: "Account", 
            },
            right: {
                id: 28,
                message: "Exit", 
            },
        },
    ],
};

export const screenWithdrawMenu: Screen = {
    title: "Select the Amount to Withdraw",
    options: [
        {
            left: {
                id: 31,
                message: "$1", 
            },
            right: {
                id: 35,
                message: "$5", 
            },
        },
        {
            left: {
                id: 32,
                message: "$10", 
            },
            right: {
                id: 36,
                message: "$20", 
            },
        },
        {
            left: {
                id: 33,
                message: "$50", 
            },
            right: {
                id: 37,
                message: "$100", 
            },
        },
        {
            left: {
                id: 34,
                message: "Get Money", 
            },
            right: {
                id: 38,
                message: "Cancel", 
            },
        },
    ],
};
