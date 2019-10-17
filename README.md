# semaphore-ui

This is a user interface which demonstrates the features of
[Semaphore](https://github.com/kobigurk/semaphore), a zero-knowledge signalling
gadget.

This UI uses [`libsemaphore`](https://github.com/weijiekoh/libsemaphore), a
library which provides cruical cryptographic helper functions to Semaphore
clients, such as mixers or anonymous voting apps.

It exposes the following features:

1. Generate an `Identity` (comprised of an EdDSA keypair, identity nullifier,
   and idenitty trapdoor)

2. Download and parse a Semaphore circuit, proving key, and verification key

3. Download leaves from a Semaphore contract deployed on the Kovan testnet

4. Add an external nullifier to the Semaphore contract

5. Broadcast a signal to the Semaphore contract; this involves generating a
   zk-SNARK proof and selecting an external nullifier which the signal will be
   for.

The [`SemaphoreClient.sol`](./contracts/sol/SemaphoreClient.sol) contract is a
simple interface to the following
[Semaphore.sol](./semaphore/semaphorejs/contracts/Semaphore.sol) functions:

- `insertIdentity`
- `addExternalNullifier`
- `broadcastSignal`

In this implementation of a Semaphore client, the deployment script deploys a
Semaphore contract and a SemaphoreClient contract, and sets the address of the
latter as the owner of the former. This allows anyone to bypass Semaphore's
`onlyOwner` guards in some of its functions. A mixer, for instance, would
require a deposit to be paid before invoking `insertIdentity`.

The frontend is built using React. Webpack is configured to use Terser to
compress **but not mangle** the Javascript source code, and thereby prevent
errors during witness generation.

## Example

This [broadcast
transaction](https://kovan.etherscan.io/tx/0x50aef915da2f84164888d1b6c3501bdacb7e9344e46b5d04183114f91b29cccb)
that broadcasted the string 'Hello, world' shows `48656c6c6f2c20776f726c6421`
at the end of the transaction data, which is hexadecimal for said string.

## Local development and testing

These instructions have been tested with Ubuntu 18.0.4 and Node 11.14.0.

### Requirements

- Node v11.14.0.
      - We recommend [`nvm`](https://github.com/nvm-sh/nvm) to manage your Node
        installation.

### Local development

Install `npx` and `http-server` if you haven't already:

```bash
npm install -g npx http-server
```

Clone this repository and its `semaphore` submodule:

```bash
git clone git@github.com:weijiekoh/mixer.git && \
cd mixer && \
git submodule update --init
```

Download the circuit, keys, and verifier contract. Doing this instead of
generating your own keys will save you about 20 minutes. Note that these are
not for production use as there is no guarantee that the toxic waste was
discarded.

```bash
./scripts/downloadSnarks.sh
```

Install all dependencies and build the source code:

```bash
npm i &&
npm run bootstrap &&
npm run build
```

In a separate terminal, navigate to `contracts` and launch Ganache:

```bash
cd contracts
npm run ganache
```

To deploy the contracts to the Ganache testnet
your home directory named `SU_TESTNET_DEPLOY_KEY` containing the following string:

```
0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3
```

**Note:** do not store any mainnet funds in the account associated with this
address or they will be swept away.

Staying inside the `contracts` directory, compile and deploy the contracts. You
need an [`solc`](https://github.com/ethereum/solidity) 0.5.X binary somewhere in your filesystem.

```bash
node build/compileAndDeploy.js -s /path/to/solc -o ./abi -i ./sol/
```

Next navigate to the `frontend` directory and rebuild the source:

```bash
cd ../frontend
npm run build
```

To launch a hot-reload development server, run:

```bash
npm run webpack-watch
```

To build a production frontend for the local testnet, run:

```bash
# start from the base semaphore-ui/ directory

npm run build && cd frontend && npm run webpack-build
```

## Production

To deploy the contracts to the Kovan testnet, first create a file in your home
directory named `SU_KOVAN_DEPLOY_KEY` containing the private key of an Ethereum
account with some Kovan ETH:

```
0x................................................................
```

Next, rebuild the source using the `kovan` NODE_ENV variable, which will make the `config` submodule select the `kovan.yaml` config file:

```
# in the base directory
NODE_ENV=kovan npm run build
```

Next, deploy the contracts:

```bash
cd contracts/
NODE_ENV=kovan npm run compileAndDeploy
```

Next, replace deployed contract addresses to `config/kovan.yaml`, and rebuild
the frontend:

```
# in the base directory
NODE_ENV=kovan npm run build && cd frontend && npm run webpack-build
```

If you receive a 401 error, replace the Kovan node URL in `config/kovan.yaml`
with a functioning one.
