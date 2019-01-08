import { createSessionKey } from '../p2pCrypto/keys'
import { ENCRYPTION_ALGORITHM } from '../p2pCrypto/encryption'

import {
  HANDSHAKE_RES,
  MESSAGE_PROTOCOL_VERSION,
  HANDSHAKE_ALGORITHM,
  PUBLIC_KEY_LENGTH,
} from './constants'

const parseHandshakeRes = async ({
  response,
  identityKeys,
  ephemeralKeys,
}) => {
  const {
    type,
    protocolVersion,
    handshakeAlgorithm,
    encryptionAlgorithm,
    identityPublicKey: peerIDPK,
    ephemeralPublicKey: peerEpPK,
  } = response

  if (type !== HANDSHAKE_RES) {
    throw new Error('type must be HANDSHAKE_RES')
  }
  if (protocolVersion !== MESSAGE_PROTOCOL_VERSION) {
    throw new Error(`Unsupported protocolVersion: ${protocolVersion}`)
  }
  if (handshakeAlgorithm !== HANDSHAKE_ALGORITHM) {
    throw new Error(`Unsupported handshakeAlgorithm: ${handshakeAlgorithm}`)
  }
  if (encryptionAlgorithm !== ENCRYPTION_ALGORITHM) {
    throw new Error(`Unsupported encryptionAlgorithm: ${encryptionAlgorithm}`)
  }
  if (typeof peerIDPK !== 'string' || peerIDPK.length !== PUBLIC_KEY_LENGTH) {
    throw new Error(`Invalid peer identity public key: ${peerIDPK}`)
  }
  if (typeof peerEpPK !== 'string' || peerEpPK.length !== PUBLIC_KEY_LENGTH) {
    throw new Error(`Invalid peer ephemeral public key: ${peerIDPK}`)
  }

  const sessionKey = await createSessionKey({
    isHandshakeInitiator: true,
    identityKeys,
    ephemeralKeys,
    peerIdentityPublicKey: peerIDPK,
    peerEphemeralPublicKey: peerEpPK,
  })

  return {
    response,
    sessionKey,
  }
}

export default parseHandshakeRes