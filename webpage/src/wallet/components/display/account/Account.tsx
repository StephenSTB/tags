import { useEffect, useState } from "react";
import { Popup, Button, Icon, Divider, Input, Dropdown } from "@sb-labs/basic-components/dist";
import { copy } from "@sb-labs/images/";
import "./Account.css"
import { Web3Engine } from "@sb-labs/web3-engine";
import { isAddress } from "web3-utils";

interface AccountProps{
    engine: any;
    network: string;
    setEngineProps: any;
    mobile: boolean;
    setState: any;
}

export const Account = (props: AccountProps) =>{

    const [engine, setEngine] = useState<Web3Engine>()
    const [network, setNetwork] = useState<string>("")  
    const [account, setAccount] = useState<string>("")

    /* account */
    const [displayAccount, setDisplayAccount] = useState<string>("")
    const [copyState, setCopyState] = useState<boolean>(false)
    const [ether, setEther] = useState<string>("")
    /* send */
    const [toAddress, setToAddress] = useState<string>("")
    const [sentEther, setSentEther] = useState<string>("")
    const [etherSent, setEtherSent] = useState<string>("")
    const [etherTransacting, setEtherTransacting] = useState<boolean>(false)
    const [sendEtherGas, setSendEtherGas] = useState<number>(0);
    const [sendError, setSendError] = useState<string>("")
    /* network */
    const  options = [<option value="Ganache" key="Ganache">Ganache</option>,<option value="Sepolia" key="Sepolia">Sepolia</option>,<option value="Base" key="Base">Base</option>]

    /* useEffect Functions */
    const getEther = async () =>{
        console.log("Getting ether")
        const ether = engine?.web3Instances[network].web3.utils.fromWei(await engine?.web3Instances[network].web3.eth.getBalance(props.engine.defaultAccount as string), "ether")
        setEther(ether as string)
    }

    const getGas = async () =>{
        const gas = engine?.utils.fromWei((21000 * Number(await engine?.web3Instances[network]?.web3.eth.getGasPrice())).toString(), "ether") ;
        console.log(gas)
        setSendEtherGas(gas)
    }

    useEffect(() =>{
        if(props.engine === undefined){
            return;
        }

        getEther();
        
        getGas();
        
    }, [network, etherSent])

   useEffect(() =>{
        if(props.engine === undefined){
            return;
        }
        setAccount(props.engine.defaultAccount);
        setDisplayAccount(props.engine.defaultAccount.substring(0,6) + "..." + props.engine.defaultAccount.substring(props.engine.defaultAccount.length-4,props.engine.defaultAccount.length))

        setEngine(props.engine)
        setNetwork(props.network);

        getEther();

        getGas();
   }, [])

    /* account */
    const copyAddress = () =>{
        navigator.clipboard.writeText(account)
        setCopyState(true)
        setTimeout(() =>{
            setCopyState(false)
        }, 2000)
    }

    /*send */

    const changeSendAddress = (e: any) =>{
        console.log(e.target.value)
        if(isAddress(e.target.value)){
            setToAddress(e.target.value)
            setSendError("")
            return; 
        }
        setSendError("Invalid address given.")
    }

    const changeSendEther = (e: any) =>{
        if(!isNaN(e.target.value)){
            setSentEther(e.target.value)
            setSendError("")
            return;
        }
        setSendError("Invalid ether amount given.")
    }

    const sendEther = async () =>{
        setEtherTransacting(true)
        if(toAddress === ""){
            setSendError("No valid address given.")
            setEtherTransacting(false)
            return;
        }
        if(sentEther === ""){
            setSendError("No valid ether amount given.")
            setEtherTransacting(false)
            return;
        }
        if(Number(sentEther) > Number(ether)){
            setSendError("Not enough ether.")
            setEtherTransacting(false)
            return;
        }

        console.log(sentEther, ether, sendEtherGas)

        if(Number(ether) < (Number(sentEther) + Number(sendEtherGas))){
            setSendError("Not enough ether to cover gas.")
            setEtherTransacting(false)
            return;
        }

        console.log(account, toAddress, sentEther)
        const eth = engine?.web3Instances[network].web3.utils.toWei(sentEther, "ether")
        await engine?.sendTransaction(network as string, {from: account, to:toAddress, value: eth})
        const sent = engine?.defaultInstance?.web3.utils.fromWei(eth?.toString() as string, "ether")
        setEtherSent(sent as string + " sent to: " + toAddress)
        setEtherTransacting(false)
        
    }

    /* network */

    const networkChange = (e: any) =>{
        console.log("network change",e.target.value)
        const network0 = e.target.value;
        const defaultInstance = props.engine.web3Instances[network0]
        const engine = props.engine;

        engine.defaultInstance = defaultInstance
        setNetwork(network0)
        props.setEngineProps(engine, network0)
    }

    return(<>
        <div id="account">
            <div id="account-header">
                <h3>Account</h3>
                <div id="display-account">
                    <div id="display-account-string">{displayAccount}</div>
                    <div id="display-account-copy">
                        <Popup text='Copied!' offset={{bottom: "45px", right:"-25px"}} display={copyState} 
                        element={<Button size='icon' icon={<Icon size="mini" src={copy} round={true}/>} onClick={copyAddress} id="display-copy"/>}/>
                    </div>
                    
                </div>
                <div>Ether: {ether}</div>
            </div>
            <br/>
            <Divider />
            <div id="account-send">
                <h3>Send</h3>
                <Input size="small" placeholder="0x..." onChange={changeSendAddress}/>
                <div id="account-ether-input">
                    <Input size="small" placeholder="ether..." onChange={changeSendEther}/>
                    
                </div>
                <div> gas: {sendEtherGas}</div>
                <Button size="large" text="Send" id="account-send-button" onClick={sendEther} transacting={etherTransacting}/>
                <div>{sendError}</div>
                <div>{etherSent}</div>
            </div>
            <br/>
            <Divider />
            
            <div id="display-network">
                <h3>Network</h3>
                {network}
                <Dropdown id="network-dropdown" options={options} size="medium" theme="light" onChange={networkChange}></Dropdown>
            </div>
            <br />
            <Divider />
            <br/>
            <div id="display-back">
                <Button size="medium" id="display-back-button" text="Back" onClick={() => props.setState("Connect")}/>
            </div>
        </div>
    </>)
}