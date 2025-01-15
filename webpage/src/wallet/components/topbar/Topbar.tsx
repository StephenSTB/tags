import { Button } from "@sb-labs/basic-components/dist"
import "./Topbar.css"


export const Topbar = () =>{
    return(
        <div id="topbar">
            <div id="center">
                {
                    /*<Button size="small" id="topbar-name-button" text="Name"/>
                    <Button size="small" id="topbar-message-button" text="Message"/>*/
                }
                
                <Button size="small" id="topbar-message-button" text="Tag"/>
            </div>
        </div>
    )
}