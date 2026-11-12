import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SALT_ROUNDS = 10000;

const generateAdvancedKey = (customKey) => {
  const baseKey = customKey || 'dix.lat-neural-secure-core-2026';
  return crypto.pbkdf2Sync(baseKey, 'dix.lat-ai-salt-vector', SALT_ROUNDS, 32, 'sha512');
};

const aiEncrypt = (text, userKey) => {
  const key = generateAdvancedKey(userKey);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  const payload = `${iv.toString('hex')}.${authTag}.${encrypted}`;
  return Buffer.from(payload).toString('base64');
};

const aiDecrypt = (encodedPayload, userKey) => {
  try {
    const rawPayload = Buffer.from(encodedPayload, 'base64').toString('utf8');
    const [ivHex, authTagHex, encryptedText] = rawPayload.split('.');
    
    if (!ivHex || !authTagHex || !encryptedText) return null;

    const key = generateAdvancedKey(userKey);
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    return null;
  }
};

export const advancedCryptoCommand = {
  category: 'tools',
  commands: {
    aicifrar: {
      name: 'aicifrar',
      alias: ['scrypt', 'neuralencrypt'],
      libre: true,
      run: async function (m, { conn }) {
        const textArgs = m.text ? m.text.trim().split(/\s+/).slice(1).join(' ') : '';
        
        if (!textArgs && !m.quoted) {
          return m.reply('❌ Ingresa el texto o responde a un mensaje para procesarlo con el núcleo de cifrado avanzado.\n*Ejemplo:* `.aicifrar Mensaje confidencial`');
        }

        const targetText = textArgs || m.quoted.text;
        const secureToken = aiEncrypt(targetText);

        return m.reply(
          `🧠 *NÚCLEO DE CIFRADO AVANZADO (IA-AES)*\n\n` +
          `\`\`\`${secureToken}\`\`\`\n\n` +
          `_Procesado con integridad GCM y derivación adaptativa._`
        );
      }
    },
    aidescifrar: {
      name: 'aidescifrar',
      alias: ['scryptdec', 'neuraldecrypt'],
      libre: true,
      run: async function (m, { conn }) {
        const textArgs = m.text ? m.text.trim().split(/\s+/).slice(1).join(' ') : '';

        if (!textArgs && !m.quoted) {
          return m.reply('❌ Proporciona el token cifrado que deseas procesar.\n*Ejemplo:* `.aidescifrar [token]`');
        }

        const targetToken = textArgs || m.quoted.text;
        const decryptedText = aiDecrypt(targetToken);

        if (!decryptedText) {
          return m.reply('❌ *Error de validación:* El bloque de datos está corrupto, la clave no coincide o falló la verificación de integridad neuronal.');
        }

        return m.reply(
          `🔓 *DATOS DESCIFRADOS EXITOSAMENTE*\n\n` +
          `\`\`\`${decryptedText}\`\`\``
        );
      }
    }
  }
};
