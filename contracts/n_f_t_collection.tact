import "@stdlib/deploy";

/// Represents an NFT (Non-Fungible Token) in the NoLimitNFTCollection contract.
/// The NFT struct contains the following fields:
/// - `id`: The unique identifier of the NFT, represented as a 32-bit unsigned integer.
/// - `image`: The URL of the image associated with the NFT, represented as a string.
/// - `owner`: The address of the current owner of the NFT.
struct NFT {
    id: Int as uint32;
    image: String;
    owner: Address;
}

// This message represents an event that occurs when an NFT is minted.
//
// Fields:
// - amount: The amount of coins involved in the minting process.
// - recipient: The address of the recipient who will receive the minted NFT.
message NFTMintEvent {
    amount: Int as coins;
    recipient: Address;
}

// NoLimitNFTCollection contract
contract NoLimitNFTCollection with Deployable {
    // State Variables
    /// The address of the current owner of the NoLimitNFTCollection contract.
    owner: Address;
    
    /// The total number of NFTs minted in the NoLimitNFTCollection contract, represented as a 32-bit unsigned integer.
    nftCount: Int as uint32;
    
    /// The URL of the image associated with the NFTs in the NoLimitNFTCollection contract.
    nftImage: String;

    /// The maximum number of NFTs that can be minted in this collection.
    maxSupply: Int as uint32;

    /// Indicates whether the contract is paused. When paused, certain operations may be restricted.
    paused: Bool;
    
    /// A map that stores the NFTs minted in the NoLimitNFTCollection contract, where the key is the unique identifier (32-bit unsigned integer) of the NFT and the value is the NFT struct.
    nfts: map<Int as uint32, NFT>;

    /// Initializes a new NFT collection with the specified image URL and maximum supply.
    /// 
    /// # Parameters
    /// - `imageUrl`: A `String` representing the URL of the image associated with the NFT collection.
    /// - `maxSupply`: An `Int` representing the maximum number of NFTs that can be minted.
    /// 
    /// # Properties
    /// - `owner`: The address of the sender who initializes the NFT collection.
    /// - `nftCount`: The initial count of NFTs in the collection, set to 0.
    /// - `nftImage`: The URL of the image associated with the NFT collection.
    /// - `maxSupply`: The maximum number of NFTs that can be minted.
    init(imageUrl: String, maxSupply: Int) {
        self.owner = sender();
        self.nftCount = 0;
        self.nftImage = imageUrl;
        self.maxSupply = maxSupply;
        self.paused = false;
    }

    /**
     * @notice This function is triggered upon receiving a transaction.
     * It increments the NFT count, creates a new NFT with the incremented ID,
     * and assigns it to the sender. The new NFT is then stored in the collection.
     * Finally, an NFTMintEvent is emitted to signal the minting of a new NFT.
     *
     * @dev The function performs the following steps:
     * 1. Increments the `nftCount` by 1.
     * 2. Creates a new `NFT` instance with the incremented ID, the predefined image, and the sender as the owner.
     * 3. Stores the new `NFT` in the `nfts` collection using the incremented ID as the key.
     * 4. Emits an `NFTMintEvent` with the amount set to 1 and the recipient set to the sender.
     * @require The current NFT count must be less than the maximum supply.
     * @require The contract must not be paused.
     */
    receive() {
        require(!self.paused, "Contract is paused");
        require(self.nftCount < self.maxSupply, "Max supply reached");
        self.nftCount += 1;

        let newNFT: NFT = NFT{
            id: self.nftCount,
            image: self.nftImage,
            owner: sender(),
        };

        self.nfts.set(self.nftCount, newNFT);
        emit(NFTMintEvent{amount: 1, recipient: sender()}.toCell());
    }

    /**
     * @notice Transfers ownership of an NFT from the current owner to a new owner.
     * @dev Only the current owner of the NFT can initiate the transfer.
     * @param nftId The unique identifier of the NFT to transfer.
     * @param newOwner The address of the recipient who will receive the NFT.
     * @require The NFT must exist.
     * @require The sender must be the current owner of the NFT.
     */
    fun transferNFT(nftId: Int, newOwner: Address) {
        require(self.nfts.get(nftId) != null, "NFT does not exist");
        let nftToTransfer: NFT = self.nfts.get(nftId)!!;
        require(nftToTransfer.owner == sender(), "Only the current owner can transfer this NFT");

        nftToTransfer.owner = newOwner;
        self.nfts.set(nftId, nftToTransfer);
    }

    /**
     * @notice Transfers the ownership of the contract to a new address.
     * @dev Only the current owner of the contract can call this function.
     * @param newOwner The address of the new owner.
     * @require The sender must be the current owner of the contract.
     */
    fun transferOwnership(newOwner: Address) {
        require(sender() == self.owner, "Only the owner can transfer contract ownership");
        self.owner = newOwner;
    }

    /**
     * @notice Pauses the contract, restricting certain operations.
     * @dev Only the owner can call this function.
     * @require The sender must be the owner of the contract.
     */
    fun pause() {
        require(sender() == self.owner, "Only the owner can pause the contract");
        self.paused = true;
    }

    /**
     * @notice Unpauses the contract, allowing previously restricted operations.
     * @dev Only the owner can call this function.
     * @require The sender must be the owner of the contract.
     */
    fun unpause() {
        require(sender() == self.owner, "Only the owner can unpause the contract");
        self.paused = false;
    }

    /**
     * @notice Updates the image URL of the NFT.
     * @dev This function can only be called by the owner of the contract.
     * @param newImageUrl The new URL of the image to be set for the NFT.
     * @require The sender must be the owner of the contract.
     */
    fun updateImage(newImageUrl: String) {
        require(sender() == self.owner, "Only the owner can update the image");
        self.nftImage = newImageUrl;
    }

    /**
     * @notice Retrieves the total number of NFTs in the collection.
     * @return The total count of NFTs as an integer.
     */
    get fun getTotalNFTs(): Int {
        return self.nftCount;
    }

    /**
     * @notice Retrieves the image URL or data associated with the NFT.
     * @return A string representing the image of the NFT.
     */
    get fun getNFTImage(): String {
        return self.nftImage;
    }

    /**
     * Retrieves an NFT by its unique identifier.
     *
     * @param id The unique identifier of the NFT to retrieve.
     * @return The NFT associated with the given identifier.
     * @throws IllegalArgumentException if the NFT does not exist.
     */
    get fun getNFTById(id: Int): NFT {
        require(self.nfts.get(id) != null, "NFT does not exist");
        return self.nfts.get(id)!!;
    }
}
