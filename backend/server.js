const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express() 
app.use(cors())
app.use(express.json())

const authRoutes = require('./routes/auth')
const realEstateRoutes = require('./routes/realEstate');

const googleAuthRoutes = require("./routes/googleAuth")


app.use('/api/auth', authRoutes)
app.use("/api/auth", googleAuthRoutes)

app.use('/api/real-estate', realEstateRoutes);

//to uploas imgs on cloudnary
app.use('/api/upload', require('./routes/upload'));
//to get all catigories
app.use('/api/categories', require('./routes/categories'));

app.get('/', (req, res) => {
  res.json({ message: 'Madinatti API is running' })
})
const jobRoutes = require('./routes/jobs');
app.use('/api/jobs', jobRoutes);

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})