import { runReaction } from './_runReaction.js'

export const slapCommand = {
    category: 'interacciones',
    commands: {
        slap: {
            name: 'slap',
            alias: ['slap', 'bofetada'],
            libre: true,
            run: async (m, ctx) => runReaction('slap', m, ctx)
        }
    }
};
