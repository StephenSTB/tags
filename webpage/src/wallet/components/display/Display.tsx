import { useState } from "react";

import { Button, Input } from "@sb-labs/basic-components/dist";

import { Web3Engine, EngineArgs } from "@sb-labs/web3-engine";

import { Providers, providers, deployed } from "@sb-labs/web3-data";

import { contractFactoryV2 } from "@sb-labs/contract-factory-v2";

import { Account } from "./account/Account";

import * as CryptoJS from 'crypto-js';

import "./Display.css";

interface DisplayProps{
    engine: any;
    network: string;
    setComp: any;
    setEngineProps: any;
    mobile: boolean;
}

export const Display = (props: DisplayProps) => {

    const [state, setState] = useState<string>("Connect")

    const [engine, setEngine] = useState<Web3Engine>();
    const [network, setNetwork] = useState<string>(props.network);
    const [account , setAccount] = useState<string>()
    

    const [error, setError] = useState<string>("")


    /*Display */
    const connectWallet = async () =>{
        const encryptedWallet = JSON.parse(localStorage.getItem("tags-wallet") as string);
        console.log(encryptedWallet)

        let vhmac = CryptoJS.HmacSHA256(encryptedWallet.encryptedUser, CryptoJS.SHA256("password1234")).toString(); // undo

        //console.log(vhmac)

        if(encryptedWallet.hmac != vhmac){
            setError("Incorrect Password. Try password again or import mnemonic.");
            return;
        }
        setError("")

        let mnemonic = CryptoJS.AES.decrypt(encryptedWallet.encryptedUser, "password1234").toString(CryptoJS.enc.Utf8); //undo password is var

        console.log(mnemonic)

        //console.log(mnemonic)

        let prvdrs = {} as Providers;
        prvdrs["Ganache"] = providers["Ganache"]
        prvdrs["Sepolia"] = providers["Sepolia"]
        prvdrs["Base"] = providers["Base"]

        const engineArgs = 
        {
            browser: true,
            mnemonic, 
            defaultAccount: 0,
            networks: ["Ganache","Sepolia", "Base"], 
            defaultNetwork: "Ganache", 
            providers: prvdrs, 
            deployed, 
            contractFactory: contractFactoryV2, 
            contractFactoryVersion: 2
        } as EngineArgs
        
        const engine = await Web3Engine.initialize(engineArgs)

        const network = engine.defaultNetwork as string

        setEngine(engine)
        setNetwork(network)
        setAccount(engine.defaultAccount as string)

        props.setEngineProps(engine, network)

        setState("Account")

    }

    const changePassword = (e: any) =>{
        console.log(e.target.value)
        if(e.target.value.length < 12){
            setError("Password not long enough.")
        }
    }

    const keyPassword = (e: any) =>{
        if(e.keyCode == 13){
            connectWallet()
        }
    }
    /* end Display */

    return (
        <div id="display">
            {
                state == "Connect" && <>
                    <h3>Connect Wallet</h3>
                    <p>Connect your wallet to the Tags Network</p>
                    <Input size="small" placeholder="Password" inputType="password" onChange={changePassword} onKeyDown={keyPassword}/>
                    <div id="display-buttons">
                        <Button size="small" id="display-import-button" text="Import" onClick={() => props.setComp("Import")}/>
                        <Button size="small" id="display-connect-button" text="Connect Wallet" onClick={connectWallet}/>
                    </div>
                    {error}
                </>
                
            }
            {state == "Account" && 
                <>
                    <Account engine={engine} network={network} mobile={props.mobile} setEngineProps={props.setEngineProps}/>
                </>
            }
        </div>
    )
}