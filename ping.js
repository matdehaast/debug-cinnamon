const btp = require('ilp-plugin-btp')
const crypto = require('crypto')
const IlpPacket = require('ilp-packet')
const ILDCP = require('ilp-protocol-ildcp')
const { Writer } = require('oer-utils')

async function ping() {
  const conditionMap = new Map()
  const plugin = new btp({
    server: 'btp+ws://:test@localhost:7768'
  })

  await plugin.connect()

  plugin.registerDataHandler(data => {
    const { executionCondition } = IlpPacket.deserializeIlpPrepare(data)

    const fulfillment = conditionMap.get(executionCondition.toString('base64'))
    if (fulfillment) {
      conditionMap.delete(executionCondition.toString('base64'))
      console.log('Got first leg fulfillment, sending fulfill')
      return IlpPacket.serializeIlpFulfill({
        fulfillment: fulfillment,
        data: Buffer.alloc(0)
      })
    } else {
      throw new Error('unexpected packet.')
    }
  })

  const fulfillment = crypto.randomBytes(32)
  const condition = crypto.createHash('sha256').update(fulfillment).digest()
  const { clientAddress } = await ILDCP.fetch(plugin.sendData.bind(plugin))

  conditionMap.set(condition.toString('base64'), fulfillment)

  const writer = new Writer()

  writer.write(Buffer.from('ECHOECHOECHOECHO', 'ascii'))
  writer.writeUInt8(0)
  writer.writeVarOctetString(Buffer.from(clientAddress, 'ascii'))

  const packet = await plugin.sendData(IlpPacket.serializeIlpPrepare({
    destination: 'g.strata.tier2',
    amount: '0',
    executionCondition: condition,
    expiresAt: new Date(Date.now() + 10000),
    data: writer.getBuffer()
  }))
  const result = IlpPacket.deserializeIlpPacket(packet)
  console.log(result)
}

ping()
