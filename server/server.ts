import express from "express"
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import { rateLimit } from "express-rate-limit"
import { fileTypeFromBuffer } from 'file-type';

import { providers } from "@sb-labs/web3-data/networks/Providers.js"

import {Providers} from "@sb-labs/web3-data/networks/Providers.js"

import {deployed} from "@sb-labs/web3-data/networks/DeployedContracts.js"

import { Web3Engine, EngineArgs } from "@sb-labs/web3-engine/Web3Engine.js";

import { contractFactoryV2 } from "@sb-labs/contract-factory-v2/ContractFactoryV2.js"

//import { green, yellow, red, gray } from "@sb-labs/web3-data/functions/ConsoleColors.js";

import fs from "node:fs"

import * as raw from "multiformats/codecs/raw"
import { sha256 } from 'multiformats/hashes/sha2';
import * as Block from 'multiformats/block';
import { CID } from "multiformats";
import { createHelia } from "helia";
import { FsBlockstore }  from "blockstore-fs"

import { RekognitionClient, DetectModerationLabelsCommand, DetectModerationLabelsCommandOutput} from '@aws-sdk/client-rekognition';

import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import https from 'https';

import { green, red } from "@sb-labs/web3-data/functions/ConsoleColors.js";

const accessKeyId = 'AKIATXUVDQ6VLC4KD67N';
let secretAccessKey = '';

try{
    secretAccessKey = (fs.readFileSync("../../secret/.aws-rekognition")).toString()
  }catch{
    secretAccessKey = (fs.readFileSync("/home/stephensb/sb-labs/secret/.aws-rekognition")).toString()
}

const keepAliveMsecs = 1 * 60 * 1000; // 5 minutes
const maxSockets = 50;
const maxFreeSockets = 10;

const httpsAgent = new https.Agent({
    keepAlive: true,
    keepAliveMsecs,
    maxSockets,
    maxFreeSockets,
});

const rekognition = new RekognitionClient({
    region: 'us-east-1',
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    requestHandler: new NodeHttpHandler({
        httpsAgent,
    }),
});

const __dirname = new URL('.', import.meta.url).pathname;

const blockstore = new FsBlockstore("./tags/helia")

//const peerId = PeerId.createFromB58String("12D3KooWAg2fcoLgrJU5FMr1LqDqxt1euNpqWuKXSXSkP8xXNegG");

const helia = await createHelia({blockstore});

console.log(helia.libp2p.getMultiaddrs())

let engine : Web3Engine = {} as Web3Engine;

let wallet: any = {}

let mnemonic : string;

let account: string = "";

const network: string = "Ganache"

try{
  mnemonic = (fs.readFileSync("../secret/.secret-mn-ganache")).toString()
}catch{
  mnemonic = (fs.readFileSync("../../secret/.secret-mn-ganache")).toString()
}

const prvdrs = {} as Providers;

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

console.log("Name Address: ", engine.defaultInstance?.contracts["Name"].options.address)

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

    console.log(green(), "Tag Upload Request")

    //console.log(req.file)
    //console.log(req.body)
   
    if(req.file == undefined){
        console.log(red(), "Invalid format")
        res.send("Invalid format")
        return
    }

    const mime = (await fileTypeFromBuffer(req.file!.buffer))?.mime
    console.log(req.file)
    console.log(mime)

    if(mime !== "image/png" && mime !== "audio/mpeg"){
        console.log(red(), "Invalid format")
        res.send("Invalid format")
        return;
    }

    try{
        const tagjson = JSON.parse(req.body.data)
        //TODO get tag from contract to verify doesn't exist
        const tagexists = await engine.sendTransaction(network, {from: account}, "Tags", "TagsMap", [tagjson.tag], true)

        if(!tagexists.success){
            res.send("Tag request failed")
            console.log(red(), tagexists.error)
            return;
        }

        if(tagexists.transaction.blockNumber != "0"){
            res.send("Tag already exists")
            return;
        } 

        //console.log(tagjson)
        const tagreq = await engine.sendTransaction(network, {from: account}, "Tags", "TagsRequested", [tagjson.address, tagjson.tag], true)
        //console.log(tagreq)
        if(!tagreq.success){
            res.send("Tag request failed")
            console.log(red(), tagreq.error)
            return;
        }

        if(mime === "image/png"){
            
            const command = new DetectModerationLabelsCommand({
                Image: {
                  Bytes: req.file.buffer,
                },
                MinConfidence: 50, // Minimum confidence threshold
              });
            
            const rek: DetectModerationLabelsCommandOutput = await rekognition.send(command)
    
            if(rek.ModerationLabels!.length > 0){
                res.send("Abusive content detected")
                return;
            }
            console.log(green(),"No abusive content detected: tag")
        }

        // test content vs file
        const file = new Uint8Array(req.file?.buffer as Buffer)
        //console.log("File", file)
        const block = await Block.encode({value: file, codec: raw, hasher: sha256})
        //console.log(block.cid.toString())

        if(block.cid.toString() != tagreq.transaction.content){
            res.send("Invalid Content cid")
            return;
        }
        
        // get tags contract value
        const balance = await engine.web3Instances[network].web3.eth.getBalance(engine.defaultInstance?.contracts["Tags"].options.address)

        //console.log("Contract balance: ", engine.utils.fromWei(balance, "ether"))

        if(balance < engine.utils.toWei("0.001", "ether")){
            res.send("Insufficient Funds")
            return;
        }

        await engine.sendTransaction(network, {from: account}, "Tags", "getValue", [])

        // add tag to tags contract

        await engine.sendTransaction(network, {from: account}, "Tags", "addTag", [tagjson.tag, [tagreq.transaction.content, tagreq.transaction.tager, tagreq.transaction.blockNumber]]);

        // get the added tag

        const tag = await engine.sendTransaction(network, {from: account}, "Tags", "TagsMap", [tagjson.tag], true)

        console.log(green(), tag)

        // Add block to blockstore
        await helia.blockstore.put(block.cid, block.bytes)

        await helia.pins.add(block.cid)

        fs.writeFileSync(`./tags/${block.cid.toString()}${mime === "image/png" ? ".png" : ".mp3"}`, block.bytes)
        
    }catch(e){
        console.log(e)
        res.send("Invalid data")
        return;
    }

    res.send("Tag Uploaded")
})

