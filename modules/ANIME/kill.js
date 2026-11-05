import { runReaction } from './_runReaction.js'

export const killCommand = {
    category: 'interacciones',
    commands: {
        kill: {
            name: 'kill',
            alias: ['kill', 'matar'],
            libre: true,
            run: async (m, ctx) => runReaction('kill', m, ctx)
        }
    }
};
