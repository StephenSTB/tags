import { useEffect, useState } from "react"
import { Web3Engine }from "@sb-labs/web3-engine/"
import { Topbar } from "./components/topbar/Topbar"
import { Create } from "./components/create/Create"
import "./Wallet.css"
import { Display } from "./components/display/Display"
import { Import } from "./components/import/Import"
import { Tag } from "./components/tag/Tag"

interface WalletProps{
    network: string,
    engine: Web3Engine,
    setEngineProps: any
}

export const Wallet = (props: WalletProps) =>{ 

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

    const setEngineProps = (engine: Web3Engine, network: string) =>{
        setEngine(engine)
        setNetwork(network);
    }

    return(
        <>
            <div id="wallet">
                <Topbar engine={engine} setComp={setComp}/>
                {state == "Create" &&
                    <Create mobile={mobile} setComp={setComp}/>
                }
                {state == "Display" &&  <Display mobile={mobile} engine={engine} network={network} setComp={setComp} setEngineProps={setEngineProps}/>}
                {state == "Import" &&  <Import mobile={mobile} setComp={setComp} />}
                {state == "Tag" &&  <Tag mobile={mobile} engine={engine as any} network={network} setComp={setComp} />}
            </div>
        </>
    )
}