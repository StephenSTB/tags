import { providers } from "@sb-labs/web3-data/networks/Providers.js"

import {Providers} from "@sb-labs/web3-data/networks/Providers.js"

import {deployed} from "@sb-labs/web3-data/networks/DeployedContracts.js"

import { Web3Engine } from "@sb-labs/web3-engine/Web3Engine.js";

import { EngineArgs } from "@sb-labs/web3-engine/Web3Engine.js";

import { contractFactoryV2 } from "@sb-labs/contract-factory-v2/ContractFactoryV2.js"

import { green, yellow, red, gray } from "@sb-labs/web3-data/functions/ConsoleColors.js";

import fs from "fs"

import axios from "axios";

import { PassThrough } from 'stream';

import { Buffer } from 'buffer';
import { ConnectionCloseError, net } from "web3";

let engine : Web3Engine;

let wallet: any

let mnemonic : string;

let account: string;

const network: string = "Ganache"

try{
    mnemonic = (fs.readFileSync("../secret/.secret-mn-ganache")).toString()
}catch{
    mnemonic = (fs.readFileSync("../../secret/.secret-mn-ganache")).toString()
}

const main = async () =>{

    let prvdrs = {} as Providers;

    prvdrs[network] = providers[network]

    const engineArgs = 
    {
        browser: false,
        mnemonic, 
        defaultAccount: 0,
        networks: [network], 
        defaultNetwork: network, 
        providers: prvdrs, 
        deployed, 
        contractFactory: contractFactoryV2, 
        contractFactoryVersion: 2
    } as EngineArgs

    engine = await Web3Engine.initialize(engineArgs);

    wallet = engine.defaultInstance?.wallet;

    account = wallet[0].address as string;

    await deployNames() 

    await createName()
    
    //await uploadAvatar()

    //await getAvatar()

    await editInfo()

    await viewProtected()

    await extendTimestamp()

    await viewTransfer()

    process.exit(0)
}

const deployNames = async () => {

    const deployedNames = await engine.deploy(network, "Name", [100, 60], {from: account});

    //console.log(deployedNames)

    console.log(green(), "Name deployed at: " + deployedNames.deployed.options.address)

}

async function streamToBlob(stream: fs.ReadStream): Promise<Blob> {
    const pt = new PassThrough();
    const chunks: Buffer[] = [];
  
    stream.pipe(pt);
  
    for await (const chunk of pt) {
      chunks.push(chunk);
    }
  
    const uint8ArrayChunks = chunks.map((chunk) => new Uint8Array(chunk));
    const buffer = Buffer.concat(uint8ArrayChunks);
    return new Blob([buffer]);
}

const createName = async () => {
    const createName = await engine.sendTransaction(network, {from: account},  "Name", "createName", ["sb-labs", "This is my bio", "bafkreie6z5t57xg2htwfdgjhvv6wyaqemfqjggsoswzpsimi5c6ibjtg24"]);

    if(! createName.success){
        console.log(red(), "couldn't create name:", createName.error)
        return;
    }
    const name = await engine.sendTransaction(network, {from: account}, "Name", "Names", [account], true);

    console.log(green(), "Name created: ", name.transaction)

}

const uploadAvatar = async () => {
    const formdata = new FormData();

    const readStream = fs.createReadStream('./tag/bafkreie6z5t57xg2htwfdgjhvv6wyaqemfqjggsoswzpsimi5c6ibjtg24.png'); //todo get raw
    const blob = await streamToBlob(readStream);
    
    formdata.append('file', blob, "bafkreie6z5t57xg2htwfdgjhvv6wyaqemfqjggsoswzpsimi5c6ibjtg24.png.mp3")
    formdata.append('data', JSON.stringify({name: "sb-labs"}))

    const res = await axios.post("http://localhost:3001/avatar/", formdata, {
        headers:{
            "Content-Type": 'multipart/form-data'
        } 
    })
    console.log(res.data)
}

const getAvatar = async () =>{
    console.log(yellow(), "Getting Requested Tag...")
    //const requestedTags = await engine.sendTransaction(network, {from: account },  "Tags", "TagsMap", ["stb"], true)

    //console.log(requestedTags)

    const resp = await axios.get(`http://localhost:3001/avatar/sb-labs`)

    console.log(resp.data)
      
}

const editInfo = async () => {
    const editInfo = await engine.sendTransaction(network, {from: account},  "Name", "editInfo", ["This is my bio edited", "bafkreie6z5t57xg2htwfdgjhvv6wyaqemfqjggsoswzpsimi5c6ibjtg24"]);

    if(! editInfo.success){
        console.log(red(), "couldn't edit info:", editInfo.error)
        return;
    }
    const name = await engine.sendTransaction(network, {from: account}, "Name", "Info", [account], true);

    console.log(green(), "Name edited: ", name.transaction)
}

const viewProtected = async () => {
    const currentTimestamp = await engine.sendTransaction(network, {from: account},  "Name", "getTimestamp", [], true);
    console.log(currentTimestamp)
    const viewProtect = await engine.sendTransaction(network, {from: account},  "Name", "viewExtendTimestamp", ["sb-labs"], true);
    console.log(viewProtect)
}

const extendTimestamp = async () => {

    let viewProtect = await engine.sendTransaction(network, {from: account},  "Name", "viewExtendTimestamp", ["sb-labs"], true);
    let info = await engine.sendTransaction(network, {from: account},  "Name", "Info", [account], true);
    console.log("name timestamp: " , info.transaction.timestamp)
    let protectedTime = await engine.sendTransaction(network, {from: account}, "Name", "Protected", [], true)
    console.log(protectedTime.transaction)
    let pTimestamp = Number(info.transaction.timestamp) + Number(protectedTime.transaction)
    console.log("protected expire", pTimestamp)
    while(!viewProtect.transaction){
        console.log(gray(), "Waiting to extend timestamp...")
        await sleep(10000)
        viewProtect = await engine.sendTransaction(network, {from: account},  "Name", "viewExtendTimestamp", ["sb-labs"], true);
        
        const timestamp = await engine.sendTransaction(network, {from: account}, "Name", "getTimestamp", [], true);
        console.log("current", timestamp.transaction)
        console.log(viewProtect.transaction)
    }

    await engine.sendTransaction(network, {from: account},  "Name", "extendTimestamp", []);

    info = await engine.sendTransaction(network, {from: account},  "Name", "Info", [account], true);

    console.log(info)
}

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

const viewTransfer = async () => {
    let canTransfer = await engine.sendTransaction(network, {from: account},  "Name", "viewTransferName", ["sb-labs"], true);
    console.log(canTransfer)
    let year = await engine.sendTransaction(network, {from: account},  "Name", "Year", [], true);
    console.log(year)
    while(!canTransfer.transaction){
        console.log(gray(), "Waiting for transfer to be available")
        await sleep(10000)
        const time = await engine.sendTransaction(network, {from: account},  "Name", "getTimestamp", [], true);
        console.log(time)
        canTransfer = await engine.sendTransaction(network, {from: account},  "Name", "viewTransferName", ["sb-labs"], true);
        console.log(canTransfer)
    }
    
    await engine.sendTransaction(network, {from: wallet[1].address},  "Name", "transferName", ["sb-labs"]);

    const info = await engine.sendTransaction(network, {from: account}, "Name", "Info", [wallet[1].address], true);

    console.log(info)
}

main();