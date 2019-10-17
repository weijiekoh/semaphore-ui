import React, { useState } from 'react'
import * as ReactDOM from 'react-dom'
import * as ethers from 'ethers'
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
    genExternalNullifier,
    genProof,
    genPublicSignals,
    formatForVerifierContract,
} from 'libsemaphore'
const config = require('../exported_config.json')

const body = document.getElementsByTagName('body')[0]
const root = document.createElement('root')
if (body) {
    body.appendChild(root)
}

const keccak256 = (plaintext: string) => {
    return ethers.utils.solidityKeccak256(['string'], [plaintext])
}

const fetchWithoutCache = (
    url: string,
) => {
    return fetch(url, { cache: 'no-store' })
}

const App = () => {
    initStorage()

    const [proofStatus, setProofStatus] = useState('')
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
    let identityCommitment = genIdentityCommitment(identity)

    const getContractData = async () => {
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

        if (receipt.status === 1) {
            setHasRegistered(true)
            setHasCheckedRegistration(true)
        }
    }

    const handleBroadcastBtnClick = async () => {
        const en = externalNullifiers[selectedExternalNullifierIndex]

        // @ts-ignore
        const signal = document.getElementById('signal').value
        console.log('Broadcasting "' + signal + '" to external nullifier', en.toHexString())
        const signalAsHex = ethers.utils.hexlify(
            ethers.utils.toUtf8Bytes(signal),
        )
        const semaphoreClientContract = await getSemaphoreClientContract(context)

        setProofStatus('Downloading leaves')
        const leaves = await semaphoreClientContract.getLeaves()
        console.log('Leaves:', leaves)
        setProofStatus('Downloading circuit')
        const circuitUrl = config.snarkUrls.circuit
        console.log('Downloading circuit from', circuitUrl)

        const cirDef = await (await fetchWithoutCache(circuitUrl)).json() 
        const circuit = genCircuit(cirDef)

        const provingKeyUrl = config.snarkUrls.provingKey
        setProofStatus('Downloading proving key')
        console.log('Downloading proving key from', provingKeyUrl)
        const provingKey = new Uint8Array(
            await (await fetch(provingKeyUrl)).arrayBuffer()
        )

        setProofStatus('Generating witness')

		const result = await genWitness(
			signal,
			circuit,
			identity,
			leaves,
			config.chain.semaphoreTreeDepth,
			BigInt(en.toString()),
		)

        
        const witness = result.witness

        setProofStatus('Generating proof')
        const proof = await genProof(witness, provingKey)

        setProofStatus('Broadcasting signal')

        const publicSignals = genPublicSignals(witness, circuit)
        const formatted = formatForVerifierContract(proof, publicSignals)
        const tx = await semaphoreClientContract.broadcastSignal(
            ethers.utils.toUtf8Bytes(signal),
            formatted.a,
            formatted.b,
            formatted.c,
            formatted.input,
			{ gasLimit: 1000000 }
        )

        const receipt = await tx.wait()

        console.log(receipt)
		if (receipt.status === 1) {
			// @ts-ignore
			document.getElementById('signal').value = ''
            setProofStatus('')
        } else {
            setProofStatus('Transaction failed. Try signalling to a different external nullifier or use a fresh identity.')
        }
    }

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
                                name='externalNullifier'
                                checked={selectedExternalNullifierIndex === i}
                                onChange={() => handleExternalNullifierSelect(i)}
                            />
                            {x.toHexString()}
                        </label>
                    </p>
                })
                }
            </div>
        )
    }

    const handleReplaceBtnClick = async () => {
        identity = genIdentity()
        storeId(identity)
        serialisedIdentity = serialiseIdentity(identity)
        identityCommitment = genIdentityCommitment(identity)
        setHasRegistered(false)
    }

    const handleAddExternalNullifierClick = async () => {
        // @ts-ignore
        const externalNullifier = document.getElementById('newExternalNullifier').value
        if (externalNullifier.length > 0) {
            const semaphoreClientContract = await getSemaphoreClientContract(context)

            const hash = genExternalNullifier(externalNullifier)

            const tx = await semaphoreClientContract.addExternalNullifier(hash)
            const receipt = await tx.wait()

            console.log(receipt)

            if (receipt.status === 1) {
                const ens = await semaphoreClientContract.getExternalNullifiers()
                setExternalNullifiers(ens)
                // @ts-ignore
                document.getElementById('newExternalNullifier').value = ''
            }
        }
    }

    if (context.active) {
        getContractData()
    }

    return (
        <div className='section'>
            <div className='container' style={{textAlign: 'right'}}>
                <WalletWidget />
            </div>

            <hr />

            <div className='columns'>
                <div className='column is-12-mobile is-8-desktop is-offset-2-desktop'>
                    <p>
                        Using zero-knowledge proofs, Semaphore allows you to
                        broadcast an arbitary string without revealing your
                        identity, but only the fact that you are part of the
                        set of registered identities.
                        You may only broadcast once per external nullifier. To
                        broadcast more than once, you must either select (or
                        add) a new external nullifier, or register a new identity.
                        In real-world use, a Semaphore client should use a relayer to pay the gas
                        on behalf of the signaller to further preserve their
                        anonymity.
                    </p>
                </div>
            </div>

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
                    { hasCheckedRegistration && hasRegistered ? 
                        <p>You have registered your identity.</p>
                        :
                        <button className='button is-success' onClick={handleRegisterBtnClick}>
                            Register
                        </button>
                    }

                    { hasCheckedRegistration && hasRegistered && 
                        <button className='button is-warning' onClick={handleReplaceBtnClick}>
                            Replace identity
                        </button>
                    }
                </div>

            </div>

            <hr />

            <div className='columns'>
                <div className='column is-12-mobile is-8-desktop is-offset-2-desktop'>
                    <h2 className='subtitle'>
                        Select an external nullifier
                    </h2>

                    { externalNullifiers.length > 0 && renderExternalNullifiers() }
                    
                    <br />

                    <p>
                        Add a new external nullifier (the last 29 bytes of the
                        Keccak256 hash of what you type will be used):
                    </p>

                    <input id='newExternalNullifier' type='text' className='input' 
                        placeholder='Plaintext' />

                    <br />
                    <br />

                    <button className='button is-primary' onClick={handleAddExternalNullifierClick}>
                        Hash plaintext and add external nullifier
                    </button>
                </div>
            </div>

            { !hasRegistered &&
                <div className='columns'>

                    <div className='column is-12-mobile is-8-desktop is-offset-2-desktop'>
                        <p>You must first register to broadcast a signal.</p>
                    </div>
                </div>

            }

            <hr />

            { hasRegistered &&
            <div className='columns'>

                <div className='column is-12-mobile is-8-desktop is-offset-2-desktop'>
                    <h2 className='subtitle'>
                        Broadcast a signal
                    </h2>

                    {proofStatus.length > 0 &&
                        <div>
                            <pre>
                                {proofStatus}
                            </pre>
                            <br />
                            <br />
                        </div>
                    }

                    <input id='signal' type='text' className='input' 
                        placeholder='Signal' />

                    <br />
                    <br />

                    <button className='button is-success' onClick={handleBroadcastBtnClick}>
                        Broadcast
                    </button>
                </div>

            </div>
            }
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
