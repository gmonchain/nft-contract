import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tact',
    target: 'contracts/n_f_t_collection.tact',
    options: {
        debug: true,
        // The `init` function now requires `maxSupply` as an argument.
        // This needs to be provided during deployment.
        arguments: [
            {
                name: 'imageUrl',
                type: 'string',
            },
            {
                name: 'maxSupply',
                type: 'uint32',
            },
        ],
    },
};
