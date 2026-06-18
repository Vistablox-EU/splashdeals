// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title IdentityRegistry
 * @dev Manages investor identities, verification status, and wallet-to-identity linking.
 * This contract is the single source of truth for whether an investor is eligible
 * to participate in an offering.
 */
contract IdentityRegistry is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    // A verified investor identity
    struct Identity {
        bytes32 countryCode; // ISO 3166-1 alpha-2 country code
        uint256 kycLevel;    // Level of KYC completed (e.g., 1 for basic, 2 for advanced)
        bool isAccredited; // Whether the investor is accredited
    }

    // Mapping from an investor's unique ID (e.g., a hash of their passport number) to their Identity
    mapping(bytes32 => Identity) private _identities;

    // Mapping from a wallet address to the investor's unique ID
    mapping(address => bytes32) private _walletToIdentity;

    // Set of all verified wallet addresses for quick lookups
    EnumerableSet.AddressSet private _verifiedWallets;
    
    // Set of addresses with the authority to add/update identities (e.g., a trusted KYC provider's wallet)
    mapping(address => bool) private _verifiers;

    event IdentitySet(bytes32 indexed identityId, bytes32 countryCode, uint256 kycLevel, bool isAccredited);
    event WalletLinked(address indexed wallet, bytes32 indexed identityId);
    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);

    constructor() Ownable(msg.sender) {
        _verifiers[msg.sender] = true; // The contract deployer is a verifier by default
    }

    modifier onlyVerifier() {
        require(_verifiers[msg.sender], "Caller is not a verifier");
        _;
    }

    // --- Verifier Management ---

    function addVerifier(address verifier) external onlyOwner {
        require(verifier != address(0), "Zero address");
        _verifiers[verifier] = true;
        emit VerifierAdded(verifier);
    }

    function removeVerifier(address verifier) external onlyOwner {
        _verifiers[verifier] = false;
        emit VerifierRemoved(verifier);
    }

    function isVerifier(address account) external view returns (bool) {
        return _verifiers[account];
    }
    
    // --- Core Logic ---

    function setIdentity(bytes32 identityId, bytes32 countryCode, uint256 kycLevel, bool isAccredited) external onlyVerifier {
        _identities[identityId] = Identity(countryCode, kycLevel, isAccredited);
        emit IdentitySet(identityId, countryCode, kycLevel, isAccredited);
    }

    function linkWallet(address wallet, bytes32 identityId) external onlyVerifier {
        require(_identities[identityId].kycLevel > 0, "Identity not verified");
        _walletToIdentity[wallet] = identityId;
        _verifiedWallets.add(wallet);
        emit WalletLinked(wallet, identityId);
    }

    // --- View Functions ---

    function isVerified(address wallet) external view returns (bool) {
        return _verifiedWallets.contains(wallet);
    }
    
    function getIdentity(address wallet) external view returns (Identity memory) {
        bytes32 identityId = _walletToIdentity[wallet];
        return _identities[identityId];
    }
}
