import { useEffect, useState } from "react"
import { Web3Engine }from "@sb-labs/web3-engine/"
import { Topbar } from "./components/topbar/Topbar"
import { Create } from "./components/create/Create"
import "./Wallet.css"
import { Display } from "./components/display/Display"
import { Import } from "./components/import/Import"
import { Tag } from "./components/tag/Tag"
import { Name } from "./components/name/Name"
import { Message } from "./components/message/Message"

interface WalletProps{
    network: string,
    engine: Web3Engine,
    setEngineProps: any
}

export const Wallet = (props: WalletProps) =>{ 

    const host = true ? "http://localhost:3001" : "http://15.223.186.84:3001"

    const [mobile, setMobile] = useState<boolean>(false)
    const [state, setState] = useState<string>("Create")

    const [engine, setEngine] = useState<Web3Engine>()
    const [network, setNetwork] = useState<string>("")

    useEffect(() =>{
        if(window.innerWidth < 900){
            setMobile(true)
        }
        let encryptedUser = localStorage.getItem("tags-wallet");
        console.log("mnemonic", encryptedUser)
        //localStorage.setItem("tags-wallet", "")
        if(encryptedUser === null || encryptedUser === ""){
            setState("Create")
            return;
        }
        setState("Display")
    },[])

    const setComp = (comp: string) =>{
        setState(comp)
    }

    const setEngineProps = (engine: Web3Engine | undefined, network: string) =>{
        setEngine(engine)
        setNetwork(network);
    }

    return(
        <>
            <div id="wallet">
                <Topbar engine={engine} setComp={setComp}/>
                {state == "Create" &&
                    <Create mobile={mobile} setComp={setComp} setEngineProps={setEngineProps}/>
                }
                {state == "Display" &&  <Display mobile={mobile} engine={engine} network={network} setComp={setComp} setEngineProps={setEngineProps}/>}
                {state == "Import" &&  <Import mobile={mobile} setComp={setComp} setEngineProps={setEngineProps}/>}
                {state == "Tag" &&  <Tag mobile={mobile} engine={engine as any} network={network} setComp={setComp} host={host} />}
                {state == "Name" &&  <Name engine={engine as any} network={network} setComp={setComp} host={host}/>}
                {state == "Message" &&  <Message engine={engine as any} network={network} setComp={setComp} host={host}/>}
            </div>
        </>
    )
}