import { useState } from 'react';
import { Screen } from '../data/interfaces';
import { screenDisconnected, screenMainMenu, screenWithdrawMenu } from '../data/menus';
import { ActionEnum } from '../data/action-enums';

export const useATMState = () => {
  const [screen, setScreen] = useState<Screen>(screenDisconnected);
  const [amount, setAmount] = useState(0);
  const [messageTop, setMessageTop] = useState("");
  const [messageBottom, setMessageBottom] = useState("");

  const handleWithdraw = (withdrawAmount: number) => {
    setAmount(prevAmount => prevAmount + withdrawAmount);
    setMessageTop(`$ ${amount + withdrawAmount}`);
  };

  const handleConfirm = () => {
    // Implement withdrawal logic here
    console.log(`Withdrawing ${amount}`);
    setScreen(screenMainMenu);
    setAmount(0);
    setMessageTop("");
    setMessageBottom("");
  };

  const handleCancel = () => {
    setScreen(screenMainMenu);
    setAmount(0);
    setMessageTop("");
    setMessageBottom("");
  };

  const handleAction = (action: ActionEnum) => {
    switch (action) {
      case ActionEnum.GO_WITHDRAW_MENU:
        setScreen(screenWithdrawMenu);
        setAmount(0);
        setMessageTop("$ 0");
        break;
      case ActionEnum.PROCESS_WITHDRAW_2:
      case ActionEnum.PROCESS_WITHDRAW_5:
      case ActionEnum.PROCESS_WITHDRAW_10:
      case ActionEnum.PROCESS_WITHDRAW_20:
      case ActionEnum.PROCESS_WITHDRAW_50:
      case ActionEnum.PROCESS_WITHDRAW_100:
        const withdrawAmount = [2, 5, 10, 20, 50, 100][action - ActionEnum.PROCESS_WITHDRAW_2];
        handleWithdraw(withdrawAmount);
        break;
      case ActionEnum.EXECUTE_WITHDRAW:
        handleConfirm();
        break;
      case ActionEnum.CANCEL_WITHDRAW:
        handleCancel();
        break;
      // Add other cases as needed
    }
  };

  return {
    screen,
    setScreen,
    amount,
    messageTop,
    messageBottom,
    handleAction
  };
};