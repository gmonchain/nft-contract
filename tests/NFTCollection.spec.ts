import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { NFTCollection } from '../wrappers/NFTCollection';
import '@ton/test-utils';

describe('NFTCollection', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let nFTCollection: SandboxContract<NFTCollection>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        nFTCollection = blockchain.openContract(await NFTCollection.fromInit());

        deployer = await blockchain.treasury('deployer');

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
});
