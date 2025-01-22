import { useEffect, useState } from "react";
import { Web3Engine } from "@sb-labs/web3-engine";
import { Input, Button, Divider, Icon } from "@sb-labs/basic-components/dist";

import * as Block from 'multiformats/block';
import * as raw from "multiformats/codecs/raw"
import { sha256 } from 'multiformats/hashes/sha2';
import axios from "axios" 

import { user } from "@sb-labs/images/"
import { toBN } from "web3-utils";

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

    const host = true ? "http://localhost:3001" : "http://15.223.186.84:3001"

    const [tag, setTag] = useState<string>("")
    const [iconImport, setIconImport] = useState<any>(user)
    const [audioImport, setAudioImport] = useState<any>()

    //Content
    const [contentFile, setContentFile] = useState<File>()
    const [contentCid, setContentCid] = useState<string>("")
    const [error, setError] = useState<string>("")
    const [transacting, setTransacting] = useState<boolean>(false)
    const [tagCreated, setTagCreated] = useState<string>("")
    const [contentType, setContentType] = useState<string>("")

    const [cost, setCost] = useState<number>(0)

    //Search
    const [searchCid, setSearchCid] = useState<string>("")
    const [searchError, setSearchError] = useState<string>("")

    const [searchType, setSearchType] = useState<string>("")

    //tag
    const [tagImage, setTagImage] = useState<any>(user)
    const [tagAudio, setTagAudio] = useState<any>()

    useEffect(() =>{
        if(props.engine === undefined){
            console.log("No Engine")
            props.setComp("Display")
            return;
        }

        const getGas = async () =>{
            let gas = await engine.getGas(network, {from: engine.defaultAccount, value: engine.utils.toWei("0.001", "ether")}, "Tags", "requestTag", ["Asuperrandomtag777", "bafkreieoxgfvzgamiaa6y6itexozarqzdrd4yospuyywvvjnrhqc26hmgu"]);

            gas = engine.utils.fromWei(gas.gas.toString(), "ether")

            let cost = Number(gas) + Number(0.001)
            setCost(cost);
        }   
        getGas()
    }, [])

    const changeTag = async (e: any) =>{
        
        const t = await engine.sendTransaction(network, {from: engine.defaultAccount}, "Tags", "TagsMap", [e.target.value], true)
        console.log(t)
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
        const content = ((document.getElementById("tag-button")) as HTMLInputElement).files?.item(0)
        setContentFile(content as File)

        console.log(content?.type)


        console.log(await fileToUint8Array(content as File))

        const file = await fileToUint8Array(content as File)

        const block = await Block.encode({value: file, codec: raw, hasher: sha256})
        console.log(block.cid.toString())
        setContentCid(block.cid.toString())
        //setAvatarData(block as any)

        if(content?.type.includes("image")){
            const blobUrl = URL.createObjectURL(content as File);
            setIconImport(blobUrl)
            setContentType("image")
            return
        }
        if(content?.type.includes("audio")){
            
            setIconImport(user)
            setContentType("audio")
            const reader = new FileReader();

            reader.onload = (event) => {
                const audioSrc = event.target?.result as string;
                setAudioImport(audioSrc);
            };

            reader.readAsDataURL(content as File);
            return
        }

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
        const res = await axios.post(`${host}/upload/`, formdata, {
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
            setSearchType("")
            setSearchError("Tag doesn't exist")
            return;
        }

        const resp = await axios.get(`${host}/tags/` + e.target.value, {responseType: "blob"})

        if(resp.data !== "Tag doesn't exist"){
            const blob = resp.data;
                const blobUrl = URL.createObjectURL(blob);
            if(resp.data.type.includes("image")){
                setSearchType("image")
                setTagImage(blobUrl)
            }
            else{
                setSearchType("audio")
                setTagAudio(blobUrl)
            }
            
        }
        console.log(t.transaction.content.length)
        setSearchCid(t.transaction.content)

        setSearchError("")
    }

    return(<>
        <div id="tag">
            <h3>Create A Tag</h3>
            <Input size="small" placeholder="tag..." onChange={changeTag}/>
            {error}
            <br/>
            <div id="tag-section"> 
                    <input id="tag-button" type="file" accept="image/png, audio/mp3" onChange={changeContent}></input>
                    
            </div>
            <br />
            {contentType == "image" && <Icon src={iconImport} />}
            {contentType == "audio" && <audio src={audioImport} autoPlay={true} controls></audio>}
            <br/>
            <Button text="Create" size="large" onClick={createTag} transacting={transacting}/>
            <br/>
            <>Create Tag Ether: {cost}</>
            <br/>
            {tagCreated}
            <br/>
            <Divider/>
            <h3>Search For Tag</h3>
            <Input size="small" placeholder="tag..." onChange={searchTag}/>
            <br />

            {/*{searchType == "image" && <div> <img src={"https://ipfs.io/ipfs/" + searchCid} id="tag-image"/></div>}*/}
            {searchType == "image" || searchType =="audio" && <div><a href={"https://ipfs.io/ipfs/" + searchCid} >{props.mobile ? searchCid.slice(-6) + "..." + searchCid.slice(54,59) : searchCid}</a></div>}
            {searchType == "image" && <div> <img src={tagImage} id="tag-image"/></div>}
            {searchType == "audio" && <div> <audio src={tagAudio} controls autoPlay={true}></audio></div>}
            {searchError}
        </div>
        
    </>)

}