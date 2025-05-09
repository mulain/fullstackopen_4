// 3rd party
const bcrypt = require('bcrypt')
const supertest = require('supertest')

// local
const app = require('../app')
const Blog = require('../models/blog')
const User = require('../models/user')

const api = supertest(app)

const initialBlogs = [
  {
    _id: '5a422a851b54a676234d17f7',
    title: 'React patterns',
    author: 'Michael Chan',
    url: 'https://reactpatterns.com/',
    likes: 7,
    __v: 0,
  },
  {
    _id: '5a422aa71b54a676234d17f8',
    title: 'Go To Statement Considered Harmful',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
    likes: 5,
    __v: 0,
  },
  {
    _id: '5a422b3a1b54a676234d17f9',
    title: 'Canonical string reduction',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
    likes: 12,
    __v: 0,
  },
  {
    _id: '5a422b891b54a676234d17fa',
    title: 'First class tests',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll',
    likes: 10,
    __v: 0,
  },
  {
    _id: '5a422ba71b54a676234d17fb',
    title: 'TDD harms architecture',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html',
    likes: 0,
    __v: 0,
  },
  {
    _id: '5a422bc61b54a676234d17fc',
    title: 'Type wars',
    author: 'Robert C. Martin',
    url: 'http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html',
    likes: 2,
    __v: 0,
  },
]

const initialUsers = [
  {
    username: 'root',
    name: 'Superuser',
    passwordHash: '$2b$10$7Q1v5x4Z5z5Z5z5Z5z5Z5O',
  },
  {
    username: 'testuser',
    name: 'Test User',
    passwordHash: '$2b$10$7Q1v5x4Z5z5Z5z5Z5z5Z5O',
    },
]

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map((blog) => blog.toJSON())
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map((user) => user.toJSON())
}

const validUserId = async () => {
  const users = await usersInDb()
  const user = users[0]
  if (!user) {
    throw new Error('No users found in the database')
  }
  return user.id
}

const nonExistingId = async () => {
  const blog = new Blog({ content: 'willremovethissoon' })
  await blog.save()
  await blog.deleteOne()

  return blog._id.toString()
}

async function resetUsers() {
  await User.deleteMany({})
  await User.insertMany(initialUsers)
}

async function resetBlogs() {
  await Blog.deleteMany({})
  await Blog.insertMany(initialBlogs)
}

async function createUserAndGetIdAndToken() {
  const plainPassword = 'password'
  const passwordHash = await bcrypt.hash(plainPassword, 10)

  const user = new User({
    username: 'newUserForTests',
    name: 'Test User',
    passwordHash,
  })

  await user.save()

  const response = await api
    .post('/api/login')
    .send({ username: user.username, password: plainPassword })

  return {
    token: response.body.token,
    userId: user._id.toString(),
  }
}

module.exports = {
  initialBlogs,
  initialUsers,
  blogsInDb,
  usersInDb,
  validUserId,
  nonExistingId,
  resetUsers,
  resetBlogs,
  createUserAndGetIdAndToken,
}
