const btp = require('ilp-plugin-btp')
const SPSP = require('ilp-protocol-spsp')

async function run () {
  console.log('paying $sharafian.com...')

  const plugin = new btp({
    server: 'btp+ws://:test@localhost:7768'
  })

  // use '$spsp.ilp-test.com' if you're on the testnet
  await SPSP.pay(plugin, {
    receiver: 'https://ilp.cinnamon.video/pay',
    sourceAmount: '10'
  })

  console.log('paid!')
}

run().catch(e => console.error(e))
