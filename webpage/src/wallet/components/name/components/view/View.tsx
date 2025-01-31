import { Web3Engine } from "@sb-labs/web3-engine";
import { useEffect, useState } from "react";
import { Icon, Textarea, Divider, Button, Input, Toggle } from "@sb-labs/basic-components/dist";
import { user, search, close, up_arrow } from "@sb-labs/images"
import {fileToUint8Array} from "../../../helper/Helper";
import * as Block from 'multiformats/block';
import * as raw from "multiformats/codecs/raw"
import { sha256 } from 'multiformats/hashes/sha2';
import axios from "axios";
import "./View.css"

interface ViewProps{
    engine: Web3Engine;
    network: string;
    host: string;
    setComp: any
}

export const View = (props: ViewProps) => {

    const engine = props.engine;
    const network = props.network;
    const host = props.host;

    const [name , setName] = useState<string>("")
    const [avatar, setAvatar] = useState(user)
    const [bio, setBio] = useState<string>("")
    const [protect, setProtect] = useState<string>("")
    const [toggle, setToggle] = useState<boolean>(false)
    const [expiry, setExpiry] = useState<string>("")

    const [extendTimestamp, setExtendTimestamp] = useState<boolean>(false);

    const [extendError, setExtendError] = useState<string>("")
    
    /*edit**/
    const [changedBio, setChangedBio] = useState<string>("")
    const [avatarFile, setAvatarFile] = useState<File>()
    const [avatarCid, setAvatarCid] = useState<string>("")
    const [iconImport, setIconImport] = useState<any>(user)

    const [editGas, setEditGas] = useState<string>("")

    const [transacting, setTransacting] = useState<boolean>(false)  

    const [updated, setUpdated] = useState<boolean>(false)

    const [error, setError] = useState<string>("")

    /*Search*/

    const [searchError, setSearchError] = useState<string>("");

    const [searchedName, setSearchedName] = useState<string>("");

    const [nameResolve, setNameResolve] = useState<string>("");

    const [searchedBio, setSearchedBio] = useState<string>("")

    const [searchedAvatar, setSearchedAvatar] = useState<any>()

    const [viewSearch, setViewSearch] = useState<boolean>(false)

    const [claimable, setClaimable] = useState<boolean>(false)

    useEffect(() => {

        const getName = async () =>{
            /* View Name */
            const name = await engine.sendTransaction(network, {from: engine.defaultAccount}, "Name", "Names", [engine.defaultAccount], true)
            console.log("View:", name)  
            setName(name.transaction)

            const info = await engine.sendTransaction(network, {from: engine.defaultAccount}, "Name", "Info", [engine.defaultAccount], true)
            console.log("Info:", info)
            setBio(info.transaction.bio)
            setAvatarCid(info.transaction.avatar)

            /* Extend Timestamp */
            const viewExtendTimestamp = await engine.sendTransaction(network, {from: engine.defaultAccount}, "Name", "viewExtendTimestamp", [info.transaction.name], true);
            console.log("extend timestamp", viewExtendTimestamp)
            setExtendTimestamp(viewExtendTimestamp.transaction)

            const _protected = (await engine.sendTransaction(network, {from: engine.defaultAccount}, "Name", "Protected", [], true)).transaction

            console.log(_protected)

            //setProtect(_protected)

            const _timeStamp = (await engine.sendTransaction(network, {from: engine.defaultAccount}, "Name", "getTimestamp", [], true)).transaction

            const _year = (await engine.sendTransaction(network, {from: engine.defaultAccount}, "Name", "Year", [], true)).transaction
            // (info.timestamp + year) - timestamp = time
            let seconds = (Number(info.transaction.timestamp) + Number(_year)) - Number(_timeStamp)
            let days = Math.floor(seconds / (60 * 60 * 24));
            let hours = Math.floor((seconds % (60 * 60 * 24)) / (60 * 60));
            let minutes = Math.floor((seconds % (60 * 60)) / 60);
            let secs = seconds % 60;
            //setExpiry(expiry.toString())

            console.log("days: ", days, " hours: ", hours, " minutes: ", minutes, " seconds: ", secs)

            const expiry = Number(info.transaction.timestamp) + Number(_year) > Number(_timeStamp) ? "days: " + days +  " hours: " +  hours +  " minutes: " +  minutes +  " seconds: " + secs : "Expired";

            seconds = (Number(info.transaction.timestamp) + Number(_protected)) - Number(_timeStamp)
            days = Math.floor(seconds / (60 * 60 * 24));
            hours = Math.floor((seconds % (60 * 60 * 24)) / (60 * 60));
            minutes = Math.floor((seconds % (60 * 60)) / 60);
            secs = seconds % 60;

            console.log("days: ", days, " hours: ", hours, " minutes: ", minutes, " seconds: ", secs)

            //console.log("prtected: ", _protected)

            const protect = Number(info.transaction.timestamp) + Number(_protected) > Number(_timeStamp) ? "days: " + days +  " hours: " +  hours +  " minutes: " +  minutes +  " seconds: " + secs : "Unprotected";

            setProtect(protect)

            /* Protected: bool Expiry: time*/
            setExpiry(expiry)


            /* Retrieve edit info gas */

            const gas = await engine.getGas(network, {from: engine.defaultAccount,}, "Name", "editInfo", ["A normal size bio that has to take about two sentances. this is the second sentance to fill the bio section.", info.transaction.avatar])
            console.log(gas)

            if(gas.success){
                setEditGas(engine.utils.fromWei( gas.gas.toString() ,"ether"))
            }

           /* Get Avatar */
            const resp = await axios.get(`${host}/avatar/` + name.transaction, {responseType: "blob"})

            console.log(await resp.data.text())

            const text = await resp.data.text()

            if(text !== "Name doesn't exist" && text !== "No Avatar"){
                const blob = resp.data;
                const blobUrl = URL.createObjectURL(blob);
                setAvatar(blobUrl)
            }
        }

        getName()

    }, [updated])

    const releaseName = async () =>{
        setTransacting(true);
        await engine.sendTransaction(network, {from: engine.defaultAccount}, "Name", "releaseName", [])
        setTransacting(false);
        props.setComp("Create")
    }

    const extendName = async () =>{
        setTransacting(true)
        const balance = engine.utils.fromWei(await engine.web3Instances[network].web3.eth.getBalance(engine.defaultAccount as string), "ether")

        const gas = await engine.getGas(network, {from: engine.defaultAccount}, "Name", "extendTimestamp", [])

        const cost = engine.utils.fromWei(gas.gas.toString(), "ether")

        console.log(balance, cost)

        if(Number(balance) < Number(cost)){
            setExtendError("Insufficient funds.")
            setTransacting(false)
            return
        }

        const extend_tx = await engine.sendTransaction(network, {from: engine.defaultAccount}, "Name", "extendTimestamp", [])

        if(!extend_tx.success){
            setExtendError("Name not extended. Check ether.")
            setTransacting(false)
            return
        }

        setTransacting(false)
        setExtendTimestamp(false)
        setUpdated(!updated)
    }


    /* Edit */

    const changeBio = (e: any) =>{
        if(e.target.value.length > 300){
            setError("Bio to long");
            return
        }
        setError("");
        setChangedBio(e.target.value)
    }

    const changeAvatar = async (e: any) =>{
            const avatarFile = ((document.getElementById("name-image")) as HTMLInputElement).files?.item(0)
            setAvatarFile(avatarFile as File)
    
            console.log(avatarFile?.type)
    
    
            console.log(await fileToUint8Array(avatarFile as File))
    
            const file = await fileToUint8Array(avatarFile as File)
    
            const block = await Block.encode({value: file, codec: raw, hasher: sha256})

            setAvatarCid(block.cid.toString())
            //setAvatarData(block as any)
    
            const blobUrl = URL.createObjectURL(avatarFile as File);
            setIconImport(blobUrl)
        }

    const editInfo = async () =>{
        console.log("Edit Info")
        setTransacting(true)

        const balance = engine?.utils.fromWei((await engine?.web3Instances[network]?.web3.eth.getBalance(engine.defaultAccount as string))?.toString(), "ether");

        console.log(balance)

        if(Number(balance) < Number(editGas)){
            setError("Insufficient funds.")
            setTransacting(false)
            return
        }
    
        await engine.sendTransaction(network, {from: engine.defaultAccount}, "Name", "editInfo", [changedBio, avatarCid])

        const info = await engine.sendTransaction(network, {from: engine.defaultAccount}, "Name", "Info", [engine.defaultAccount], true);

        console.log(info)

        console.log(avatarCid)

        if(avatarCid == ""){
            return;
        }
        
        const formdata = new FormData();
        formdata.append('file', avatarFile as Blob, avatarFile?.name)
        formdata.append('data', JSON.stringify({name: name}))
        const res = await axios.post(`${host}/avatar/`, formdata, {
            headers:{
                "Content-Type": 'multipart/form-data'
            } 
        })
        //console.log(res.data)
        setTransacting(false)
        setUpdated(!updated)
    }
    /*Search*/

    const searchName =  async (e: any) =>{
        //console.log(e.target.value)
        if(e.target.value.length < 3){
            setSearchError("Name to short.")
            setViewSearch(false)
            return
        }
        if(e.target.value > 64){
            setSearchError("Name to long.")
            setViewSearch(false)
            return;
        }
        setSearchError("");
        setSearchedName(e.target.value)
        const nameResolve = await engine.sendTransaction(network, {from: engine.defaultAccount}, "Name", "NamesResolver", [e.target.value], true)
        if(nameResolve.transaction == "0x0000000000000000000000000000000000000000"){
            setSearchError("Name not found.")
            setViewSearch(false)
            return
        } 
        const info = await engine.sendTransaction(network, {from: engine.defaultAccount}, "Name", "Info", [nameResolve.transaction], true)
        console.log(info)
        setNameResolve(nameResolve.transaction.slice(0, 6) + "..." + nameResolve.transaction.slice(-4))
        setSearchedBio(info.transaction.bio)

        /*get expiry */
        const expired = (await engine.sendTransaction(network, {from: engine.defaultAccount}, "Name", "viewTransferName", [e.target.value], true)).transaction
        if(expired ){
            setClaimable(true)
        }

        const resp = await axios.get(`${host}/avatar/` + info.transaction.name, {responseType: "blob"})
        if(resp.data !== "Name doesn't exist"){
            const blob = resp.data;
            const blobUrl = URL.createObjectURL(blob);
            setSearchedAvatar(blobUrl)
        }

        /* get Claim name*/
        setViewSearch(true)


    }

    const transferName = async () =>{
        setTransacting(true)
        await engine.sendTransaction(network, {from: engine.defaultAccount}, "Name", "transferName", [searchedName])

        setTransacting(false)
        setViewSearch(false)
        setUpdated(!updated)
    }

    

    return(
        <div id="view">
            <div id="release">
            {
                    toggle && <Button size="large" text="Release Name" onClick={releaseName} transacting={transacting}/>
                }
                <Button onClick={(() => setToggle(!toggle) )} size="icon" icon={<Icon src={toggle ? up_arrow : close } size="mini"/>}/>
            </div>
            <div id="view-top">
                <h4>{name}</h4>
                <Icon size="large" src={avatar} round={true}/>
                
            </div>
            
            <div id="view-bio"><Textarea value={bio}/></div>
            <div>Protected: {protect} </div>
            <div>Claimable: {expiry}</div>
            {extendTimestamp && 
                <>
                    <Button size="large" text="Extend Name" id="view-extend" onClick={extendName} transacting={transacting}/>
                    {extendError}
                </>}
            <Divider />
            <div id="view-edit">
                <div id="view-edit-tag">Edit Info</div>
                <Textarea placeholder="new bio..." onChange={changeBio}/>
                <label >
                    avatar:
                    <br/>
                    <input type="file" id="name-image" accept="image/*" onChange={changeAvatar}/><Icon src={iconImport} id="name-avatar"/>
                </label>
                {error} &nbsp;
                
                gas: {editGas}
                <Button onClick={editInfo} text="Edit Info" size="large" transacting={transacting}/>
            </div>
            
            <Divider id="view-edit-divider"/>
            
            <div id="view-search">
                <Input placeholder="search..." size="small" button={true} icon={search} onChange={searchName}/>
                {viewSearch && 
                    <>
                        <div id="view-search-info">
                            <Icon size="large" src={searchedAvatar} />
                            <>{nameResolve}</>
                        </div>
                        <Textarea value={searchedBio} />
                        { claimable && <Button size="large" text="Claim Name" id="view-claim" onClick={transferName} transacting={transacting}/>}
                    </>
                }
                
            </div>
            {searchError}
        </div>
    );
}