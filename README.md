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
