// Node core
const { test, describe, after } = require('node:test')
const assert = require('node:assert')

// 3rd party
const mongoose = require('mongoose')

// local
const listHelper = require('../utils/list_helper')
const testHelper = require('./test_helper')

const blogs = testHelper.initialBlogs

// The disconnect is needed, because testHelper creates a supertest instance.
// We don't need it in this test file - maybe cleaner solution to create a 
// separate test_helper for supertest instance and another one for the rest.
after(async () => {
  await mongoose.disconnect()
})

describe('total likes', () => {
  test('when list has only one blog, equals the likes of that', () => {
    const result = listHelper.totalLikes([blogs[1]])
    assert.strictEqual(result, 5)
  })

  test('when list is empty, equals zero', () => {
    const result = listHelper.totalLikes([])
    assert.strictEqual(result, 0)
  })

  test('when list has multiple blogs, equals the sum of likes', () => {
    const result = listHelper.totalLikes(blogs)
    assert.strictEqual(result, 36)
  })
})

describe('favorite blog', () => {
  test('returns the blog with most likes', () => {
    const result = listHelper.favoriteBlog(blogs)
    assert.deepStrictEqual(result, blogs[2])
  })

  test('returns undefined for empty list', () => {
    const result = listHelper.favoriteBlog([])
    assert.strictEqual(result, undefined)
  })

  test('returns undefined for undefined', () => {
    const result = listHelper.favoriteBlog(undefined)
    assert.strictEqual(result, undefined)
  })
})

describe('most blogs', () => {
  test('returns the author with most blogs', () => {
    const result = listHelper.mostBlogs(blogs)
    assert.deepStrictEqual(result, {
      author: 'Robert C. Martin',
      blogs: 3,
    })
  })

  test('returns undefined for empty list', () => {
    const result = listHelper.mostBlogs([])
    assert.deepStrictEqual(result, {
      author: undefined,
      blogs: undefined,
    })
  })

  test('returns undefined for undefined', () => {
    const result = listHelper.mostBlogs([])
    assert.deepStrictEqual(result, {
      author: undefined,
      blogs: undefined,
    })
  })
})

describe('most likes', () => {
  test('returns the author with most likes', () => {
    const result = listHelper.mostLikes(blogs)
    assert.deepStrictEqual(result, {
      author: 'Edsger W. Dijkstra',
      likes: 17,
    })
  })

  test('returns undefined for empty list', () => {
    const result = listHelper.mostLikes([])
    assert.deepStrictEqual(result, {
      author: undefined,
      likes: undefined,
    })
  })

  test('returns undefined for undefined', () => {
    const result = listHelper.mostLikes(undefined)
    assert.deepStrictEqual(result, {
      author: undefined,
      likes: undefined,
    })
  })
})
