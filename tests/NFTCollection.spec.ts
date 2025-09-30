import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, toNano } from '@ton/core';
import { ExtendedNFTCollection } from '../wrappers/NFTCollection';
import '@ton/test-utils';

describe('NFTCollection', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let nFTCollection: SandboxContract<ExtendedNFTCollection>;
    let notOwner: SandboxContract<TreasuryContract>;

    const imageUrl = "https://example.com/nft-image.jpg";
    const maxSupply = 3; // Set a small max supply for testing

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        nFTCollection = blockchain.openContract(await ExtendedNFTCollection.fromInit(imageUrl, maxSupply));

        deployer = await blockchain.treasury('deployer');
        notOwner = await blockchain.treasury('notOwner');

        const deployResult = await nFTCollection.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nFTCollection.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and nFTCollection are ready to use
    });

    it('should mint NFTs up to max supply', async () => {
        let totalNFTs = await nFTCollection.getTotalNFTs();
        expect(totalNFTs).toBe(0);

        // Mint 1st NFT
        let mintResult1 = await nFTCollection.send(deployer.getSender(), { value: toNano('0.1') });
        expect(mintResult1.transactions).toHaveTransaction({ from: deployer.address, to: nFTCollection.address, success: true });
        totalNFTs = await nFTCollection.getTotalNFTs();
        expect(totalNFTs).toBe(1);

        // Mint 2nd NFT
        let mintResult2 = await nFTCollection.send(deployer.getSender(), { value: toNano('0.1') });
        expect(mintResult2.transactions).toHaveTransaction({ from: deployer.address, to: nFTCollection.address, success: true });
        totalNFTs = await nFTCollection.getTotalNFTs();
        expect(totalNFTs).toBe(2);

        // Mint 3rd NFT
        let mintResult3 = await nFTCollection.send(deployer.getSender(), { value: toNano('0.1') });
        expect(mintResult3.transactions).toHaveTransaction({ from: deployer.address, to: nFTCollection.address, success: true });
        totalNFTs = await nFTCollection.getTotalNFTs();
        expect(totalNFTs).toBe(3);

        // Try to mint 4th NFT (should fail)
        let mintResult4 = await nFTCollection.send(deployer.getSender(), { value: toNano('0.1') });
        expect(mintResult4.transactions).toHaveTransaction({
            from: deployer.address,
            to: nFTCollection.address,
            success: false,
            exitCode: 3452093041, // Custom error code for "Max supply reached"
        });
        totalNFTs = await nFTCollection.getTotalNFTs();
        expect(totalNFTs).toBe(3);
    });

    it('should allow NFT transfer', async () => {
        // Mint an NFT first
        await nFTCollection.send(deployer.getSender(), { value: toNano('0.1') });
        let nftId = await nFTCollection.getTotalNFTs(); // Assuming the ID is the total count
        let nft = await nFTCollection.getNFTById(nftId);
        expect(nft.owner.toString()).toBe(deployer.address.toString());

        // Transfer NFT to notOwner
        await nFTCollection.sendTransferNFT(deployer.getSender(), nftId, notOwner.address);

        // Check new owner
        nft = await nFTCollection.getNFTById(nftId);
        expect(nft.owner.toString()).toBe(notOwner.address.toString());
    });

    it('should not allow unauthorized NFT transfer', async () => {
        // Mint an NFT first
        await nFTCollection.send(deployer.getSender(), { value: toNano('0.1') });
        let nftId = await nFTCollection.getTotalNFTs();

        // Try to transfer NFT by notOwner (should fail)
        const transferResult = await nFTCollection.sendTransferNFT(notOwner.getSender(), nftId, deployer.address);
        expect(transferResult.transactions).toHaveTransaction({
            from: notOwner.address,
            to: nFTCollection.address,
            success: false,
            exitCode: 32057, // Custom error code for "Only the current owner can transfer this NFT"
        });
    });

    it('should allow contract ownership transfer', async () => {
        expect(await nFTCollection.owner()).toEqualAddress(deployer.address);

        await nFTCollection.sendTransferOwnership(deployer.getSender(), notOwner.address);

        expect(await nFTCollection.owner()).toEqualAddress(notOwner.address);
    });

    it('should not allow unauthorized contract ownership transfer', async () => {
        expect(await nFTCollection.owner()).toEqualAddress(deployer.address);

        const transferResult = await nFTCollection.sendTransferOwnership(notOwner.getSender(), deployer.address);

        expect(transferResult.transactions).toHaveTransaction({
            from: notOwner.address,
            to: nFTCollection.address,
            success: false,
            exitCode: 22759, // Custom error code for "Only the owner can transfer contract ownership"
        });
        expect(await nFTCollection.owner()).toEqualAddress(deployer.address);
    });

    it('should allow pausing and unpausing the contract', async () => {
        expect(await nFTCollection.paused()).toBe(false);

        // Pause
        await nFTCollection.sendPause(deployer.getSender());
        expect(await nFTCollection.paused()).toBe(true);

        // Try minting when paused (should fail)
        const mintResult = await nFTCollection.send(deployer.getSender(), { value: toNano('0.1') });
        expect(mintResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: nFTCollection.address,
            success: false,
            exitCode: 33967, // Custom error code for "Contract is paused"
        });

        // Unpause
        await nFTCollection.sendUnpause(deployer.getSender());
        expect(await nFTCollection.paused()).toBe(false);

        // Minting should work after unpausing
        const mintResultAfterUnpause = await nFTCollection.send(deployer.getSender(), { value: toNano('0.1') });
        expect(mintResultAfterUnpause.transactions).toHaveTransaction({
            from: deployer.address,
            to: nFTCollection.address,
            success: true,
        });
    });

    it('should not allow unauthorized pause/unpause', async () => {
        expect(await nFTCollection.paused()).toBe(false);

        // Try to pause by notOwner (should fail)
        const pauseResult = await nFTCollection.sendPause(notOwner.getSender());
        expect(pauseResult.transactions).toHaveTransaction({
            from: notOwner.address,
            to: nFTCollection.address,
            success: false,
            exitCode: 29557, // Custom error code for "Only the owner can pause the contract"
        });
        expect(await nFTCollection.paused()).toBe(false);

        // Pause by owner first
        await nFTCollection.sendPause(deployer.getSender());
        expect(await nFTCollection.paused()).toBe(true);

        // Try to unpause by notOwner (should fail)
        const unpauseResult = await nFTCollection.sendUnpause(notOwner.getSender());
        expect(unpauseResult.transactions).toHaveTransaction({
            from: notOwner.address,
            to: nFTCollection.address,
            success: false,
            exitCode: 27961, // Custom error code for "Only the owner can unpause the contract"
        });
        expect(await nFTCollection.paused()).toBe(true);
    });
});
