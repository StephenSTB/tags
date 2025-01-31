import {useEffect, useState} from "react"  
import { Web3Engine } from "@sb-labs/web3-engine"
import { Create } from "./components/create/Create"
import { View } from "./components/view/View"
import "./Name.css"

interface NameProps{
    engine: Web3Engine;
    network: string;
    setComp: any;
    host: string;
}

export const Name = (props: NameProps) => {

    const host = props.host;

    const engine = props.engine;
    const network = props.network;

    const [state, setState] = useState<string>("Create")

    
    /*Edit */
    /*Search*/
    

    useEffect(() => {
        if(engine === undefined){
            props.setComp("Display")
            return;
        }
        console.log("Name:", engine.defaultInstance?.contracts["Name"].options.address)
        const getName = async () =>{
            console.log(props.engine.defaultAccount)
            const name = await props.engine.sendTransaction(network, {from: engine.defaultAccount}, "Name", "Names", [engine.defaultAccount], true)
            console.log("Name:", name)  
            if(name.transaction != ""){
                setState("Edit")
                return
            }
        }
        getName()

    }, [])

    const setComp = (comp:string) =>{
        setState(comp)
    }
    
    
    /* Edit*/
    
    return(
        <>
            {state == "Create" && <Create engine={engine} network={network} host={host} setState={setComp}/> }
            {state == "Edit" &&<div id ="name"> 
                                <View engine={engine} network={network} host={host} setComp={setComp}/>
                                </div>}
            
            
        </>
    );
}