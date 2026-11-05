import { runReaction } from './_runReaction.js'

export const coffeeCommand = {
    category: 'interacciones',
    commands: {
        coffee: {
            name: 'coffee',
            alias: ['coffee', 'cafe'],
            libre: true,
            run: async (m, ctx) => runReaction('coffee', m, ctx)
        }
    }
};
