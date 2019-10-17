import React, { useState } from 'react'
import * as ReactDOM from 'react-dom'
import '../less/index.less'
import { useWeb3Context } from 'web3-react'
import WalletWidget from './components/walletWidget'
import Web3Provider from 'web3-react'
import connectors from './web3'
import {
    initStorage,
    storeId,
    retrieveId,
    hasId,
} from './storage'

import {
    getSemaphoreClientContract,
    getSemaphoreContract,
} from './web3/contracts'

import {
    genIdentity,
    genIdentityCommitment,
    genCircuit,
    serialiseIdentity,
	genWitness,
} from 'libsemaphore'
const config = require('../exported_config.json')

const body = document.getElementsByTagName('body')[0]
const root = document.createElement('root')
if (body) {
    body.appendChild(root)
}

const fetchWithoutCache = (
    url: string,
) => {
    return fetch(url, { cache: 'no-store' })
}

const App = () => {
    initStorage()

    const [hasCheckedRegistration, setHasCheckedRegistration] = useState(false)
    const [selectedExternalNullifierIndex, setSelectedExternalNullifierIndex] = useState(0)
    const [newExternalNullifier, setNewExternalNullifier] = useState('')
    const [hasRegistered, setHasRegistered] = useState(false)
    const [externalNullifiers, setExternalNullifiers] = useState<any[]>([])
    const context = useWeb3Context()

    let identity
    let serialisedIdentity

    if (hasId()) {
        identity = retrieveId()
    } else {
        identity = genIdentity()
        storeId(identity)
    }
    serialisedIdentity = serialiseIdentity(identity)
    const identityCommitment = genIdentityCommitment(identity)

    const main = async () => {
        const semaphoreContract = await getSemaphoreContract(context)
        const semaphoreClientContract = await getSemaphoreClientContract(context)

        if (!hasCheckedRegistration) {
            const leaves = await semaphoreClientContract.getLeaves()
            if (leaves.map((x) => x.toString()).indexOf(identityCommitment.toString()) > -1) {
                setHasRegistered(true)
                setHasCheckedRegistration(true)
            }
        }

        if (externalNullifiers.length === 0) {
            const ens = await semaphoreClientContract.getExternalNullifiers()
            setExternalNullifiers(ens)
        }
    }

    const handleRegisterBtnClick = async () => {
        const semaphoreClientContract = await getSemaphoreClientContract(context)
        const tx = await semaphoreClientContract.insertIdentity(identityCommitment.toString())
        const receipt = await tx.wait()
        console.log(receipt)
    }

    const handleBroadcastBtnClick = async () => {
        const semaphoreClientContract = await getSemaphoreClientContract(context)
        const leaves = await semaphoreClientContract.getLeaves()
        console.log('Leaves:', leaves)
        const circuitUrl = config.snarkUrls.circuit
        console.log('Downloading circuit from', circuitUrl)

        const cirDef = await (await fetchWithoutCache(circuitUrl)).json() 
        const circuit = genCircuit(cirDef)

        const provingKeyUrl = config.snarkUrls.provingKey
        console.log('Downloading proving key from', provingKeyUrl)
        const provingKey = new Uint8Array(
            await (await fetch(provingKeyUrl)).arrayBuffer()
        )

        console.log('Generating witness')

		const result = await genWitness(
			'signal',
			circuit,
			identity,
			leaves,
			config.chain.semaphoreTreeDepth,
			BigInt(0),
		)

        
        const witness = result.witness
        console.log(circuit.checkWitness(witness))
    }

    main()

    const handleExternalNullifierSelect = (i: number) => {
        setSelectedExternalNullifierIndex(i)
    }

    const renderExternalNullifiers = () => {
        return (
            <div className='control'>
                {
                externalNullifiers.map((x, i) => {
                    return <p key={i}>
                        <label className="radio">
                            <input type='radio' 
                                checked={i === 0}
                                onChange={() => handleExternalNullifierSelect(i)}
                            />
                                {x.toString(16)}
                        </label>
                    </p>
                })
                }
            </div>
        )
    }

    const handleAddExternalNullifierClick = () => {
        console.log(newExternalNullifier)
    }

    return (
        <div className='section'>
            <div className='container'>
                <WalletWidget />
            </div>

            <hr />

            <div className='columns'>
                <div className='column is-12-mobile is-8-desktop is-offset-2-desktop'>
                    <h2 className='subtitle'>
                        Register your identity
                    </h2>

                    <p>
                        <label>Your identity (saved in localStorage):</label>
                    </p>

                    <textarea className='identityTextarea' value={serialisedIdentity} readOnly={true} />

                    <br />
                    { hasRegistered ? 
                        <p>You have already registered your identity.</p>
                        :
                        <button className='button is-success' onClick={handleRegisterBtnClick}>
                            Register
                        </button>
                    }
                </div>

            </div>

            <div className='columns'>
                <div className='column is-12-mobile is-8-desktop is-offset-2-desktop'>
                    <h2 className='subtitle'>
                        Select an external nullifier
                    </h2>

                    { externalNullifiers.length > 0 && renderExternalNullifiers() }
                    
                    <br />

                    <input type='text' className='input' 
                        value={newExternalNullifier}
                        onChange={(e) => setNewExternalNullifier(e.target.value)}
                        placeholder='New external nullifier' />
                    <button className='button is-primary' onClick={handleAddExternalNullifierClick}>
                        Add external nullifier
                    </button>
                </div>
            </div>

            <div className='columns'>

                <div className='column is-12-mobile is-8-desktop is-offset-2-desktop'>
                    <h2 className='subtitle'>
                        Broadcast a signal
                    </h2>
                        <button className='button is-success' onClick={handleBroadcastBtnClick}>
                            Broadcast
                        </button>
                </div>

            </div>
        </div>
    )
}

const Main = () => {

    return (
        <Web3Provider connectors={connectors} libraryName='ethers.js'>
            <App />
        </Web3Provider>
    )
}

ReactDOM.render(<Main />, root)
