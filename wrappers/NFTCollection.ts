import { Address, Cell, ContractProvider, Sender, SendMode } from '@ton/core';
export * from '../build/NFTCollection/tact_NFTCollection';
import { NFTCollection } from '../build/NFTCollection/tact_NFTCollection';

export class ExtendedNFTCollection extends NFTCollection {
    async sendTransferNFT(provider: ContractProvider, via: Sender, nftId: number, newOwner: Address) {
        await provider.internal(via, {
            value: '0.01', // Adjust value as needed for gas
            bounce: true,
            sendMode: SendMode.PAY_GAS_REMAINING,
            body: new Cell().beginParse().storeUint(0x18, 8).storeUint(nftId, 32).storeAddress(newOwner).endParse(),
        });
    }

    async sendTransferOwnership(provider: ContractProvider, via: Sender, newOwner: Address) {
        await provider.internal(via, {
            value: '0.01', // Adjust value as needed for gas
            bounce: true,
            sendMode: SendMode.PAY_GAS_REMAINING,
            body: new Cell().beginParse().storeUint(0x19, 8).storeAddress(newOwner).endParse(),
        });
    }

    async sendPause(provider: ContractProvider, via: Sender) {
        await provider.internal(via, {
            value: '0.01', // Adjust value as needed for gas
            bounce: true,
            sendMode: SendMode.PAY_GAS_REMAINING,
            body: new Cell().beginParse().storeUint(0x1a, 8).endParse(),
        });
    }

    async sendUnpause(provider: ContractProvider, via: Sender) {
        await provider.internal(via, {
            value: '0.01', // Adjust value as needed for gas
            bounce: true,
            sendMode: SendMode.PAY_GAS_REMAINING,
            body: new Cell().beginParse().storeUint(0x1b, 8).endParse(),
        });
    }
}
