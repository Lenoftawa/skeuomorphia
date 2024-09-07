import { Screen } from "./interfaces";
import { ActionEnum } from "./action-enums";

export const screenDisconnected: Screen = {
  title: "Skeuomorphica Bank",
  options: [
    {
      left: { message: "", actionId: ActionEnum.NO_ACTION },
      right: { message: "", actionId: ActionEnum.NO_ACTION },
    },
    {
      left: { message: "", actionId: ActionEnum.NO_ACTION },
      right: { message: "", actionId: ActionEnum.NO_ACTION },
    },
    {
      left: { message: "", actionId: ActionEnum.NO_ACTION },
      right: { message: "", actionId: ActionEnum.NO_ACTION },
    },
    {
      left: { message: "", actionId: ActionEnum.NO_ACTION },
      right: { message: "Sign in>", actionId: ActionEnum.PROCESS_LOGIN },
    },
  ],
};

export const screenMainMenu: Screen = {
  title: "Select amount",
  options: [
    {
      left: { message: "<100", actionId: ActionEnum.PROCESS_WITHDRAW_100 },
      right: { message: "10>", actionId: ActionEnum.PROCESS_WITHDRAW_10 },
    },
    {
      left: { message: "<50", actionId: ActionEnum.PROCESS_WITHDRAW_50 },
      right: { message: "5>", actionId: ActionEnum.PROCESS_WITHDRAW_5 },
    },
    {
      left: { message: "<20", actionId: ActionEnum.PROCESS_WITHDRAW_20 },
      right: { message: "2>", actionId: ActionEnum.PROCESS_WITHDRAW_2 },
    },
    {
      left: { message: "<Cancel", actionId: ActionEnum.PROCESS_LOGOUT },
      right: { message: "More>", actionId: ActionEnum.GO_MORE_OPTIONS },
    },
  ],
};

export const screenMoreOptions: Screen = {
  title: "Select option",
  options: [
    {
      left: { message: "<Balance", actionId: ActionEnum.GO_BALANCE },
      right: { message: "Deposit>", actionId: ActionEnum.GO_DEPOSIT },
    },
    {
      left: { message: "<Withdraw", actionId: ActionEnum.GO_WITHDRAW },
      right: { message: "Statement>", actionId: ActionEnum.VIEW_BANKNOTES },
    },
    {
      left: { message: "<Invest", actionId: ActionEnum.GO_INVEST },
      right: { message: "Currency>", actionId: ActionEnum.GO_CURRENCIES },
    },
    {
      left: { message: "<Cancel", actionId: ActionEnum.GO_MAIN_MENU },
      right: { message: "Settings>", actionId: ActionEnum.GO_SETTINGS },
    },
  ],
};

export const screenWithdrawMenu: Screen = {
  title: "Select amount",
  options: [
    {
      left: { message: "<100", actionId: ActionEnum.PROCESS_WITHDRAW_100 },
      right: { message: "10>", actionId: ActionEnum.PROCESS_WITHDRAW_10 },
    },
    {
      left: { message: "<50", actionId: ActionEnum.PROCESS_WITHDRAW_50 },
      right: { message: "5>", actionId: ActionEnum.PROCESS_WITHDRAW_5 },
    },
    {
      left: { message: "<20", actionId: ActionEnum.PROCESS_WITHDRAW_20 },
      right: { message: "2>", actionId: ActionEnum.PROCESS_WITHDRAW_2 },
    },
    {
      left: { message: "<Cancel", actionId: ActionEnum.CANCEL_WITHDRAW },
      right: { message: "More>", actionId: ActionEnum.NO_ACTION },
    },
  ],
};

export const screenConfirm: Screen = {
  title: "Please confirm",
  options: [
    {
      left: { message: "", actionId: ActionEnum.NO_ACTION },
      right: { message: "", actionId: ActionEnum.NO_ACTION },
    },
    {
      left: { message: "", actionId: ActionEnum.NO_ACTION },
      right: { message: "", actionId: ActionEnum.NO_ACTION },
    },
    {
      left: { message: "", actionId: ActionEnum.NO_ACTION },
      right: { message: "", actionId: ActionEnum.NO_ACTION },
    },
    {
      left: { message: "<Cancel", actionId: ActionEnum.CANCEL_WITHDRAW },
      right: { message: "Print>", actionId: ActionEnum.EXECUTE_WITHDRAW },
    },
  ],
};

export const screenBalance: Screen = {
  title: "Account Balance",
  options: [
    {
      left: { message: "", actionId: ActionEnum.NO_ACTION },
      right: { message: "", actionId: ActionEnum.NO_ACTION },
    },
    {
      left: { message: "", actionId: ActionEnum.NO_ACTION },
      right: { message: "", actionId: ActionEnum.NO_ACTION },
    },
    {
      left: { message: "", actionId: ActionEnum.NO_ACTION },
      right: { message: "", actionId: ActionEnum.NO_ACTION },
    },
    {
      left: { message: "<Back", actionId: ActionEnum.GO_MORE_OPTIONS },
      right: { message: "", actionId: ActionEnum.NO_ACTION },
    },
  ],
};

