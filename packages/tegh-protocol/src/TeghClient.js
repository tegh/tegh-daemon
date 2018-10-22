import Peer from 'simple-peer'

import eventTrigger, { signalTrigger } from './shared/eventTrigger'
import connectToSignallingServer from './shared/connectToSignallingServer'
import * as announcement from './shared/announcement'
import { chunkifier, dechunkifier } from './shared/webRTCDataChunk'

const CONNECTING = 'CONNECTING'
const OPEN = 'OPEN'
const CLOSED = 'CLOSED'

const TeghClient = ({
  keys,
  peerPublicKey,
  onWebRTCConnect = () => {},
  onWebRTCDisconnect = () => {},
}) => {
  const TeghClientSocket = (signallingServer, protocol) => {
    const rtcPeer = new Peer({ initiator: true })

    const teghSocket = {
      readyState: CONNECTING,
      send: () => {
        throw new Error('Cannot call send before connected')
      },
      close: () => rtcPeer.destroy(),
    }

    const receiveData = dechunkifier((data) => {
      console.log('RX', data.length, data.toString())
      teghSocket.onmessage({ data })
    })

    const connect = async () => {
      const announcementSocket = await connectToSignallingServer({
        keys,
        signallingServer,
      })

      // create an offer signal
      const offer = await signalTrigger(rtcPeer, 'offer')

      // announce the offer
      await announcement.publish({
        socket: announcementSocket,
        signal: offer,
        protocol,
        keys,
        peerPublicKey,
      })

      // await an answer
      const answerPayload = await eventTrigger(
        announcementSocket,
        'announcement',
        {
          map: message => announcement.decrypt({ message, keys }),
          filter: payload => payload.publicKey === peerPublicKey,
        },
      )

      /*
       * close the announcement websocket once we receive an answer from the
       * host.
       */
      announcementSocket.close()

      // establish the webRTC connection
      rtcPeer.signal(answerPayload.signal)

      // relay events through the teghSocket
      rtcPeer.on('connect', () => {
        teghSocket.send = chunkifier(rtcPeer._channel, (data) => {
          // eslint-disable-next-line no-underscore-dangle
          rtcPeer.send(data)
        })

        teghSocket.readyState = OPEN
        onWebRTCConnect(rtcPeer)
        teghSocket.onopen()
      })

      rtcPeer.on('data', receiveData)

      rtcPeer.on('iceStateChange', (state) => {
        if (state === 'disconnected') teghSocket.close()
      })

      rtcPeer.on('close', () => {
        teghSocket.readyState = CLOSED
        onWebRTCDisconnect(rtcPeer)
        teghSocket.onclose()
      })

      rtcPeer.on('error', () => {
        teghSocket.onerror()
      })
    }

    connect()
    return teghSocket
  }

  TeghClientSocket.CONNECTING = CONNECTING
  TeghClientSocket.OPEN = OPEN
  TeghClientSocket.CLOSED = CLOSED

  return TeghClientSocket
}

export default TeghClient
