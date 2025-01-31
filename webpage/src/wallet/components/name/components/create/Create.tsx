import { useState, useEffect } from "react"
import { Web3Engine } from "@sb-labs/web3-engine";
import { Icon, Input, Textarea, Button } from "@sb-labs/basic-components/dist"
import { user } from "@sb-labs/images"
import { fileToUint8Array } from "../../../helper/Helper";
import * as Block from 'multiformats/block';
import * as raw from "multiformats/codecs/raw"
import { sha256 } from 'multiformats/hashes/sha2';
import axios from "axios"


interface CreateProps{
    engine: Web3Engine;
    network: string;
    host: string; 
    setState: any;
}

export const Create = (props: CreateProps) => {

        const host = props.host;

        const engine = props.engine;
        const network = props.network;

        const [transacting, setTransacting] = useState<boolean>(false)
    
        /* Create */
        const [createName, setCreateName] = useState<string>("")
        const [createBio, setCreateBio] = useState<string>("") 
        const [avatarFile, setAvatarFile] = useState<File>()
        const [avatarCid, setAvatarCid] = useState<string>("bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku")
        const [iconImport, setIconImport] = useState<any>(user)
        const [cost, setCost] = useState<number>(0)
    
        const [createError, setCreateError] = useState<string>("")

    useEffect(() =>{
        //console.log("here")
        
        const getAvatarGas = async () =>{
            const gas = await engine?.getGas(network, {from: engine.defaultAccount,}, "Name", "createName", ["a random name", "this is a bio", avatarCid])
            console.log(gas)
            if(!gas.success){
                return
            }
            
            const cost = engine.utils.fromWei( gas.gas.toString() ,"ether")
            console.log(cost)
            setCost(cost)
        }   
        getAvatarGas()
    }, [])

    const changeName = async (e: any) =>{
        //console.log(e.target.value)
        if(e.target.value.length < 3){
            setCreateError("Name to short");
            return;
        }
        if(e.target.value.length > 64){
            setCreateError("Name to long");
            return;
        }
        try{
            const name_tx = await engine?.sendTransaction(network, {from: engine.defaultAccount}, "Name", "NamesResolver", [e.target.value], true)

            if(name_tx.transaction != "0x0000000000000000000000000000000000000000"){
                setCreateError("Name already taken")
                return
            }
            setCreateError("")
            setCreateName(e.target.value)
            console.log(name_tx)
        }catch(err){
            console.log(err)
        }
        
    }

    const changeBio = (e: any) =>{
        if(e.target.value.length > 300){
            console.log(e.target.value)
            setCreateError("Bio to long")
            return;
        }
        setCreateBio(e.target.value)
        setCreateError("")
    } 

    const changeAvatar = async (e: any) =>{
        const avatarFile = ((document.getElementById("name-image")) as HTMLInputElement).files?.item(0)
        setAvatarFile(avatarFile as File)

        console.log(avatarFile?.type)


        console.log(await fileToUint8Array(avatarFile as File))

        const file = await fileToUint8Array(avatarFile as File)

        const block = await Block.encode({value: file, codec: raw, hasher: sha256})
        console.log(block.cid.toString())
        setAvatarCid(block.cid.toString())
        //setAvatarData(block as any)

        const blobUrl = URL.createObjectURL(avatarFile as File);
        setIconImport(blobUrl)
    }

    const submitName = async () =>{
        setTransacting(true)
        if(createName == ""){
            setCreateError("Name required")
            setTransacting(false)
            return;
        }
        console.log("here")

        const balance = engine?.utils.fromWei((await engine?.web3Instances[network]?.web3.eth.getBalance(engine.defaultAccount as string))?.toString(), "ether");

        console.log(balance)

        if(Number(balance) < Number(cost)){
            setCreateError("Insufficient funds.")
            setTransacting(false)
            return
        }

        const name_tx = await engine?.sendTransaction(network, {from: engine.defaultAccount}, "Name", "createName", [createName, createBio, avatarCid])
        console.log(name_tx)

        console.log(avatarCid)
        if(avatarCid == "bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku"){
            setTransacting(false)
            props.setState("Edit")
            return;
        }
        
        const formdata = new FormData();
        formdata.append('file', avatarFile as Blob, avatarFile?.name)
        formdata.append('data', JSON.stringify({name: createName}))
        const res = await axios.post(`${host}/avatar/`, formdata, {
            headers:{
                "Content-Type": 'multipart/form-data'
            } 
        })
        console.log(res.data)
        setTransacting(false)
        props.setState("Edit")
    }

    return(
        <><div id="name">
            <h3 id="name-title">Create Name</h3>
            <Input id="name-name" placeholder="name..." onChange={changeName} size="small"/>
            <br />
            <Textarea placeholder="bio..." size="small" onChange={changeBio}/>
            <br />
            {/*<Input id="name-link" placeholder="link" onChange={changeName} size="small"/>*/}
            
            <div>
                <label >
                    avatar:
                    <br/>
                    <input type="file" id="name-image" accept="image/*" onChange={changeAvatar}/><Icon src={iconImport} id="name-avatar"/>
                    
                </label>
            </div>
            <br/>
            gas: {cost}
            <Button size="medium" onClick={submitName} text="Submit" transacting={transacting}/>
            <br/>
            {createError}
            </div></>
    )
}