const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/auth')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'Madinatti API is running' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on", PORT);
});