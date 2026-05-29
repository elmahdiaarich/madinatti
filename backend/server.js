const express = require('express')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/auth')


const googleAuthRoutes = require("./routes/googleAuth")
const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use("/api/auth", googleAuthRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'Madinatti API is running' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})