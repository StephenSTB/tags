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
                {
                    /*<Button size="small" id="topbar-name-button" text="Name"/>
                    <Button size="small" id="topbar-message-button" text="Message"/>*/
                }
                <Button size="small" id="topbar-wallet-button" text="Wallet" onClick={() => props.setComp("Display")}/>
                <Button size="small" id="topbar-tag-button" text="Tag" onClick={() => props.setComp("Tag")}/>
            </div>
        </div>
    )
}