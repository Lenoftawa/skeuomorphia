import { Screen } from "./interfaces";
import { ActionEnum } from "./action-enums";

export const screenDisconnected: Screen = {
    title: "Please Authenticate to the ATM",
    options: [
        {
            left: {
                actionId: ActionEnum.NO_ACTION,
                message: "", 
            },
            right: {
                actionId: ActionEnum.NO_ACTION,
                message: "", 
            },
        },
        {
            left: {
                actionId: ActionEnum.NO_ACTION,
                message: "", 
            },
            right: {
                actionId: ActionEnum.NO_ACTION,
                message: "", 
            },
        },
        {
            left: {
                actionId: ActionEnum.NO_ACTION,
                message: "", 
            },
            right: {
                actionId: ActionEnum.NO_ACTION,
                message: "", 
            },
        },
        {
            left: {
                actionId: ActionEnum.PROCESS_LOGIN,
                message: "Login to ATM", 
            },
            right: {
                actionId: ActionEnum.PROCESS_LOGIN,
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
                actionId: ActionEnum.GO_WITHDRAW_MENU,
                message: "Withdraw", 
            },
            right: {
                actionId: ActionEnum.PROCESS_DEPOSIT,
                message: "Deposit", 
            },
        },
        {
            left: {
                actionId: ActionEnum.PROCESS_BALANCE,
                message: "Balance", 
            },
            right: {
                actionId: ActionEnum.GO_BANK_MENU,
                message: "Banks", 
            },
        },
        {
            left: {
                actionId: ActionEnum.PROCESS_STATEMENT,
                message: "Statement", 
            },
            right: {
                actionId: ActionEnum.PROCESS_INVEST,
                message: "Invest", 
            },
        },
        {
            left: {
                actionId: ActionEnum.GO_CURRENCY_MENU,
                message: "Currencies", 
            },
            right: {
                actionId: ActionEnum.PROCESS_LOGOUT,
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
                actionId: ActionEnum.PROCESS_WITHDRAW_1,
                message: "$1", 
            },
            right: {
                actionId: ActionEnum.PROCESS_WITHDRAW_5,
                message: "$5", 
            },
        },
        {
            left: {
                actionId: ActionEnum.PROCESS_WITHDRAW_10,
                message: "$10", 
            },
            right: {
                actionId: ActionEnum.PROCESS_WITHDRAW_20,
                message: "$20", 
            },
        },
        {
            left: {
                actionId: ActionEnum.PROCESS_WITHDRAW_50,
                message: "$50", 
            },
            right: {
                actionId: ActionEnum.PROCESS_WITHDRAW_100,
                message: "$100", 
            },
        },
        {
            left: {
                actionId: ActionEnum.EXECUTE_WITHDRAW,
                message: "Get Money", 
            },
            right: {
                actionId: ActionEnum.CANCEL_WITHDRAW,
                message: "Cancel", 
            },
        },
    ],
};

export const screenCurrencyMenu: Screen = {
    title: "Select a Currency",
    options: [
        {
            left: {
                actionId: ActionEnum.NO_ACTION,
                message: "USD", 
            },
            right: {
                actionId: ActionEnum.NO_ACTION,
                message: "BTC", 
            },
        },
        {
            left: {
                actionId: ActionEnum.NO_ACTION,
                message: "EUR", 
            },
            right: {
                actionId: ActionEnum.NO_ACTION,
                message: "ETH", 
            },
        },
        {
            left: {
                actionId: ActionEnum.NO_ACTION,
                message: "GBP", 
            },
            right: {
                actionId: ActionEnum.NO_ACTION,
                message: "DOGE", 
            },
        },
        {
            left: {
                actionId: ActionEnum.NO_ACTION,
                message: "", 
            },
            right: {
                actionId: ActionEnum.GO_MAIN_MENU,
                message: "Cancel", 
            },
        },
    ],
};

export const screenBankMenu: Screen = {
    title: "Select a Bank",
    options: [
        {
            left: {
                actionId: ActionEnum.NO_ACTION,
                message: "Ethereum", 
            },
            right: {
                actionId: ActionEnum.NO_ACTION,
                message: "Base", 
            },
        },
        {
            left: {
                actionId: ActionEnum.NO_ACTION,
                message: "Arbitrum", 
            },
            right: {
                actionId: ActionEnum.NO_ACTION,
                message: "ZKSync", 
            },
        },
        {
            left: {
                actionId: ActionEnum.NO_ACTION,
                message: "Optimism", 
            },
            right: {
                actionId: ActionEnum.NO_ACTION,
                message: "Starknet", 
            },
        },
        {
            left: {
                actionId: ActionEnum.NO_ACTION,
                message: "Scroll", 
            },
            right: {
                actionId: ActionEnum.GO_MAIN_MENU,
                message: "Cancel", 
            },
        },
    ],
};

