import { runReaction } from './_runReaction.js'

export const cryCommand = {
    category: 'interacciones',
    commands: {
        cry: {
            name: 'cry',
            alias: ['llorar'],
            libre: true,
            run: async (m, ctx) => runReaction('cry', m, ctx)
        }
    }
};
