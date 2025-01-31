import{ useState } from "react"
import { Web3Engine, EngineArgs } from "@sb-labs/web3-engine"
import { Button, Input, Textarea } from "@sb-labs/basic-components/dist"
import "./Create.css"

import * as CryptoJS from 'crypto-js'

interface CreateProps{
    mobile: boolean;
    setComp: any;
    setEngineProps: any;
}

export const Create = (props: CreateProps) => {
    const [state, setState] = useState<string>("Password")

    const [password, setPassword] = useState<string>("")

    const [mnemonic, setMnemonic] = useState<string>("")

    const [error, setError] = useState<string>("")

    const changePassword = (e: any) =>{
        //console.log(e.target.value)
        if(e.target.value.length < 12){
            setError("Password must be at least 12 characters.")
            return
        }
        setError("")
        setPassword(e.target.value)

    }

    const createWallet = () =>{
        if(password.length < 12){
            setError("Password must be at least 12 characters.")
            return
        }
        console.log("Creating Wallet")
        const engine = new Web3Engine({} as EngineArgs);
        const mnemonic = engine.generateMnemonic()
        setMnemonic(mnemonic)
        setState("Mnemonic")
    }

    const encryptWallet = () =>{
        console.log("memonic", mnemonic)
        let encryptedUser = CryptoJS.AES.encrypt(mnemonic, password).toString();
        let hmac = CryptoJS.HmacSHA256(encryptedUser, CryptoJS.SHA256(password)).toString();
        localStorage.setItem('tags-wallet', JSON.stringify({encryptedUser, hmac}))
        props.setEngineProps(undefined, "")
        props.setComp("Display")
    }

    const createKeydown = (e: any) =>{
        if(e.key == "Enter"){
            createWallet()
        }
    }

    return(
        <div id="create">
            {
                state == "Password" && <>
                    <h3>Create Wallet</h3>
                    <p>Enter a password to create a new wallet</p>
                    <Input placeholder="Password..." inputType="password" size="small" onChange={changePassword} onKeyDown={createKeydown}/>
                    <br/>
                    <Button size="large" text="Create Wallet" onClick={createWallet}/>
                    <br/>
                </>
            }
            {
                state == "Mnemonic" && <>
                    <h3>Write down your mnemonic</h3>
                    
                    <Textarea size="medium" theme="light" value={mnemonic} />
                    <br/>
                    <Button size="large" text="Encrypt Wallet" onClick={encryptWallet}/>
                </>
            }
            {error}
        </div>
    )
}
