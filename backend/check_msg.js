const p = require('./config/db')
p.businessMessage.count().then(n => {
  console.log('Total businessMessages in DB:', n)
  process.exit(0)
}).catch(e => {
  console.error('Error:', e.message)
  process.exit(1)
})
