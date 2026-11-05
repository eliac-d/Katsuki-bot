import { runReaction } from './_runReaction.js'

export const hugCommand = {
    category: 'interacciones',
    commands: {
        hug: {
            name: 'hug',
            alias: ['hug', 'abrazo'],
            libre: true,
            run: async (m, ctx) => runReaction('hug', m, ctx)
        }
    }
};
