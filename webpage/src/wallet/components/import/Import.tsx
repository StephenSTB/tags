import { Input, Button } from "@sb-labs/basic-components/dist"

import { Web3Engine, EngineArgs } from "@sb-labs/web3-engine"

import { useState } from "react"

import * as CryptoJS from 'crypto-js'

import "./Import.css"

interface ImportProps{
    mobile: boolean,
    setComp: any
}

export const Import = (props: ImportProps) =>{

    const [mnemonic, setMnemonic] = useState<string>("")

    const [password, setPassword] = useState<string>("")

    const [error, setError] = useState<string>("")

    const changeMnemonic = (e: any) =>{
        const engine = new Web3Engine({} as EngineArgs)
        if(!engine.validateMnemonic(e.target.value)){
            setError("Invalid mnemonic given.")
            return;
        }
        setMnemonic(e.target.value)
        setError("")
    }

    const changePassword = (e: any) =>{
        console.log(e.target.value)
        if(e.target.value.length < 12){
            setError("Password not long enough.")
            return;
        }
        setPassword(e.target.value)
        setError("")
        
    }

    const keyPassword = (e: any) =>{
        if(e.keyCode === 13){
            importWallet()
        }
    }

    const importWallet = () =>{
        console.log("importing")
        const engine = new Web3Engine({} as EngineArgs)
        if(!engine.validateMnemonic(mnemonic as string)){
            setError("Invalid mnemonic given.")
            return
        }
        if(password.length < 12 ){
            setError("Password not long enough.")
            return;
        }
        

        let encryptedUser = CryptoJS.AES.encrypt(mnemonic, password).toString();
        let hmac = CryptoJS.HmacSHA256(encryptedUser, CryptoJS.SHA256(password)).toString();
        localStorage.setItem('tags-wallet', JSON.stringify({encryptedUser, hmac}))
        props.setComp("Display")
    }
    
    return(<>
                <div id="import">
                    <h3>Import Wallet</h3>
                    <p>Import your wallet to the Tags Network</p>
                    <Input size="small" placeholder="Mnemonic" inputType="password" onChange={changeMnemonic}/>
                    <br/>
                    <Input size="small" placeholder="Password" inputType="password" onChange={changePassword} onKeyDown={keyPassword}/>
                    {error}
                    
                    <div id="import-buttons">
                        <Button size="small" id="import-back-button" text="Back" onClick={() => props.setComp("Display")}/>
                        <Button size="small" id="import-import-button" text="Import" onClick={importWallet}/>
                    </div>
                    
                </div>
            </>)
}