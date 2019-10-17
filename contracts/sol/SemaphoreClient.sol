pragma solidity ^0.5.11;

import { Semaphore } from "./semaphore/Semaphore.sol";

contract SemaphoreClient {
    // The Semaphore contract
    Semaphore public semaphore;
    constructor (address _semaphore) public {
        semaphore = Semaphore(_semaphore);
    }

    /*
     * @param _identityCommitment The Semaphore identity commitment
     * Allows a user to register their identity into Semaphore
     */
    function insertIdentity(uint256 _identityCommitment) public {
        semaphore.insertIdentity(_identityCommitment);
    }

    function addExternalNullifier(uint256 _externalNullifier) public payable {
        semaphore.addExternalNullifier(_externalNullifier);
    }
    /*
     * @param _signal The signal to broadcast
     * @param _a The pi_a zk-SNARK proof data
     * @param _b The pi_b zk-SNARK proof data
     * @param _c The pi_c zk-SNARK proof data
     * @param _input The public signals to the zk-SNARK proof.
     * Allows a registered user to anonymously broadcast a signal.
     */
    function broadcastSignal(
        bytes memory _signal,
        uint[2] memory _a,
        uint[2][2] memory _b,
        uint[2] memory _c,
        uint[4] memory _input // (root, nullifiers_hash, signal_hash, external_nullifier)
    ) public {
        semaphore.broadcastSignal(
            _signal,
            _a,
            _b,
            _c,
            _input
        );
    }

    function getLeaves() public view returns (uint256[] memory) { 
        return semaphore.leaves(semaphore.id_tree_index());
    }

    function getExternalNullifiers() public view returns (uint256[] memory) {
        uint256 max = semaphore.getNextExternalNullifierIndex();
        uint256[] memory externalNullifiers = new uint256[](max);
        for (uint256 i=0; i < max; i++) {
            externalNullifiers[i] = semaphore.getExternalNullifierByIndex(i);
        }

        return externalNullifiers;
    }
}
