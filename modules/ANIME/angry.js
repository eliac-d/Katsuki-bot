import { runReaction } from './_runReaction.js'

export const angryCommand = {
    category: 'interacciones',
    commands: {
        angry: {
            name: 'angry',
            alias: ['enojado', 'angry'],
            libre: true,
            run: async (m, ctx) => runReaction('angry', m, ctx)
        }
    }
};
