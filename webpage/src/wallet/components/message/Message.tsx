
import { Web3Engine } from "@sb-labs/web3-engine"
import "./Message.css"
import { Input, Textarea, Icon, Button } from "@sb-labs/basic-components/dist";
import { ethereum_black } from "@sb-labs/images";
import { useEffect, useState } from "react";
import { isAddress } from "web3-utils";
import { zeroAddress } from "../helper/Helper";
import {ecrecover, toBuffer} from "ethereumjs-util";
import { toBN } from "web3-utils";
import axios from "axios";

interface MessageProps{
    engine: Web3Engine;
    network: string;
    host: string;
    setComp: any;
}

export const Message = (props: MessageProps) => { 

    const engine = props.engine;
    const network = props.network;
    const account = engine?.defaultAccount;
    const host = props.host;

    const [state, setState] = useState<string>("CreateKey")
    const [updated, setUpdated] = useState<boolean>(false)

    const [count, setCount] = useState<number>(10)
    const [from, setFrom] = useState<string>("")
    const [fromAvatar, setFromAvatar] = useState<string|undefined>(undefined)
    const [viewMessagesError, setViewMessagesError] = useState<string>("")
    const [messageArray, setMessageArray] = useState<any[]>([])

    const[countMessages, setCountMessages] = useState<number>(0)
    const[countSentMessages, countNumSentMessages] = useState<number>(0)

    /*Message*/
    const [keyGas, setKeyGas] = useState<number>(0)
    const [to, setTo] = useState<string>("")
    const [message, setMessage] = useState<string>("")
    const [showValue, setShowValue] = useState<boolean>(false)
    const [value, setValue] = useState<number>(0)
    const [transacting, setTransacting] = useState<boolean>(false)

    const [cost, setCost] = useState<number>(0)

    const [keyError, setKeyError] = useState<string>("")
    const [messagePrompt, setMessagePrompt] = useState<string>("")
    const [messageError, setMessageError] = useState<string>("")
    

    useEffect(() =>{
        if(props.engine === undefined){
            props.setComp("Display")
            return;
        }

        const getKey = async() =>{
            const key = await engine.sendTransaction(network, {from: account}, "PublicKeys", "SignKeys", [account], true)
            console.log(key.transaction.v)

            if(key.transaction.v != 0){
                setState("Message")
                return;
            }
            const sig = await engine.defaultInstance?.web3.eth.sign("Enable Public Key.", account as string)
            const keyGas = await engine.getGas(network, {from: account}, "PublicKeys", "register", [sig])
            setKeyGas(engine.utils.fromWei(keyGas.gas.toString(), "ether"))
        }
        
        getKey()

    },[updated])

    useEffect(() =>{
        const divElement = document.getElementById('message-view-box-inner');
        divElement?.scrollTo(0, divElement.scrollHeight);
    },[messageArray])

    useEffect(() =>{
        const interval = setInterval(() =>{
            setCount(count - 1)
        }, 1000)

        if(count % 10 == 0){
            setCount(10)
            const getMessages = async () =>{
                if(!isAddress(from)){
                    return;
                }
                //TODO Cleaner way to get messages
                const numMessages = (await engine.sendTransaction(network, {from: account}, "Messages", "numMessages", [account, from], true)).transaction
                console.log(numMessages)
                let messages = []
                if(numMessages != 0){
                    messages = (await engine.sendTransaction(network, {from: account}, "Messages", "getMessages", [account, from, 0, Number(numMessages)-1], true)).transaction
                    console.log(messages)
                }
                setViewMessagesError("")
            
                /* get sent messages */
                const numSentMessages = (await engine.sendTransaction(network, {from: account}, "Messages", "numMessages", [from, account ], true)).transaction
                console.log("numSentMessages: ", numSentMessages)
        
                let sentMessages = []
                if(numSentMessages != 0){
                    sentMessages = (await engine.sendTransaction(network, {from: account}, "Messages", "getMessages", [from, account, 0, Number(numSentMessages)-1], true)).transaction
                }

                
                const messagesArr = []
                let i = 0;
                let j = 0;
                let maxI = Number(numMessages)
                let maxJ = Number(numSentMessages)
                console.log(sentMessages)
                while(i < maxI && j < maxJ){
                    //console.log(messages[i].timestamp)
                    console.log(sentMessages[j])
                    if(Number(messages[i].timestamp) > Number(sentMessages[j].timestamp)){
                        const encrypted_from = new Uint8Array(Buffer.from(sentMessages[j].encrypted_from.slice(2), "hex"))
                        const decrypted_message = await engine.decrypt(0, encrypted_from)
                        //console.log(decrypted_message.toString())
                        messagesArr.push({
                            value: sentMessages[j].value,
                            message: decrypted_message.toString(),
                            side: "right"
                        })
                        j++
                    }else{
                        const encrypted_message = new Uint8Array(Buffer.from(messages[i].encrypted_message.slice(2), "hex"))
                        const decrypted_message = await engine.decrypt(0, encrypted_message)
                        //console.log(decrypted_message.toString())
                        messagesArr.push({
                            value: messages[i].value,
                            message: decrypted_message.toString(),
                            side: "left"
                        })
                        i++
                    }
                }
                
                if(i < maxI){
                    for(i; i < maxI; i++){
                        const encrypted_message = new Uint8Array(Buffer.from(messages[i].encrypted_message.slice(2), "hex"))
                        const decrypted_message = await engine.decrypt(0, encrypted_message)
                        //console.log(decrypted_message.toString())
                        messagesArr.push({
                            value: messages[i].value,
                            message: decrypted_message.toString(),
                            side: "left"
                        })
                    }
                }
                console.log(j)
                console.log(sentMessages)
                if(j < maxJ){
                    for(j; j < maxJ; j++){
                        const encrypted_from = new Uint8Array(Buffer.from(sentMessages[j].encrypted_from.slice(2), "hex"))
                        const decrypted_message = await engine.decrypt(0, encrypted_from)
                        //console.log(decrypted_message.toString())
                        messagesArr.push({
                            value: sentMessages[j].value,
                            message: decrypted_message.toString(),
                            side: "right"
                        })
                    }
                }
                setMessageArray(messagesArr)
            }
            getMessages()
        }

        return () => clearInterval(interval)

    },[count])

    setInterval(async () =>{
        
        
       
    }, 1000)

    const changeFrom = async (e: any) =>{

        let from = e.target.value
        //TODO allow names
        const resolvename = await engine.sendTransaction(network, {from: account}, "Name", "NamesResolver", [e.target.value], true)
        if(resolvename.transaction != zeroAddress){
            from = resolvename.transaction
        }

        setFrom(from)

        if(!isAddress(from)){
            setViewMessagesError("Invalid address.")
            return;
        }

        const name = await engine.sendTransaction(network, {from: account}, "Name", "Names", [from], true)
        console.log(name.transaction)
        if(name.transaction != ""){
            const req = await axios.get(host + "/avatar/" + name.transaction, {responseType: 'blob'})
            const text = await req.data.text()
            console.log(text)
            if(text != "No Avatar" && text != "Name doesn't exist"){
                const avatar = URL.createObjectURL(req.data)
                setFromAvatar(avatar)
            }
        }

        /* messages from account to */
        
    }

    const createKey = async () =>{
        setTransacting(true)
        const sig = await engine.defaultInstance?.web3.eth.sign("Enable Public Key.", account as string);

        const balance = engine.utils.fromWei((await engine.defaultInstance?.web3.eth.getBalance(account as string))?.toString(), "ether");
        console.log("balance: ", balance);

        if(Number(balance) < Number(keyGas)){
            setKeyError("Insufficient funds.");
            setTransacting(false);
            return;
        }

        const publickeys_tx = await engine.sendTransaction(network, {from: account},  "PublicKeys", "register", [sig])

        if(!publickeys_tx.success){
            console.log(publickeys_tx.error)
            return;
        }

        setUpdated(!updated)
        setTransacting(false)
    }

    const changeTo = async (e: any) =>{
        console.log(e.target.value)
        if(isAddress(e.target.value)){
            const publicKey1 = await engine.sendTransaction(network, {from: account}, "PublicKeys", "SignKeys", [e.target.value], true)
            if(publicKey1.transaction.v == 0){
                setMessageError("User is not Registered.")
                return
            }
            setTo(e.target.value)
            setMessagePrompt("Message to: " + e.target.value)
            setMessageError("")
            await getSendMessageCost(e.target.value, value, message)
            return;
        }
        const name = await engine.sendTransaction(network, {from: account}, "Name", "NamesResolver", [e.target.value], true)

        console.log(name.transaction)

        if(name.transaction == zeroAddress){
           setMessageError("Name not found.");
           return
        }
        setMessagePrompt("Message to: " + e.target.value)

        setMessageError("");

        setTo(name.transaction)

        await getSendMessageCost(e.target.value, value, message)
        
    }

    const changeMessage = (e: any) =>{
        if(e.target.value.length > 300){
            setMessageError("Message to long.")
            return;
        }
        getSendMessageCost(to, engine.utils.fromWei(value.toString(), "ether"), e.target.value)
        setMessage(e.target.value)
    }

    const changeMessageValue = async (e: any) =>{

        if(isNaN(e.target.value)){
            setMessageError("Invalid value.")
            return;
        }
        const balance = engine.utils.fromWei((await engine.defaultInstance?.web3.eth.getBalance(account as string))?.toString(), "ether");
        console.log("balance: ", balance);

        //TODO: get gas for message
        //const gas = (await engine.getGas(network, {from: account}, "Messages", "message", [to, message])).toString()

        const value = Number(e.target.value)
        if((Number(balance)) < Number(value)){
            setMessageError("Insufficient funds.")
            return;
        }
        getSendMessageCost(to, value, message)
        setValue(engine.utils.toWei(value.toString(), "ether"))
    }

    const getSendMessageCost = async (to:string, value:number, message: string) =>{
        //TODO: get gas for message

        console.log("Message Cost")

        if(!isAddress(to)){
            setCost(0)
            return;
        }

        const enableHash = await engine.sendTransaction(network, {from: account}, "PublicKeys", "EnableHash", [], true)
        const publickeys1_tx = await engine.sendTransaction(network, {from: account}, "PublicKeys", "SignKeys", [to], true)
        const publicKey1 = publickeys1_tx.transaction
        const keybuf1 = new Uint8Array( Buffer.from("04" + ecrecover(toBuffer(enableHash.transaction as string), Number(publicKey1.v), toBuffer(publicKey1.r as string), toBuffer(publicKey1.s as string)).toString('hex'), "hex"))
        const encrypted_message = await engine.encrypt(keybuf1, message)
    
        const publickeys2_tx = await engine.sendTransaction(network, {from: account}, "PublicKeys", "SignKeys", [account], true)
        const publicKey2 = publickeys2_tx.transaction
        const keybuf2 = new Uint8Array( Buffer.from("04" + ecrecover(toBuffer(enableHash.transaction as string), Number(publicKey2.v), toBuffer(publicKey2.r as string), toBuffer(publicKey2.s as string)).toString('hex'), "hex"))
        const from_message = await engine.encrypt(keybuf2, message)

        const v = engine.utils.toWei(value.toString(), "ether")
        const gas = (await engine.getGas(network, {from: account, value: v}, "Messages", "sendMessage", [[to, v , encrypted_message, from_message, 0]])).gas.toString()
        const cost = Number(engine.utils.fromWei(gas, "ether")) + Number(value.toString());
        console.log(cost)
        setCost(Number(cost))
    }

    const sendMessage = async () =>{
        setTransacting(true)
        if(!isAddress(to)){
            setMessageError("Invalid to field.")
            setTransacting(false)
            return;
        }
        if(message == ""){
            setMessageError("No message given.")
            setTransacting(false)
            return;
        } 
        const enableHash = await engine.sendTransaction(network, {from: account}, "PublicKeys", "EnableHash", [], true)
        const publickeys1_tx = await engine.sendTransaction(network, {from: account}, "PublicKeys", "SignKeys", [to], true)
        const publicKey1 = publickeys1_tx.transaction
        const keybuf1 = new Uint8Array( Buffer.from("04" + ecrecover(toBuffer(enableHash.transaction as string), Number(publicKey1.v), toBuffer(publicKey1.r as string), toBuffer(publicKey1.s as string)).toString('hex'), "hex"))
        const encrypted_message = await engine.encrypt(keybuf1, message)
    
        const publickeys2_tx = await engine.sendTransaction(network, {from: account}, "PublicKeys", "SignKeys", [account], true)
        const publicKey2 = publickeys2_tx.transaction
        const keybuf2 = new Uint8Array( Buffer.from("04" + ecrecover(toBuffer(enableHash.transaction as string), Number(publicKey2.v), toBuffer(publicKey2.r as string), toBuffer(publicKey2.s as string)).toString('hex'), "hex"))
        const from_message = await engine.encrypt(keybuf2, message)

        const msg = {
            to: to,
            value: value,
            encrypted_message,
            from_message,
            timestamp: 0
        }
        console.log("value", value)
        
        // TODO Find error
        const msg_tx = await engine.sendTransaction(network, {from: account, value: value}, "Messages", "sendMessage", [[msg.to, value, msg.encrypted_message, msg.from_message, msg.timestamp]])
        console.log(msg_tx)

       

        console.log("Message Sent")
        setMessageError("")
        setMessagePrompt("Sent Message to: " + to)
        setTransacting(false)
    }   
    return(
        <div id="message">
            <div id="message-view"> 
                <div id="message-from-box">
                    <Input id="message-from" placeholder="from..." size="small" onChange={changeFrom}/>
                    {fromAvatar !== undefined && <Icon id="message-from-avatar" src={fromAvatar} size="small"/>}
                    {count}
                </div>
                <>{viewMessagesError}</>
                <div id="message-view-box-outer">
                    <div id="message-view-box-inner">
                    {messageArray.map((message, index) =>(
                        <div className="message-message-box" key={index}>
                            {message.side == "right" && <div className="message-space-left">{Number(engine.utils.fromWei(message.value, "ether")).toFixed(6)}</div>}
                            <Textarea size="mini" value={message.message.toString() as string} />
                            {message.side == "left" && <div className="message-space-right">{Number(engine.utils.fromWei(message.value, "ether")).toFixed(6)}</div>}
                        </div>
                    ))}
                    </div>
                </div>
            </div>
            <div id="message-send">
                {state == "Message" && 
                <>  
                    <Input id="message-to-input" size="small" placeholder="to..." onChange={changeTo}/>
                    <Textarea size="small" placeholder="message..." onChange={changeMessage}/>
                    {showValue && <Input id="message-ether" size="small" placeholder="ether..." onChange={changeMessageValue}/>}
                    <div id="message-buttons">
                        <Button id="message-value-button" size="icon" icon={<Icon size="mini" src={ethereum_black} />} onClick={() => setShowValue(!showValue)}/>
                        <Button id="message-send-button" size="medium" text="Send" onClick={sendMessage} transacting={transacting}/>
                    </div>
                    {cost != 0 && <div>Cost: {cost}</div>}
                    {messagePrompt}
                    <br/>
                    {messageError}
                </>
                }
                {state == "CreateKey" && 
                <div id="message-create-key">
                    
                    <Button id="create-key-button" size="large" text="Create Key" onClick={createKey} transacting={transacting}/>
                    <br/>
                    gas: {keyGas}
                    <br/>
                    {keyError}
                </div>
                    
                }
            </div>
        </div>
    )
}