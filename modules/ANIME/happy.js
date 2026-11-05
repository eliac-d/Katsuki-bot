import { runReaction } from './_runReaction.js'

export const happyCommand = {
    category: 'interacciones',
    commands: {
        happy: {
            name: 'happy',
            alias: ['happy', 'feliz'],
            libre: true,
            run: async (m, ctx) => runReaction('happy', m, ctx)
        }
    }
};
