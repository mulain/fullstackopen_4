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

const api = supertest(app)

after(async () => {
    await mongoose.disconnect()
})

describe('User: create', () => {
  beforeEach(helper.resetUsers)

  test('a valid user can be added', async () => {
    const newUser = {
      username: 'newuser',
      name: 'New User',
      password: 'lukasdj123',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const finalUsers = await helper.usersInDb()

    assert.strictEqual(finalUsers.length, helper.initialUsers.length + 1)
    const addedUser = finalUsers.find(
      (user) => user.username === newUser.username
    )
    assert.ok(addedUser)
    assert.deepStrictEqual(
      { username: addedUser.username, name: addedUser.name },
      { username: newUser.username, name: newUser.name }
    )
  })

  test('a username must be unique', async () => {
    const initialUsers = await helper.usersInDb()

    const newUser = {
      username: 'rooty',
      name: 'New User',
      password: 'lukasdj123',
    }
    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    assert.ok(result.body.error, 'Expected error message in response body')
    assert.strictEqual(result.body.error, ERRORS.USERNAME_TAKEN)

    const finalUsers = await helper.usersInDb()
    assert.strictEqual(finalUsers.length, initialUsers.length + 1)
    assert.deepStrictEqual(
      finalUsers.map((user) => user.username).sort(),
      [
        ...helper.initialUsers.map((user) => user.username),
        newUser.username,
      ].sort()
    )
  })

  test('a user without username is not added', async () => {
    const initialUsers = await helper.usersInDb()

    const newUser = {
      name: 'New User',
      password: 'lukasdj123',
    }
    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)
    assert.ok(result.body.error, 'Expected error message in response body')
    assert.match(
      result.body.error,
      /username/i,
      "Expected error message to contain 'username'"
    )
    const finalUsers = await helper.usersInDb()
    assert.strictEqual(finalUsers.length, initialUsers.length)
    assert.deepStrictEqual(
      finalUsers.map((user) => user.username).sort(),
      helper.initialUsers.map((user) => user.username).sort()
    )
  })

  test('a user without password is not added', async () => {
    const initialUsers = await helper.usersInDb()

    const newUser = {
      username: 'newuser',
      name: 'New User',
    }
    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)
    assert.ok(result.body.error, 'Expected error message in response body')
    assert.match(
      result.body.error,
      /password/i,
      "Expected error message to contain 'password'"
    )
    const finalUsers = await helper.usersInDb()
    assert.strictEqual(finalUsers.length, initialUsers.length)
    assert.deepStrictEqual(
      finalUsers.map((user) => user.username).sort(),
      helper.initialUsers.map((user) => user.username).sort()
    )
  })

  test('a user with a short password is not added', async () => {
    const initialUsers = await helper.usersInDb()

    const newUser = {
      username: 'newuser',
      name: 'New User',
      password: '12',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    assert.ok(result.body.error, 'Expected error message in response body')

    assert.match(
      result.body.error,
      /password/i,
      "Expected error message to contain 'password'"
    )

    const finalUsers = await helper.usersInDb()

    assert.strictEqual(finalUsers.length, initialUsers.length)
    assert.deepStrictEqual(
      finalUsers.map((user) => user.username).sort(),
      helper.initialUsers.map((user) => user.username).sort()
    )
  })

  test('a user with a short username is not added', async () => {
    const initialUsers = await helper.usersInDb()

    const newUser = {
      username: 'nu',
      name: 'New User',
      password: 'lukasdj123',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    assert.ok(result.body.error, 'Expected error message in response body')
    assert.match(
      result.body.error,
      /username/i,
      "Expected error message to contain 'username'"
    )

    const finalUsers = await helper.usersInDb()

    assert.strictEqual(finalUsers.length, initialUsers.length)
    assert.deepStrictEqual(
      finalUsers.map((user) => user.username).sort(),
      initialUsers.map((user) => user.username).sort()
    )
  })
})
