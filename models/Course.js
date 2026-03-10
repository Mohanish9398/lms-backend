const mongoose = require('mongoose')

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  video: { type: String, required: true },
  duration: { type: String, default: '' }
})

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  instructor: { type: String, required: true },
  duration: { type: String, required: true },
  image: { type: String, required: true },
  description: { type: String, required: true },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
  price: { type: String, default: 'Free' },
  topics: [{ type: String }],
  video: { type: String, required: true },
  lessons: [lessonSchema],
  createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Course', courseSchema)