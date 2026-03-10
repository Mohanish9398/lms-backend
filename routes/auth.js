const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { auth } = require('../middleware/auth')

// Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body
    const existing = await User.findOne({ email })
    if (existing) return res.status(400).json({ message: 'Email already exists' })
    const hashed = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, password: hashed })
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ message: 'Invalid credentials' })
    if (user.banned) return res.status(403).json({ message: 'Your account has been banned.' })
    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(400).json({ message: 'Invalid credentials' })
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Get all users (admin only)
router.get('/users', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' })
    const users = await User.find().populate('enrolledCourses')
    res.json(users)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Get single user (admin only)
router.get('/users/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' })
    const user = await User.findById(req.params.id).populate('enrolledCourses')
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Edit user (admin only)
router.put('/users/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' })
    const { name, email, role } = req.body
    const user = await User.findByIdAndUpdate(req.params.id, { name, email, role }, { new: true })
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Reset user password (admin only)
router.put('/users/:id/reset-password', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' })
    const { newPassword } = req.body
    const hashed = await bcrypt.hash(newPassword, 10)
    await User.findByIdAndUpdate(req.params.id, { password: hashed })
    res.json({ message: 'Password reset successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Ban/unban user (admin only)
router.put('/users/:id/ban', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' })
    const user = await User.findById(req.params.id)
    user.banned = !user.banned
    await user.save()
    res.json({ message: user.banned ? 'User banned' : 'User unbanned', banned: user.banned })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Delete user (admin only)
router.delete('/users/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' })
    await User.findByIdAndDelete(req.params.id)
    res.json({ message: 'User deleted' })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// Unenroll user from course (admin only)
router.put('/users/:id/unenroll/:courseId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' })
    await User.findByIdAndUpdate(req.params.id, {
      $pull: { enrolledCourses: req.params.courseId }
    })
    res.json({ message: 'User unenrolled from course' })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router