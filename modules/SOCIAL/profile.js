import { jidNormalizedUser } from '@whiskeysockets/baileys'
import { getRealJid } from '../../core/identifier.js'
import phoneNumber from 'google-libphonenumber'
import util from 'util'
import os from 'os'
const phoneUtil = phoneNumber.PhoneNumberUtil.getInstance()

function formatearUptime(segundosTotales) {
    const segundos = Math.floor(segundosTotales)
    const dias = Math.floor(segundos / 86400)
    const horas = Math.floor((segundos % 86400) / 3600)
    const minutos = Math.floor((segundos % 3600) / 60)
    const segs = Math.floor(segundos % 60)
    const partes = []
    if (dias > 0) partes.push(`${dias}d`)
    if (horas > 0) partes.push(`${horas}h`)
    if (minutos > 0) partes.push(`${minutos}m`)
    partes.push(`${segs}s`)
    return partes.join(' ')
}

function obtenerNombreBot(conn) {
    try {
        if (typeof global.name === 'function') {
            const nombre = global.name(conn)
            if (nombre) return nombre
        }
    } catch (e) {}
    return conn?.user?.name || conn?.user?.verifiedName || 'Bot'
}

export const profile = {
    category: 'social',
    commands: {
        p: {
            name: 'profile',
            alias: ['p', 'perfil'],
            run: async (m, { conn, text, participants }) => {
                try {
                    let mencionadoRaw = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : m.sender

                    let realJid
                    try {
                        realJid = await getRealJid(conn, mencionadoRaw, m)
                    } catch (errId) {
                        realJid = mencionadoRaw
                    }

                    const quien = realJid ? jidNormalizedUser(realJid) : jidNormalizedUser(mencionadoRaw)
                    const nombreUsuario = m.pushName || 'Usuario'

                    let baseDatos = {}
                    try {
                        baseDatos = await global.User.findOne({ $or: [{ id: quien }, { lid: quien }] }).lean() || {}
                    } catch (errDb) {
                        baseDatos = {}
                    }

                    const datos = {
                        id: baseDatos.id || quien,
                        name: baseDatos.name || nombreUsuario,
                        marry: baseDatos.marry || '',
                        age: baseDatos.age || 0,
                        gender: baseDatos.gender || '',
                        identity: baseDatos.identity || '',
                        description: baseDatos.description || ''
                    }

                    let fotoPerfil = 'https://cdn.dix.lat/me/6e60ca0c-c1e8-46d2-ad62-6ea4c3af6e07.jpg'
                    try {
                        const urlOficial = await conn.profile(quien, 'image')
                        if (urlOficial) {
                            const controller = new AbortController()
                            const timeoutId = setTimeout(() => controller.abort(), 3000)

                            const res = await fetch(urlOficial, { method: 'HEAD', signal: controller.signal })
                            clearTimeout(timeoutId)

                            if (res.ok) {
                                fotoPerfil = urlOficial
                            }
                        }
                    } catch (e) {
                        fotoPerfil = 'https://cdn.dix.lat/me/6e60ca0c-c1e8-46d2-ad62-6ea4c3af6e07.jpg'
                    }

                    let numeroTelefonoLimpio = null
                    if (quien.endsWith('@s.whatsapp.net')) {
                        numeroTelefonoLimpio = quien.split('@')[0].split(':')[0].replace(/\D/g, '')
                    } else if (participants && Array.isArray(participants)) {
                        const participantesArray = participants.flat ? participants.flat() : participants
                        const obj = participantesArray.find(p => p && (p.lid === quien || p.id === quien))
                        if (obj) {
                            const target = obj.phoneNumber || obj.id
                            if (target && target.endsWith('@s.whatsapp.net')) {
                                numeroTelefonoLimpio = target.split('@')[0].split(':')[0].replace(/\D/g, '')
                            }
                        }
                    }

                    let pais = 'Desconocido'
                    if (numeroTelefonoLimpio) {
                        try {
                            const parsedNumber = phoneUtil.parse('+' + numeroTelefonoLimpio)
                            const regionCode = phoneUtil.getRegionCodeForNumber(parsedNumber)
                            pais = new Intl.DisplayNames(['es'], { type: 'region' }).of(regionCode) || 'Desconocido'
                        } catch (e) {
                            pais = 'Desconocido'
                        }
                    }

                    let infoPareja = 'Soltero/a'
                    const menciones = [quien]

                    if (datos.marry && typeof datos.marry === 'string' && datos.marry.includes('@')) {
                        const parejaLimpia = jidNormalizedUser(datos.marry.trim())
                        infoPareja = `Casado/a con @${parejaLimpia.split('@')[0]}`
                        menciones.push(parejaLimpia)
                    }

                    const usuarioLimpio = quien.split('@')[0].split(':')[0].replace(/\D/g, '')
                    const botJidLimpio = conn.user.id.split('@')[0].split(':')[0].replace(/\D/g, '')

                    const esBot = usuarioLimpio === botJidLimpio || (conn.user.lid && quien === jidNormalizedUser(conn.user.lid))

                    let esDueño = false
                    if (global.owner && Array.isArray(global.owner)) {
                        esDueño = global.owner.some(dns => {
                            if (!dns) return false
                            const num = Array.isArray(dns) ? dns[0] : dns
                            if (!num) return false
                            const numStr = String(num).replace(/\D/g, '')
                            return numStr === usuarioLimpio || (numeroTelefonoLimpio && numStr === numeroTelefonoLimpio)
                        })
                    }

                    let esAdminGrupo = false
                    let usernameEncontrado = null

                    if (participants && Array.isArray(participants)) {
                        const participantesArray = participants.flat ? participants.flat() : participants
                        const objetivo = participantesArray.find(p => {
                            if (!p) return false
                            const pId = p.id ? jidNormalizedUser(p.id) : ''
                            const pLid = p.lid ? jidNormalizedUser(p.lid) : ''
                            const pPhone = p.phoneNumber ? jidNormalizedUser(p.phoneNumber) : ''
                            return pId === quien || pLid === quien || pPhone === quien
                        })

                        if (objetivo) {
                            if (objetivo.admin === 'admin' || objetivo.admin === 'superadmin') {
                                esAdminGrupo = true
                            }
                            if (objetivo.username) {
                                usernameEncontrado = objetivo.username
                            }
                        }
                    }

                    let rango = 'Usuario'
                    if (esBot) {
                        rango = 'Bot'
                    } else if (esDueño) {
                        rango = 'Desarrollador / Owner'
                    } else if (esAdminGrupo) {
                        rango = 'Administrador'
                    }

                    const lineaUsername = usernameEncontrado ? `\n├User-Name: ${usernameEncontrado}` : ''

                    let textoPerfil = `
╭NOMBRE: @${quien.split('@')[0]}${lineaUsername}
├EDAD: ${datos.age > 0 ? datos.age : '--'} años
├PAIS: ${pais}
╰━━━━━━━━━━
╭GENERO: ${datos.gender || 'No definido'}
┝ORIENTACION: ${datos.identity || 'No definido'}
╰━━━━━━━━
╭RANGO: ${rango}
┝ESTADO CIVIL: ${infoPareja}
╰━━━━━
╭DESCRIPCION:
╰➠ ${datos.description || 'Sin descripción configurada.'}
`.trim()

                    const mencionesLimpias = [...new Set(menciones)].filter(jid => jid && typeof jid === 'string' && jid.includes('@')).map(jid => {
                        try {
                            return jidNormalizedUser(jid)
                        } catch (e) {
                            return jid
                        }
                    })

                    try {

                    await conn.sendPreviewMessage(m.chat, textoPerfil, {
                        type: 1, 
                        ratio: 'landscape',
                        url: global.surl ? global.surl(conn) : 'https://whatsapp.com',
                        thumbnail: fotoPerfil,
                        title: `\t\t\t\t\t\t웃 PERFIL DE USUARIO 𖤍`,
                        //body: name(conn),
                        quoted: m,
                        mentions: mencionesLimpias,
                        contextInfo: {
                            ...channelInfo,
                            mentionedJid: [m.sender]
                        }
                    });
                        
                    } catch (mediaError) {
                        await conn.sendMessage(m.chat, { 
                            text: textoPerfil,
                            mentions: mencionesLimpias
                        }, { quoted: m })
                    }

                } catch (errorCompleto) {
                    const reportError = `> *REPORTE DE DEPURACION COMPLETA*

*Mensaje:* ${errorCompleto.message}

*Stack Trace Completo:*
\`\`\`${util.format(errorCompleto.stack || errorCompleto)}\`\`\``

                    try {
                        await conn.reply(m.chat, reportError, m)
                    } catch (e) {
                        console.error(errorCompleto)
                    }
                }
            }
        }
    }
}
