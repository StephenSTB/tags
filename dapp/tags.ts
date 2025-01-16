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

let engine : Web3Engine;

let wallet: any

let mnemonic : string;

let account: string;

let TagRequested: any;

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

    //await deployTags();
    /*
    TagRequested.on("data", (event: any) =>{
        console.log(event.returnValues)
    })*/

    await requestTag();

    //await getRequestedTags();
    
    process.exit(0)
}

const deployTags = async () =>{
    console.log(yellow(), "Deploying Tags...")
    const tagsDeployed = await engine.deploy(network, "Tags", [], {from: account})
    
    console.log(tagsDeployed.deployed.options.address)

    //console.log(tagsDeployed.deployed.events)
    //TagRequested = tagsDeployed.deployed.events.TagRequested();
    
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

const requestTag = async () =>{
    console.log(yellow(), "Requesting Tag...")

    console.log(engine.utils.toWei("0.001", "ether"))
    
    const tagRequested = await engine.sendTransaction(network, {from: account, value: engine.utils.toWei("0.001", "ether")}, "Tags", "requestTag", ["stb", "bafkreie6z5t57xg2htwfdgjhvv6wyaqemfqjggsoswzpsimi5c6ibjtg24"])
    
    console.log(tagRequested)

    const formdata = new FormData();

    const readStream = fs.createReadStream('./tag/bafkreie6z5t57xg2htwfdgjhvv6wyaqemfqjggsoswzpsimi5c6ibjtg24.png');
    const blob = await streamToBlob(readStream);
    
    formdata.append('file', blob, "bafkreie6z5t57xg2htwfdgjhvv6wyaqemfqjggsoswzpsimi5c6ibjtg24.png")
    formdata.append('data', JSON.stringify({address: account, tag: "stb"}))

    const res = await axios.post("http://localhost:3001/upload/", formdata, {
        headers:{
            "Content-Type": 'multipart/form-data'
        } 
    })
    console.log(res.data)
}

const getRequestedTags = async () =>{
    console.log(yellow(), "Getting Requested Tags...")
    const requestedTags = await engine.sendTransaction(network, {from: account },  "Tags", "TagsRequested", [account, "stb"], true)
    
    console.log(requestedTags)
}

main()