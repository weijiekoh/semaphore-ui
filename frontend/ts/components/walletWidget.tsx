import * as React from 'react'
const useState = React.useState
import ReactDOM from 'react-dom'
import { useWeb3Context, Connectors } from 'web3-react'
const config = require('../../exported_config')

const networkName = config.frontend.supportedNetworkName

const walletLearnUrl = 'https://ethereum.org/use/#_3-what-is-a-wallet' +
    '-and-which-one-should-i-use'

// From Font Awesome
const circleIcon = (className: string) => (
    <svg viewBox='0 0 512 512' className={'circle-icon ' + className}>
        <path d='M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8z'/>
    </svg>
)

const WalletWidget = () => {
    const context = useWeb3Context()

    const setConnector = () => {
        try {
            if (!context.connector) {
                context.setConnector('MetaMask')
            }
        } catch (e) {
            console.log('WalletWidget error:', e)
        }
    }

    setConnector()

    const render = () => {
        if (window.hasOwnProperty('ethereum')) {
            // @ts-ignore
            window.ethereum.enable()
        }

        if (!window.hasOwnProperty('ethereum')) {
            return (
                <p>
                    { circleIcon('fail') }
                    Please install an <a
                        href={walletLearnUrl} target='blank'>
                        Ethereum wallet.
                    </a>
                </p>
            )
        } else if (context.active && !context.error) {
            return (
                <p>
                    <span className='is-family-monospace address'>
                        { circleIcon('ok') }
                        { context.account }
                    </span>
                </p>
            )
        // @ts-ignore
        } else if (context.error != null && context.error.code === 'UNSUPPORTED_NETWORK') {
            return (
                <p>
                    { circleIcon('warn') }
                    Please connect to {networkName}.
                </p>
            )
        } else {
            return (
                <p>
                    Please log in to MetaMask or your web3 wallet.
                </p>
            )
        }
    }

    return (
        <div id='wallet-widget'>
            {render()}
        </div>
    )
}

export default WalletWidget
