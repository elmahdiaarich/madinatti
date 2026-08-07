const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express() 
const allowedOrigins = (process.env.CORS_ORIGINS || [
  'https://madinatti.ma',
  'https://www.madinatti.ma',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    const localDevOrigin =
      process.env.NODE_ENV !== 'production' &&
      /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');
    if (!origin || allowedOrigins.includes(origin) || localDevOrigin) return callback(null, true);
    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json())

const authRoutes = require('./routes/auth')
const realEstateRoutes = require('./routes/realEstate');
const carsRouter = require('./routes/cars');
const tourismRoutes = require('./routes/tourism');
const professionalSpaceRoutes = require('./routes/professionalSpaces');
const healthRoutes = require('./routes/health');
const educationRoutes = require('./routes/education');
const eventRoutes = require('./routes/events');
const geoRoutes = require("./routes/geo");
const subscriptionRoutes = require('./routes/subscriptions');
const shopRoutes = require('./routes/shops');

const googleAuthRoutes = require("./routes/googleAuth")
const pressRoutes = require('./routes/press');
const { startPressScheduler } = require('./scheduled/scheduler');


app.use('/api/auth', authRoutes)
app.use("/api/auth", googleAuthRoutes)

app.use('/api/real-estate', realEstateRoutes);
app.use('/api/cars', carsRouter);
app.use('/api/tourism', tourismRoutes);
app.use('/api/industriel-zones', professionalSpaceRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/shops', shopRoutes);

app.use("/api/geo", geoRoutes);

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

app.use('/api/worker-profiles', require('./routes/workerProfiles'));
 
app.use('/api/task-requests', require('./routes/taskRequests'));
app.use('/api/task-applications', require('./routes/taskApplications'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/business/stats', require('./routes/stats'));
app.use('/api/press', pressRoutes);
app.use('/api/uploads', require('./routes/uploadRoutes'));

startPressScheduler();
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
