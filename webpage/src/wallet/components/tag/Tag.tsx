import { useEffect, useState } from "react";
import { Web3Engine } from "@sb-labs/web3-engine";
import { Input, Button, Divider, Icon } from "@sb-labs/basic-components/dist";

import * as Block from 'multiformats/block';
import * as raw from "multiformats/codecs/raw"
import { sha256 } from 'multiformats/hashes/sha2';
import axios from "axios" 

import {user } from "@sb-labs/images/"
import "./Tag.css";

interface TagProps{
    engine: Web3Engine,
    network: string
    mobile: boolean,
    setComp: any
}

export const Tag = (props: TagProps) => {

    const engine = props.engine;
    const network = props.network;

    const [tag, setTag] = useState<string>("")
    const [iconImport, setIconImport] = useState<any>(user)

    //Content
    const [contentFile, setContentFile] = useState<File>()
    const [contentCid, setContentCid] = useState<string>("")
    const [error, setError] = useState<string>("")
    const [transacting, setTransacting] = useState<boolean>(false)
    const [tagCreated, setTagCreated] = useState<string>("")
    //Search

    const [searchCid, setSearchCid] = useState<string>("")
    const [searchError, setSearchError] = useState<string>("")

    //tag
    const [tagImage, setTagImage] = useState<any>(user)

    useEffect(() =>{
        if(props.engine === undefined){
            console.log("No Engine")
            props.setComp("Display")
            return;
        }
    }, [])

    const changeTag = async (e: any) =>{
        
        const t = await engine.sendTransaction(network, {from: engine.defaultAccount}, "Tags", "TagsMap", [e.target.value], true)
        console.log(t.transaction)
        if(t.transaction.blockNumber != "0"){
            console.log("Tag already exists")
            setError("Tag already exists")
            setTag("")
            return;
        }
        if(e.target.value.length < 3){
            console.log("Tag too short")
            setError("Tag too short")
            setTag("")
            return;
        }
        setError("")
        setTag(e.target.value)
    }

    function fileToUint8Array(file: File): Promise<Uint8Array> {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const uint8Array = new Uint8Array(reader.result as ArrayBuffer);
            resolve(uint8Array);
          };
          reader.onerror = () => {
            reject(reader.error);
          };
          reader.readAsArrayBuffer(file);
        });
    }

    const changeContent= async (e: any) =>{

        //console.log(e.target.value)
        //console.log("get avatar")
        const avatarInput = ((document.getElementById("tag-button")) as HTMLInputElement).files?.item(0)
        setContentFile(avatarInput as File)

        console.log(await fileToUint8Array(avatarInput as File))

        const file = await fileToUint8Array(avatarInput as File)

        const block = await Block.encode({value: file, codec: raw, hasher: sha256})
        setContentCid(block.cid.toString())
        //setAvatarData(block as any)
        
        const blobUrl = URL.createObjectURL(avatarInput as File);
        setIconImport(blobUrl)

    }

    const createTag = async () =>{
        setTransacting(true)
        if(contentCid === ""){
            setTransacting(false)
            setError("No content")
            return
        }
        console.log(tag.length)
        if(tag.length < 3 ){
            setTransacting(false)
            setError("Tag too short")
            return
        }
        const t = await engine.sendTransaction(network, {from: engine.defaultAccount}, "Tags", "TagsMap", [tag], true)
        console.log(t.transaction)
        if(t.transaction.blockNumber != "0"){
            console.log("Tag already exists")
            setError("Tag already exists")
            return;
        }
        // create request on chain
        await engine.sendTransaction(network, {from: engine.defaultAccount, value: engine.utils.toWei("0.001", "ether")}, "Tags", "requestTag", [tag, contentCid]);
        // send request to server
        const formdata = new FormData();
        formdata.append('file', contentFile as Blob, contentFile?.name)
        formdata.append('data', JSON.stringify({address: engine.defaultAccount, tag: tag}))
        const res = await axios.post("http://localhost:3001/upload/", formdata, {
            headers:{
                "Content-Type": 'multipart/form-data'
            } 
        })
        console.log(res.data)
        setTagCreated(`${tag} Created`)
        setTransacting(false)
    }

    // Search for tag

    const searchTag = async (e: any) =>{
        console.log(e.target.value)
        const t = await engine.sendTransaction(network, {from: engine.defaultAccount}, "Tags", "TagsMap", [e.target.value], true)
        //console.log(t.transaction)
        if(t.transaction.blockNumber == "0"){
            console.log("Tag doesn't exist")
            setSearchError("Tag doesn't exist")
            return;
        }

        const resp = await axios.get("http://localhost:3001/tags/" + e.target.value, {responseType: "blob"})

        if(resp.data !== "Tag doesn't exist"){
            const blob = resp.data;
            const blobUrl = URL.createObjectURL(blob);
            setTagImage(blobUrl)
        }

        setSearchCid(t.transaction.content)

        setSearchError("")
    }

    return(<>
        <div id="tag">
            <h3>Create a tag</h3>
            <Input size="small" placeholder="tag..." onChange={changeTag}/>
            {error}
            <br/>
            <div id="tag-section"> 
                    <input id="tag-button" type="file" accept="image/png" onChange={changeContent}></input>
                    <Icon src={iconImport} />
            </div>
            <br/>
            <Button text="Create" size="large" onClick={createTag} transacting={transacting}/>
            {tagCreated}
            <br/>
            <Divider/>
            <h3>Search for tag</h3>
            <Input size="small" placeholder="tag..." onChange={searchTag}/>
            <br />
            <div> <img src={"https://ipfs.io/ipfs/" + searchCid} id="tag-image"/></div>
            <div> <a href={"https://ipfs.io/ipfs/" + searchCid} >{searchCid}</a></div>
            <div> <img src={tagImage} id="tag-image"/></div>
            {searchError}
        </div>
        
    </>)

}