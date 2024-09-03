"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { screenDisconnected, screenMainMenu, screenWithdrawMenu } from '../data/menus';
import { Screen } from '../data/interfaces';

export default function ATMComponent() {

    const [screen, setScreen] = useState<Screen>(screenDisconnected);
    const [messageTop, setMessageTop] = useState<string>("");
    const [messageBottom, setMessageBottom] = useState<string>("");
    const [amount, setAmount] = useState<number>(0); // Use useState for amount

    const handleButtonClick = (action: number) => {
        
        console.log("** " + action + " **");

        if (action === 18 || action === 14) {
            setScreen(screenMainMenu);
        }
        if (action === 28) {
            setScreen(screenDisconnected);
        }
        if (action === 23) {
            setScreen(screenWithdrawMenu);
            setAmount(0); // Reset amount using setAmount
            setMessageTop(`$ ${0}`);
        }

        // Withdraw
        if (action === 31) {
            setAmount(prevAmount => prevAmount + 1); // Update amount using setAmount
            setMessageTop(`$ ${amount + 1}`);
        }
        if (action === 32) {
            setAmount(prevAmount => prevAmount + 10); // Update amount using setAmount
            setMessageTop(`$ ${amount + 10}`);
        }
        if (action === 33) {
            setAmount(prevAmount => prevAmount + 50); // Update amount using setAmount
            setMessageTop(`$ ${amount + 50}`);
        }
        if (action === 35) {
            setAmount(prevAmount => prevAmount + 5); // Update amount using setAmount
            setMessageTop(`$ ${amount + 5}`);
        }
        if (action === 36) {
            setAmount(prevAmount => prevAmount + 20); // Update amount using setAmount
            setMessageTop(`$ ${amount + 20}`);
        }
        if (action === 37) {
            setAmount(prevAmount => prevAmount + 100); // Update amount using setAmount
            setMessageTop(`$ ${amount + 100}`);
        }
        if (action === 34) {
            // Process Withdraw
            console.log("Withdraw : " + amount);
        }
        if (action === 38) {
            // Exit
            setScreen(screenMainMenu);
            setAmount(0); // Reset amount using setAmount
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md bg-yellow-100 border-8 border-yellow-700 rounded-lg shadow-lg overflow-hidden">
                <div className="flex">

                    <div className="w-1/4 space-y-4 p-4">
                        <div style={{ height: '100px' }}></div>
                        {screen.options.map((item) => (
                            <Button
                                key={`left-${item.left.id}`}
                                variant="outline"
                                className="w-full h-12 bg-gray-200 border-2 border-gray-400"
                                onClick={() => handleButtonClick(item.left.id)}
                            />
                        ))}
                    </div>
                    <div className="w-1/2 p-4 bg-blue-500 text-white flex flex-col min-w-[216px]">
                        <div className="text-center mb-4 font-bold" style={{ height: '100px' }}>
                            {screen.title}
                            <p>{messageTop}</p>
                            <p>{messageBottom}</p>
                        </div>
                        <div className="flex-grow flex flex-col justify-between text-sm">
                            {screen.options.map((item) => (
                                <div className="flex justify-between pt-2" key={`left-option-${item.left.id}`}>
                                    <div key={`left-option-${item.left.id}`} className="text-left pr-2" style={{ maxWidth: '50%' }}>{item.left.message}</div>
                                    <div key={`right-option-${item.right.id}`} className="text-right pl-2" style={{ maxWidth: '50%' }}>{item.right.message}</div>
                                </div>
                            ))}

                        </div>
                    </div>
                    <div className="w-1/4 space-y-4 p-4">
                        <div style={{ height: '100px' }}></div>
                        {screen.options.map((item) => (
                            <Button
                                key={`right-${item.right.id}`}
                                variant="outline"
                                className="w-full h-12 bg-gray-200 border-2 border-gray-400"
                                onClick={() => handleButtonClick(item.right.id)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}