// 3rd party
const _ = require('lodash')

const totalLikes = (blogs) => {
  return blogs.reduce((sum, blog) => sum + blog.likes, 0)
}

const favoriteBlog = (blogs) => {
  if (!Array.isArray(blogs) || blogs.length === 0) {
    return undefined
  }

  return blogs.reduce(
    (favorite, current) =>
      current.likes > favorite.likes ? current : favorite,
    blogs[0]
  )
}

const mostBlogs = (blogs) => {
  const authorCount = _.countBy(blogs, 'author')

  const mostBlogsAuthor = _.maxBy(
    Object.keys(authorCount),
    (author) => authorCount[author]
  )

  return {
    author: mostBlogsAuthor,
    blogs: authorCount[mostBlogsAuthor],
  }
}

const mostLikes = (blogs) => {
  if (!Array.isArray(blogs) || blogs.length === 0) {
    return {
      author: undefined,
      likes: undefined,
    }
  }

  const authorLikes = blogs.reduce((result, blog) => {
    result[blog.author] = (result[blog.author] || 0) + blog.likes
    return result
  }, {})

  const mostLikesAuthor = _.maxBy(
    Object.entries(authorLikes),
    ([_author, likes]) => likes
  )

  return {
    author: mostLikesAuthor[0],
    likes: mostLikesAuthor[1],
  }
}

module.exports = {
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes,
}
