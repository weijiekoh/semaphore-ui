import * as ethers from 'ethers'
const config = require('../../exported_config')

const scAbi = require('../../abi/SemaphoreClient.abi.json')
const semaphoreAbi = require('../../abi/Semaphore.abi.json')

const getProviderAndSigner = async (context: any) => {
    const provider = new ethers.providers.Web3Provider(
        await context.connector.getProvider(config.chain.chainId),
    )
    const signer = provider.getSigner()

    return { provider, signer }
}

const getSemaphoreContract = async (context: any) => {
    const { provider, signer } = await getProviderAndSigner(context)

    return new ethers.Contract(
        config.chain.contracts.Semaphore,
        semaphoreAbi,
        signer,
    )
}

const getSemaphoreClientContract = async (context: any) => {
    const { provider, signer } = await getProviderAndSigner(context)

    return new ethers.Contract(
        config.chain.contracts.SemaphoreClient,
        scAbi,
        signer,
    )
}


export {
    getSemaphoreClientContract,
    getSemaphoreContract,
}
