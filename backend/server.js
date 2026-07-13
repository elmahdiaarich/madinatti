const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express() 
app.use(cors())
app.use(express.json())

const authRoutes = require('./routes/auth')
const realEstateRoutes = require('./routes/realEstate');
const carsRouter = require('./routes/cars');
const tourismRoutes = require('./routes/tourism');

const googleAuthRoutes = require("./routes/googleAuth")


app.use('/api/auth', authRoutes)
app.use("/api/auth", googleAuthRoutes)

app.use('/api/real-estate', realEstateRoutes);
app.use('/api/cars', carsRouter);
app.use('/api/tourism', tourismRoutes);


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

const reportRoutes = require('./routes/reports');
app.use('/api/reports', reportRoutes);

const messageRoutes = require('./routes/messages');
app.use('/api/messages', messageRoutes);

app.use('/api/notifications', require('./routes/notifications'));

app.use('/api/alerts', require('./routes/alerts'));

const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);

app.use('/api/business/stats', require('./routes/stats'));

app.use('/api/uploads', require('./routes/uploadRoutes'));
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})