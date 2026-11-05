import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import * as pix from 'pixcore';

let activeConn = null;

export function initGlobals(connInstance) {
    activeConn = connInstance;

    global.inapp = async ({ conn, chat, title = '★  ★', text = '▮on', buttonName = 'inapp_signup', buttonParams = {}, quoted } = {}) => {
        const client = conn || activeConn;
        if (!client) throw new Error('La conexión de WhatsApp no está inicializada.');

        const targetChat = chat;
        const paramsJson = typeof buttonParams === 'string' ? buttonParams : JSON.stringify(buttonParams);

        const rawPayload = {
            interactiveMessage: {
                header: {
                    title: title
                },
                body: {
                    text: text
                },
                nativeFlowMessage: {
                    buttons: [
                        {
                            name: buttonName,
                            buttonParamsJson: paramsJson
                        }
                    ],
                    messageParamsJson: ""
                }
            }
        };

        const options = {
            additionalNodes: [
                {
                    tag: "biz",
                    attrs: {},
                    content: [
                        {
                            tag: "interactive",
                            attrs: {
                                type: "native_flow",
                                v: "1"
                            },
                            content: [
                                {
                                    tag: "native_flow",
                                    attrs: {
                                        name: buttonName
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        if (quoted) options.quoted = quoted;

        return await client.relayMessage(targetChat, rawPayload, options);
    };

    global.customButtons = async ({ conn, chat, title = '', body = '', footer = '', buttons = [], quoted } = {}) => {
        const client = conn || activeConn;
        if (!client) throw new Error('La conexión de WhatsApp no está inicializada.');

        const rawPayload = {
            buttonsMessage: {
                contentText: body,
                footerText: footer,
                headerType: 1,
                buttons: buttons.map((btn, index) => ({
                    buttonId: btn.id || `btn_${index}`,
                    buttonText: { displayText: btn.text },
                    type: 1
                }))
            }
        };

        const options = {};
        if (quoted) options.quoted = quoted;

        return await client.relayMessage(chat, rawPayload, options);
    };

    global.sendNewsletterAdminInvite = async ({
        conn,
        chat,
        newsletterJid = ch,
        newsletterName,
        imageUrl,
        caption = "hola",
        expiration = true,
        expirationMs = 86400000,
        extraProps = {},
        quoted
    } = {}) => {
        const client = conn || activeConn;
        if (!client) throw new Error('La conexión de WhatsApp no está inicializada.');

        let jpegThumbnail = null;
        if (imageUrl) {
            const rawImg = await (await fetch(imageUrl)).arrayBuffer();
            jpegThumbnail = await (await pix.read(Buffer.from(rawImg)))
                .resize(150, 150, { fit: 'cover' })
                .jpeg({ quality: 80 })
                .toBuffer();
        }

        const newsletterAdminInviteMessage = {
            newsletterJid,
            newsletterName,
            jpegThumbnail,
            caption,
            ...extraProps
        };

        if (expiration) {
            newsletterAdminInviteMessage.inviteExpiration = Date.now() + expirationMs;
        }

        const options = {};
        if (quoted) options.quoted = quoted;

        return await client.relayMessage(chat, { newsletterAdminInviteMessage }, options);
    };
}