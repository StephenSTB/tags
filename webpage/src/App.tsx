import { useState } from 'react'
import { Wallet } from "./wallet/Wallet"
import { Web3Engine } from '@sb-labs/web3-engine'

import {useCallback, useEffect} from "react";
import Particles from "react-particles";
import { type Engine } from "@tsparticles/engine";
import { loadFull } from "tsparticles";

import { createHelia } from "helia";
import { MemoryBlockstore } from "blockstore-core";

import './App.css';

function App() {
  const [network, setNetwork] = useState<string>()
  const [engine, setEngine] = useState<Web3Engine>()

  useEffect( () =>{
    const startHelia = async () => {
      const helia = await createHelia({blockstore: new MemoryBlockstore()});
      console.log(helia.libp2p.peerId.toString())
      setInterval(async () => {
        const connections = await helia.libp2p.getConnections()
        //console.log(connections.length)
      }, 10000);
    }
    //startHelia()
    
  }, [])


  const setEngineProps = (network: string, engine: Web3Engine) =>{
    setNetwork(network)
    setEngine(engine)
  }

  const customInit = useCallback(async (e: Engine) => {
    // this adds the bundle to tsParticles
    console.log("init particles")
    await loadFull(e as any);
  }, []);

  const options = {
    fpsLimit:120,
    backgorund: {
      color: {
        value: "#000000",
      }
    },
    particles: {
      
        color: {
            value: ["#0000"],
        },
        move: {
            enable: true,
            
            random: false,
            speed: 4,
            straight: false,
            gravity:{
              acceleration: .5,
              enable: true,
              inverse: false,
              maxSpeed: 1
            },
            
        },
        number: {
            density: {
                enable: true,
                area: 800,
            },
            value: 10,
        },
        opacity: {
            value: 0.1,
        },
        shape: {
            type: "image",
            image: {
                src: "public/ethereum_black.png",
                width: 100,
                height: 100
            }
        },
        size: {
            value: { min: 20, max: 20},
        },
    },
    detectRetina: true,
}

  return (
    <div id="App">
      <Wallet network={network as string} engine={engine as Web3Engine} setEngineProps={setEngineProps}></Wallet>
      <Particles options={options} init={customInit as any} id="particles"/>
    </div>
  )
}

export default App