export const screenDeposit: Screen = {
  title: "Deposit Funds",
  options: [
    {
      left: { message: "", actionId: ActionEnum.NO_ACTION },
      right: { message: "", actionId: ActionEnum.NO_ACTION },
    },
    {
      left: { message: "", actionId: ActionEnum.NO_ACTION },
      right: { message: "", actionId: ActionEnum.NO_ACTION },
    },
    {
      left: { message: "", actionId: ActionEnum.NO_ACTION },
      right: { message: "", actionId: ActionEnum.NO_ACTION },
    },
    {
      left: { message: "<Back", actionId: ActionEnum.GO_MORE_OPTIONS },
      right: { message: "", actionId: ActionEnum.NO_ACTION },
    },
  ],
};

export const screenWithdraw: Screen = {
  title: "Withdraw Funds",
  options: [
    {
      left: { message: "<100", actionId: ActionEnum.PROCESS_WITHDRAW_100 },
      right: { message: "10>", actionId: ActionEnum.PROCESS_WITHDRAW_10 },
    },
    {
      left: { message: "<50", actionId: ActionEnum.PROCESS_WITHDRAW_50 },
      right: { message: "5>", actionId: ActionEnum.PROCESS_WITHDRAW_5 },
    },
    {
      left: { message: "<20", actionId: ActionEnum.PROCESS_WITHDRAW_20 },
      right: { message: "2>", actionId: ActionEnum.PROCESS_WITHDRAW_2 },
    },
    {
      left: { message: "<Back", actionId: ActionEnum.GO_MORE_OPTIONS },
      right: { message: "More>", actionId: ActionEnum.NO_ACTION },
    },
  ],
};

export const screenStatement: Screen = {
  title: "Print Statement",
  options: [
    {
      left: { message: "Select", actionId: ActionEnum.SELECT_BANKNOTE },
      right: { message: "Print", actionId: ActionEnum.PRINT_BANKNOTE },
    },
    {
      left: { message: "Previous", actionId: ActionEnum.PREVIOUS_BANKNOTE },
      right: { message: "Next", actionId: ActionEnum.NEXT_BANKNOTE },
    },
    {
      left: { message: "", actionId: ActionEnum.NO_ACTION },
      right: { message: "", actionId: ActionEnum.NO_ACTION },
    },
    {
      left: { message: "<Back", actionId: ActionEnum.GO_MAIN_MENU },
      right: { message: "", actionId: ActionEnum.NO_ACTION },
    },
  ],
};

export const screenInvest: Screen = {
  title: "Invest Funds",
  options: [
    {
      left: { message: "", actionId: ActionEnum.NO_ACTION },
      right: { message: "", actionId: ActionEnum.NO_ACTION },
    },
    {
      left: { message: "", actionId: ActionEnum.NO_ACTION },
      right: { message: "", actionId: ActionEnum.NO_ACTION },
    },
    {
      left: { message: "", actionId: ActionEnum.NO_ACTION },
      right: { message: "", actionId: ActionEnum.NO_ACTION },
    },
    {
      left: { message: "<Back", actionId: ActionEnum.GO_MORE_OPTIONS },
      right: { message: "", actionId: ActionEnum.NO_ACTION },
    },
  ],
};

export const screenCurrencies: Screen = {
  title: "Select Currency",
  options: [
    {
      left: { message: "<USDC", actionId: ActionEnum.NO_ACTION },
      right: { message: "ETH>", actionId: ActionEnum.NO_ACTION },
    },
    {
      left: { message: "<EUROC", actionId: ActionEnum.NO_ACTION },
      right: { message: "DOGE>", actionId: ActionEnum.NO_ACTION },
    },
    {
      left: { message: "<NZDT>", actionId: ActionEnum.NO_ACTION },
      right: { message: "PEPE>", actionId: ActionEnum.NO_ACTION },
    },
    {
      left: { message: "<Back", actionId: ActionEnum.GO_MORE_OPTIONS },
      right: { message: "More>", actionId: ActionEnum.NO_ACTION },
    },
  ],
};

export const screenSettings: Screen = {
  title: "Settings",
  options: [
    {
      left: { message: "", actionId: ActionEnum.NO_ACTION },
      right: { message: "", actionId: ActionEnum.NO_ACTION },
    },
    {
      left: { message: "", actionId: ActionEnum.NO_ACTION },
      right: { message: "", actionId: ActionEnum.NO_ACTION },
    },
    {
      left: { message: "", actionId: ActionEnum.NO_ACTION },
      right: { message: "", actionId: ActionEnum.NO_ACTION },
    },
    {
      left: { message: "<Back", actionId: ActionEnum.GO_MORE_OPTIONS },
      right: { message: "", actionId: ActionEnum.NO_ACTION },
    },
  ],
};
