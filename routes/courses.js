const express = require('express')
const router = express.Router()
const Course = require('../models/Course')
const User = require('../models/User')
const { auth } = require('../middleware/auth')

// Get all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find()
    res.json(courses)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Get enrolled students for a course (admin only)
router.get('/:id/students', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' })
    const students = await User.find({ enrolledCourses: req.params.id }).select('-password')
    res.json(students)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Get my enrolled courses
router.get('/enrolled/my', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('enrolledCourses')
    res.json(user.enrolledCourses)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Get single course
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
    res.json(course)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Add course (admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' })
    const course = await Course.create(req.body)
    res.json(course)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Edit course (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' })
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(course)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Delete course (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' })
    await Course.findByIdAndDelete(req.params.id)
    await User.updateMany({ enrolledCourses: req.params.id }, { $pull: { enrolledCourses: req.params.id } })
    res.json({ message: 'Course deleted' })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Enroll in course
router.post('/enroll/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (user.enrolledCourses.includes(req.params.id))
      return res.status(400).json({ message: 'Already enrolled' })
    user.enrolledCourses.push(req.params.id)
    await user.save()
    res.json({ message: 'Enrolled successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Unenroll from course
router.delete('/unenroll/:id', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { $pull: { enrolledCourses: req.params.id } })
    res.json({ message: 'Unenrolled successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router