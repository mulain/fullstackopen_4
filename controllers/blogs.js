// 3rd party
const blogsRouter = require('express').Router()

// local
const Blog = require('../models/blog')
const User = require('../models/user')
const { ERRORS } = require('../utils/constants')
const middleware = require('../utils/middleware')

blogsRouter.get('/', async (request, response, next) => {
  try {
    const blogs = await Blog.find({}).populate('user', {
      username: 1,
      name: 1,
    })

    response.json(blogs)
  } catch (error) {
    next(error)
  }
})

blogsRouter.get('/:id', async (request, response, next) => {
  try {
    const blog = await Blog.findById(request.params.id)

    if (blog) {
      response.json(blog)
    } else {
      response.status(404).end()
    }
  } catch (error) {
    next(error)
  }
})

blogsRouter.post(
  '/',
  middleware.userExtractor,
  async (request, response, next) => {
    const { title, author, url, likes = 0 } = request.body

    if (!request.user) {
      throw new Error(ERRORS.USERS.USER_NOT_FOUND)
    }

    if (!title) {
      throw new Error(ERRORS.BLOGS.TITLE_REQUIRED)
    }

    const blog = new Blog({
      title,
      author,
      url,
      likes,
      user: request.user,
    })

    try {
      const savedBlog = await blog.save()

      await User.findByIdAndUpdate(
        request.user,
        { $push: { blogs: savedBlog._id } },
        { new: true }
      )

      response.status(201).json(savedBlog)
    } catch (error) {
      next(error)
    }
  }
)

blogsRouter.delete(
  '/:id',
  middleware.userExtractor,
  async (request, response, next) => {
    const blog = await Blog.findById(request.params.id)
    if (!blog) {
      return response.status(404).json({ error: 'Blog not found' })
    }

    if (!request.user) {
      return response.status(401).json({ error: 'token missing or invalid' })
    }

    if (!blog.user || blog.user.toString() !== request.user) {
      return response.status(401).json({ error: 'unauthorized' })
    }

    try {
      const deletedBlog = await Blog.findByIdAndDelete(request.params.id)

      if (!deletedBlog) {
        return response.status(404).json({ error: 'Blog not found' })
      }

      await User.findByIdAndUpdate(request.user, { $pull: { blogs: blog._id } })

      response.status(204).end()
    } catch (error) {
      next(error)
    }
  }
)

blogsRouter.put('/:id', async (request, response, next) => {
  const { title, author, url, likes } = request.body

  try {
    const updatedBlog = await Blog.findByIdAndUpdate(
      request.params.id,
      { title, author, url, likes },
      { new: true, runValidators: true, context: 'query' }
    )

    if (!updatedBlog) {
      return response.status(404).end()
    }

    response.json(updatedBlog)
  } catch (error) {
    next(error)
  }
})

module.exports = blogsRouter