app.get("/tags/:tag", async (req, res) =>{

    const tag = req.params.tag

    console.log(req.params)

    const t = await engine.sendTransaction(network, {from: account}, "Tags", "TagsMap", [tag], true)

    if(t.transaction.blockNumber == "0"){
        res.send("Tag doesn't exist")
        return;
    }
    
    const file =  await helia.blockstore.get(CID.parse(t.transaction.content))

    console.log("tag: ", file.buffer)

    const mime = (await fileTypeFromBuffer(new Uint8Array(file.buffer)))?.mime

    console.log("mime: ", mime)

    if(mime === "image/png"){
        res.sendFile(`./tags/${t.transaction.content}.png`, { root: __dirname });
    }
    else{
        res.sendFile(`./tags/${t.transaction.content}.mp3`, { root: __dirname });
    }

    //res.send(t.transaction)
})

app.post("/avatar", upload.single('file'), async (req, res) =>{
    
    console.log(green(), "Avatar Upload Request")
   
    if(req.file == undefined){
        console.log(red(), "Invalid format")
        res.send("Invalid format")
        return
    }

    const mime = (await fileTypeFromBuffer(req.file!.buffer))?.mime

    if(mime !== "image/png"){
        console.log(red(), "Invalid format")
        res.send("Invalid format")
        return;
    }

    // TODO file to block
    
    const command = new DetectModerationLabelsCommand({
        Image: {
          Bytes: req.file.buffer,
        },
        MinConfidence: 50, // Minimum confidence threshold
      });
    
    const rek: DetectModerationLabelsCommandOutput = await rekognition.send(command)

    if(rek.ModerationLabels!.length > 0){
        res.send("Abusive content detected")
        return;
    }
    console.log(green(),"No abusive content detected: avatar")

    // Ethereum tranaction try block
    try{
        const avatarjson = JSON.parse(req.body.data) 

        // Get name of user sending request to view avatar info
        const address_tx =  await engine.sendTransaction(network, {from: account}, "Name", "NamesResolver", [avatarjson.name], true);
        console.log(address_tx.transaction);

        if(address_tx.transaction == "0x0000000000000000000000000000000000000000"){
            res.send("Name doesn't exist")
            return;
        }
        console.log("Edit Reach")
        // get info to get avatar cid
        //console.log(address_tx.transaction)
        const info = await engine.sendTransaction(network, {from: account}, "Name", "Info", [address_tx.transaction], true);

        const file = new Uint8Array(req.file?.buffer as Buffer)
        //console.log("File", file)
        const block = await Block.encode({value: file, codec: raw, hasher: sha256})
        //console.log(info.transaction)
        //console.log(block.cid.toString())

        if(block.cid.toString() != info.transaction.avatar){
            res.send("Invalid Content cid")
            return;
        }

        await helia.blockstore.put(block.cid, block.bytes)

        await helia.pins.add(block.cid)

        fs.writeFileSync(`./tags/${block.cid.toString()}.png`, block.bytes)
        console.log(green(), "Avatar Uploaded")
        res.send("Avatar Uploaded")
    }catch(e){
        console.log(e)
    }
})

app.get("/avatar/:name", async (req, res) =>{
    const name = req.params.name

    const address_tx =  await engine.sendTransaction(network, {from: account}, "Name", "NamesResolver", [name], true);

    if(address_tx.transaction == "0x0000000000000000000000000000000000000000"){
        res.send("Name doesn't exist")
        return;
    }

    const info = await engine.sendTransaction(network, {from: account}, "Name", "Info", [address_tx.transaction], true);
    //console.log("file: ", file.buffer)

    if(info.transaction.avatar == "bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku"){
        res.send("No Avatar")
        return;
    }
    console.log(green(), "Avatar Sent")
    res.sendFile(`./tags/${info.transaction.avatar}.png`, { root: __dirname });
})

const server = app.listen(3001, () =>{console.log("listening on port 3001")})

server.on('connection', (socket) => {
    socket.on('error', (err) => {
      console.error('Socket error:', err);
    });
  });

  setInterval(async () => {
    const connections = await helia.libp2p.getConnections()
    console.log("helia connections: ", connections.length)
    
  }, 10000);