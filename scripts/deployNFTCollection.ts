import { toNano, Address } from '@ton/core';
import { ExtendedNFTCollection } from '../wrappers/NFTCollection';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const imageUrl = "https://example.com/nft-image.jpg";
    const maxSupply = 1000;

    const nFTCollection = provider.open(await ExtendedNFTCollection.fromInit(imageUrl, maxSupply));

    await nFTCollection.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(nFTCollection.address);

    // Example calls for new functionalities
    console.log("Deployed NFTCollection at:", nFTCollection.address);
    console.log("Total NFTs:", await nFTCollection.getTotalNFTs());

    // Mint an NFT (by sending a transaction to the contract)
    await nFTCollection.send(provider.sender(), { value: toNano('0.1') });
    console.log("NFT minted. Total NFTs:", await nFTCollection.getTotalNFTs());

    // Pause the contract
    await nFTCollection.sendPause(provider.sender());
    console.log("Contract paused.");

    // Try to mint again (should fail if paused)
    // await nFTCollection.send(provider.sender(), { value: toNano('0.1') });

    // Unpause the contract
    await nFTCollection.sendUnpause(provider.sender());
    console.log("Contract unpaused.");

    // Transfer NFT (example: transfer NFT with ID 1 to a new address)
    const recipientAddress = Address.parse("UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ"); // Replace with a valid recipient address
    await nFTCollection.sendTransferNFT(provider.sender(), 1, recipientAddress);
    console.log("NFT with ID 1 transferred to:", recipientAddress);

    // Transfer contract ownership (example: transfer to a new owner)
    const newOwnerAddress = Address.parse("UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ"); // Replace with a valid new owner address
    await nFTCollection.sendTransferOwnership(provider.sender(), newOwnerAddress);
    console.log("Contract ownership transferred to:", newOwnerAddress);
}
