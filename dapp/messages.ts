import { providers } from "@sb-labs/web3-data/networks/Providers.js"

import {Providers} from "@sb-labs/web3-data/networks/Providers.js"

import {deployed} from "@sb-labs/web3-data/networks/DeployedContracts.js"

import { Web3Engine } from "@sb-labs/web3-engine/Web3Engine.js";

import { EngineArgs } from "@sb-labs/web3-engine/Web3Engine.js";

import { contractFactoryV2 } from "@sb-labs/contract-factory-v2/ContractFactoryV2.js"

import { green, yellow, red, gray } from "@sb-labs/web3-data/functions/ConsoleColors.js";

import {ecrecover, toBuffer, } from "ethereumjs-util"

import fs from "fs"
import { enc } from "crypto-js";
import { time } from "console";
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from "constants";
import { web3ProvidersMapUpdated } from "web3";

let engine : Web3Engine;

let wallet: any

let mnemonic : string;

let account: string;

let publickey1: any;

let publickey2: any;

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

    await deployMessages();

    await registerPublicKeys();

    await sendMessages();

    await retreiveMessages()

    await sendValueMessage()

    process.exit(0)
}

const deployMessages = async () => {
    const publickeys = await engine.deploy(network, "PublicKeys", [], {from: account})

    console.log(publickeys.deployed.options.address)
    const messages = await engine.deploy(network, "Messages", [publickeys.deployed.options.address], {from: account})

    console.log(messages.deployed.options.address)
}

const registerPublicKeys = async () => { 

    const sig = await engine.defaultInstance?.web3.eth.sign("Enable Public Key.",account)
    const sig2 = await engine.defaultInstance?.web3.eth.sign("Enable Public Key.",wallet[1].address)

    console.log(sig)

    const publickeys_tx = await engine.sendTransaction(network, {from: account},  "PublicKeys", "register", [sig])

    if(!publickeys_tx.success){
        console.log(publickeys_tx.error)
        return;
    }

    const publickeys_tx2 = await engine.sendTransaction(network, {from: wallet[1].address},  "PublicKeys", "register", [sig2])

    if(!publickeys_tx2.success){
        console.log(publickeys_tx2.error)
        return;
    }

    const signKey = await engine.sendTransaction(network, {from: account},  "PublicKeys", "SignKeys", [account], true)

    publickey1 = signKey.transaction

    if(!signKey.success){
        console.log(signKey.error)
        return;
    }

    console.log(signKey.transaction)

    const signKey2 = await engine.sendTransaction(network, {from: wallet[1].address},  "PublicKeys", "SignKeys", [wallet[1].address], true)

    publickey2 = signKey2.transaction

    if(!signKey2.success){
        console.log(signKey2.error)
        return;
    }

    console.log(signKey2.transaction)
}

const sendMessages = async () => {

    const enableHash = await engine.sendTransaction(network, {from: account}, "PublicKeys", "EnableHash", [], true)

    console.log(enableHash)

    console.log("r:",publickey1.r,"s:", publickey1.s, "v:", publickey1.v)

    const keybuf1 = new Uint8Array( Buffer.from("04" + ecrecover(toBuffer(enableHash.transaction as string), Number(publickey2.v), toBuffer(publickey2.r as string), toBuffer(publickey2.s as string)).toString('hex'), "hex"))

    const encrypted_message = await engine.encrypt(keybuf1, "This is a test message.");

    const keybuf2 = new Uint8Array( Buffer.from("04" + ecrecover(toBuffer(enableHash.transaction as string), Number(publickey1.v), toBuffer(publickey1.r as string), toBuffer(publickey1.s as string)).toString('hex'), "hex"))

    const encrypted_from = await engine.encrypt(keybuf2, "This is a test message.");

    const msg = {
        to: wallet[1].address,
        value: 0,
        encrypted_message,
        encrypted_from,
        timestamp: 0
    }

    const message_tx = await engine.sendTransaction(network, {from: account}, "Messages", "sendMessage", [[msg.to, msg.value, msg.encrypted_message, msg.encrypted_from, msg.timestamp]])

    if(!message_tx.success){
        console.log(message_tx.error)
        return;
    }

}

const retreiveMessages = async () => {

    const message_tx = await engine.sendTransaction(network, {from: account}, "Messages", "getMessages", [wallet[1].address, account, 0, 0], true)
    console.log(message_tx)

    console.log(message_tx.transaction[0].encrypted_message)

    const encrypted_message = new Uint8Array(Buffer.from(message_tx.transaction[0].encrypted_message.slice(2), 'hex'))

    const message_decrypted = await engine.decrypt(1, encrypted_message)

    console.log(message_decrypted.toString())

    const encrypted_from = new Uint8Array(Buffer.from(message_tx.transaction[0].encrypted_from.slice(2), 'hex'))

    const from_decrypted = await engine.decrypt(0, encrypted_from)
    console.log(from_decrypted.toString())

    const numMessages = await engine.sendTransaction(network, {from: account}, "Messages", "numMessages", [wallet[1].address, account], true)

    console.log(numMessages)
}

const sendValueMessage = async () => {

    const enableHash = await engine.sendTransaction(network, {from: account}, "PublicKeys", "EnableHash", [], true)

    const keybuf1 = new Uint8Array( Buffer.from("04" + ecrecover(toBuffer(enableHash.transaction as string), Number(publickey2.v), toBuffer(publickey2.r as string), toBuffer(publickey2.s as string)).toString('hex'), "hex"))

    const encrypted_message = await engine.encrypt(keybuf1, "This is a value message.");

    const keybuf2 = new Uint8Array( Buffer.from("04" + ecrecover(toBuffer(enableHash.transaction as string), Number(publickey1.v), toBuffer(publickey1.r as string), toBuffer(publickey1.s as string)).toString('hex'), "hex"))

    const encrypted_from = await engine.encrypt(keybuf2, "This is a value message.");

    const value = engine.utils.toWei("0.01", "ether")

    console.log("Value:", value)

    const balance0 = engine.utils.fromWei(await engine.defaultInstance?.web3.eth.getBalance(wallet[1].address as string), "ether")

    console.log("Balance:", balance0)

    const value_tx = await engine.sendTransaction(network, {from: account, value}, "Messages", "sendMessage", [[wallet[1].address, value, encrypted_message, encrypted_from, 0]])

    console.log(value_tx.success)

    if(!value_tx.success){
        console.log(value_tx.error)
        return;
    }

    const balance1 = engine.utils.fromWei(await engine.defaultInstance?.web3.eth.getBalance(wallet[1].address as string), "ether")

    console.log("Balance:", balance1)
    
    //const numMessages = await engine.sendTransaction(network, {from: account}, "Messages", "numMessages", [wallet[1].address, account], true)

    //console.log(numMessages)

    //const message_tx = await engine.sendTransaction(network, {from: account}, "Messages", "getMessages", [wallet[1].address, account, 0, numMessages.transaction -1], true)

    //console.log(message_tx)
}

main()