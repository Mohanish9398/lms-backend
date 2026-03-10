const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()

console.log('Starting server...')
console.log('MONGO_URI:', process.env.MONGO_URI)

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', require('./routes/auth'))
app.use('/api/courses', require('./routes/courses'))

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('MongoDB connected successfully')
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    })
  } catch (error) {
    console.log('Error connecting to MongoDB: ' + error)
  }
}

connect()

