import { useState } from 'react'
import { Wallet } from "./wallet/Wallet"
import { Web3Engine } from '@sb-labs/web3-engine'
import './App.css'

function App() {
  const [network, setNetwork] = useState<string>()
  const [engine, setEngine] = useState<Web3Engine>()

  const setEngineProps = (network: string, engine: Web3Engine) =>{
    setNetwork(network)
    setEngine(engine)
  }

  return (
    <div id="App">
      <Wallet network={network as string} engine={engine as Web3Engine} setEngineProps={setEngineProps}></Wallet>
    </div>
  )
}

export default App
