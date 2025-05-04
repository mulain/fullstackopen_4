// Node core
const { test, describe, after, beforeEach } = require('node:test')
const assert = require('node:assert')

// 3rd party
const mongoose = require('mongoose')
const supertest = require('supertest')

// local
const app = require('../app')
const helper = require('./test_helper')
const { ERRORS } = require('../utils/constants')
const Blog = require('../models/blog')

const api = supertest(app)

after(async () => {
    await mongoose.disconnect()
})

let apiToken
let apiUserId

describe('Blog: create', () => {
  beforeEach(async () => {
    await helper.resetUsers()
    await helper.resetBlogs()

    const result = await helper.createUserAndGetIdAndToken()
    apiToken = result.token
    apiUserId = result.userId
  })

  test('a valid blog can be added', async () => {
    const newBlog = {
      title: 'New Blog',
      author: 'New Author',
      url: 'http://example.com/new',
      likes: 0,
      user: apiUserId,
    }

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${apiToken}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const finalBlogs = await helper.blogsInDb()

    assert.strictEqual(finalBlogs.length, helper.initialBlogs.length + 1)

    const addedBlog = finalBlogs.find((blog) => blog.title === newBlog.title)
    assert.ok(addedBlog)
    const { title, author, url, likes } = addedBlog
    assert.deepStrictEqual(
      { title, author, url, likes, user: apiUserId },
      newBlog
    )
  })

  test('a blog without content is not added', async () => {
    const newBlog = {}

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${apiToken}`)
      .send(newBlog)
      .expect(400)

    const finalBlogs = await helper.blogsInDb()
    assert.strictEqual(finalBlogs.length, helper.initialBlogs.length)
  })

  test('a blog without likes is added with 0 likes', async () => {
    const newBlog = {
      title: 'New Blog',
      author: 'New Author',
      url: 'http://example.com/new',
      user: apiUserId,
    }

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${apiToken}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const finalBlogs = await helper.blogsInDb()

    assert.strictEqual(finalBlogs.length, helper.initialBlogs.length + 1)

    const addedBlog = finalBlogs.find((blog) => blog.title === newBlog.title)
    const { title, author, url, likes } = addedBlog
    assert.deepStrictEqual(
      { title, author, url, likes },
      {
        title: newBlog.title,
        author: newBlog.author,
        url: newBlog.url,
        likes: 0,
      }
    )
  })

  test('a blog without title generates 400 error with correct message', async () => {
    const newBlog = {
      author: 'New Author',
      url: 'http://example.com/new',
      likes: 0,
      user: apiUserId,
    }
    const result = await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${apiToken}`)
      .send(newBlog)
      .expect(400)

    const finalBlogs = await helper.blogsInDb()
    assert.strictEqual(finalBlogs.length, helper.initialBlogs.length)
    assert.strictEqual(result.body.error, ERRORS.BLOGS.TITLE_REQUIRED)
  })

  test('a blog without url generates a 400 error', async () => {
    const newBlog = {
      title: 'New Blog',
      author: 'New Author',
      likes: 0,
      user: apiUserId,
    }
    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${apiToken}`)
      .send(newBlog)
      .expect(400)

    const finalBlogs = await helper.blogsInDb()
    assert.strictEqual(finalBlogs.length, helper.initialBlogs.length)
  })
})

describe('Blog: read', () => {
  beforeEach(async () => {
    await helper.resetUsers()
    await helper.resetBlogs()
  })

  test('returns all initial blogs', async () => {
    const finalBlogs = await helper.blogsInDb()

    assert.strictEqual(finalBlogs.length, helper.initialBlogs.length)
  })

  test('a specific blog can be viewed', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToView = blogsAtStart[0]

    const resultBlog = await api
      .get(`/api/blogs/${blogToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    assert.deepStrictEqual(resultBlog.body, blogToView)
  })

  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('unique identifier property is named "id", not "_id"', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToView = blogsAtStart[0]

    assert.ok(blogToView.id)
    assert.strictEqual(blogToView._id, undefined)
  })
})

describe('Blog: update', () => {
  beforeEach(async () => {
    await helper.resetUsers()
    await helper.resetBlogs()
  })

  test('a blog can be updated', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = blogsAtStart[0]
    const updatedBlog = { ...blogToUpdate, likes: blogToUpdate.likes + 1 }

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(updatedBlog)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const finalBlogs = await helper.blogsInDb()
    const updatedBlogFromDb = finalBlogs.find(
      (blog) => blog.id === blogToUpdate.id
    )

    assert.deepStrictEqual(updatedBlogFromDb, updatedBlog)
  })
})

describe('Blog: delete', () => {
  beforeEach(async () => {
    await helper.resetUsers()
    await helper.resetBlogs()

    const result = await helper.createUserAndGetIdAndToken()
    apiToken = result.token
    apiUserId = result.userId
  })

  test('a blog cannot be deleted by different user', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `Bearer ${apiToken}`)
      .expect(401)

    const finalBlogs = await helper.blogsInDb()
    assert.strictEqual(finalBlogs.length, helper.initialBlogs.length)

    const notDeletedBlog = finalBlogs.find(
      (blog) => blog.id === blogToDelete.id
    )
    assert.ok(notDeletedBlog)
  })

  test('a blog can be deleted by its user', async () => {
    const blog = new Blog({
      title: 'Blog to be deleted',
      author: 'Author',
      url: 'http://example.com',
      likes: 0,
      user: new mongoose.Types.ObjectId(apiUserId),
    })

    const blogToDelete = await blog.save()

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `Bearer ${apiToken}`)
      .expect(204)

    const finalBlogs = await helper.blogsInDb()
    assert.strictEqual(finalBlogs.length, helper.initialBlogs.length)

    const deletedBlog = finalBlogs.find((blog) => blog.id === blogToDelete.id)
    assert.strictEqual(deletedBlog, undefined)
  })
})
