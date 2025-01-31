import { Button } from "@sb-labs/basic-components/dist"
import "./Topbar.css"
import { Web3Engine } from "@sb-labs/web3-engine"

interface TopbarProps{
    engine: Web3Engine | undefined,
    setComp: any
}

export const Topbar = (props: TopbarProps) =>{

    

    return(
        <div id="topbar">
            <div id="center">
                <Button size="small" fontSize="large" id="topbar-wallet-button" text="Wallet" onClick={() => props.setComp("Display")}/>
                <Button size="small" fontSize="large" id="topbar-name-button" text="Name" onClick={() => props.setComp("Name")}/>
                <Button size="small" fontSize="large" id="topbar-message-button" text="Message" onClick={() => props.setComp("Message")}/>
                <Button size="small" fontSize="large" id="topbar-tag-button" text="Tag" onClick={() => props.setComp("Tag")}/>
            </div>
        </div>
    )
}