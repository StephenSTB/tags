import express from "express"
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import { rateLimit } from "express-rate-limit"
import { fileTypeFromBuffer } from 'file-type';

import { providers } from "@sb-labs/web3-data/networks/Providers.js"

import {Providers} from "@sb-labs/web3-data/networks/Providers.js"

import {deployed} from "@sb-labs/web3-data/networks/DeployedContracts.js"

import { Web3Engine } from "@sb-labs/web3-engine/Web3Engine.js";

import { EngineArgs } from "@sb-labs/web3-engine/Web3Engine.js";

import { contractFactoryV2 } from "@sb-labs/contract-factory-v2/ContractFactoryV2.js"

import { green, yellow, red, gray } from "@sb-labs/web3-data/functions/ConsoleColors.js";

import fs from "fs"

import * as raw from "multiformats/codecs/raw"
import { sha256 } from 'multiformats/hashes/sha2';
import * as Block from 'multiformats/block';
import { CID } from "multiformats";
//import { createHelia } from "helia";
//import { FsBlockstore }  from "blockstore-fs"

import { URL } from "url"

const __dirname = new URL('.', import.meta.url).pathname;

//let blockstore = new FsBlockstore("./tags/helia")

//let helia = await createHelia({blockstore});

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

console.log("Tags Address: ", engine.defaultInstance?.contracts["Tags"].options.address)

console.log()

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 40, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

const app = express();

app.use(cors());

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
  })); 
// Serve static files from the 'public' directory
app.use(express.static('public'));

app.use(limiter)

app.get("/", (req, res) => {
    res.send("Hello World")
})

// Set up multer to store files in memory
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB
    },
  });

app.post("/upload", upload.single('file'), async (req, res) =>{

    console.log(req.file)
    console.log(req.body)

    const mime = (await fileTypeFromBuffer(req.file!.buffer))?.mime
    console.log(req.file)
    if(req.file == undefined || mime !== "image/png"){
        console.log("invalid format")
        res.send("Invalid format")
        return
    }

    try{
        const tagjson = JSON.parse(req.body.data)
        console.log(tagjson)
        const tagreq = await engine.sendTransaction(network, {from: account}, "Tags", "TagsRequested", [tagjson.address, tagjson.tag], true)
        console.log(tagreq)
        // test content vs file
        const file = new Uint8Array(req.file?.buffer as Buffer)
        //console.log("File", file)
        const block = await Block.encode({value: file, codec: raw, hasher: sha256})
        console.log(block.cid.toString())

        if(block.cid.toString() != tagreq.transaction.content){
            res.send("Invalid Content cid")
            return;
        }
        

        // get tags contract value
        let balance = await engine.web3Instances[network].web3.eth.getBalance(engine.defaultInstance?.contracts["Tags"].options.address)

        //console.log("Contract balance: ", engine.utils.fromWei(balance, "ether"))

        if(balance < engine.utils.toWei("0.001", "ether")){
            res.send("Insufficient Funds")
            return;
        }

        await engine.sendTransaction(network, {from: account}, "Tags", "getValue", [])

        // add tag to tags contract

        console.log()

        await engine.sendTransaction(network, {from: account}, "Tags", "addTag", [tagjson.tag, [tagreq.transaction.content, tagreq.transaction.tager, tagreq.transaction.blockNumber]]);

        // get the added tag

        const tag = await engine.sendTransaction(network, {from: account}, "Tags", "TagsMap", [tagjson.tag], true)

        console.log(tag)

        // Add block to blockstore
        //await helia.blockstore.put(block.cid, block.bytes)

        //await helia.pins.add(block.cid)

        fs.writeFileSync(`./tags/${block.cid.toString()}.png`, block.bytes)
        
    }catch(e){
        console.log(e)
    }

    res.send("Uploaded")
})

app.get("/tags/:tag", async (req, res) =>{

    const tag = req.params.tag

    console.log(console.log(req.params))

    const t = await engine.sendTransaction(network, {from: account}, "Tags", "TagsMap", [tag], true)

    if(t.transaction.blockNumber == "0"){
        res.send("Tag doesn't exist")
        return;
    }

    res.sendFile(`./tags/${t.transaction.content}.png`, { root: __dirname });

    //res.send(t.transaction)
})

app.listen(3001, () =>{console.log("listening on port 3001")})