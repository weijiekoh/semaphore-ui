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

4. Add or remove an external nullifier to the Semaphore contract

5. Broadcast a signal to the Semaphore contract; this involves generating a
   zk-SNARK proof and selecting an external nullifier which the signal will be
   for.

## Local development and testing

These instructions have been tested with Ubuntu 18.0.4 and Node 11.14.0.

### Requirements

- Node v11.14.0.
      - We recommend [`nvm`](https://github.com/nvm-sh/nvm) to manage your Node
        installation.

- [`etcd`](https://github.com/etcd-io/etcd) v3.3.13
    - The relayer server requires an `etcd` server to lock the account nonce of
      its hot wallet.

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

