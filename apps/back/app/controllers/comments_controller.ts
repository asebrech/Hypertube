import type { HttpContext } from '@adonisjs/core/http'
import Comment from '#models/comment'
import Movie from '#models/movies'
import { createCommentValidator, createMovieCommentValidator } from '#validators/comment'

class CommentsController {

  /**
   * GET /comments/:id
   * Returns comment, author's username, comment id, date posted
   */
  async show({ params, response }: HttpContext) {
    try {
      const comment = await Comment.query()
        .where('id', params.id)
        .preload('user', (userQuery) => {
          userQuery.select('id', 'username', 'email')
        })
        .preload('movie', (movieQuery) => {
          movieQuery.select('id', 'title')
        })
        .firstOrFail()

      const formattedComment = {
        id: comment.id,
        content: comment.content,
        date: comment.createdAt,
        username: comment.user.username || comment.user.email || 'Anonymous',
        movieId: comment.movieId,
        movieTitle: comment.movie.title,
      }

      return response.ok(formattedComment)
    } catch (error) {
      return response.notFound({ error: 'Comment not found' })
    }
  }

  /**
   * POST /comments
   * Creates a new comment
   * Expected data: comment, movie_id
   */
  async store({ request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const { content, movie_id } = await request.validateUsing(createCommentValidator)

      // Verify movie exists
      const movie = await Movie.findOrFail(movie_id)

      const comment = await Comment.create({
        content,
        userId: user.id,
        movieId: movie.id,
      })

      await comment.load('user', (userQuery) => {
        userQuery.select('id', 'username', 'email')
      })

      const formattedComment = {
        id: comment.id,
        content: comment.content,
        date: comment.createdAt,
        username: comment.user.username || comment.user.email || 'Anonymous',
        movieId: comment.movieId,
      }

      return response.created(formattedComment)
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ error: 'Movie not found' })
      }
      if (error.code === 'E_VALIDATION_ERROR') {
        return response.badRequest({ error: 'Validation failed', messages: error.messages })
      }
      return response.badRequest({ error: 'Failed to create comment' })
    }
  }

  /**
   * GET /movies/:movie_id/comments
   * Returns all comments for a specific movie
   */
  async movieComments({ params, request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 20)

      // Verify movie exists
      await Movie.findOrFail(params.movie_id)

      const comments = await Comment.query()
        .where('movie_id', params.movie_id)
        .preload('user', (userQuery) => {
          userQuery.select('id', 'username', 'email')
        })
        .orderBy('createdAt', 'desc')
        .paginate(page, limit)

      const formattedComments = comments.toJSON()
      formattedComments.data = formattedComments.data.map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        date: comment.createdAt,
        username: comment.user.username || comment.user.email || 'Anonymous',
      }))

      return response.ok(formattedComments)
    } catch (error) {
      console.log('Movie comments error:', error.message, error.code)
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ error: 'Movie not found' })
      }
      return response.badRequest({
        error: 'Failed to fetch movie comments',
        details: error.message,
      })
    }
  }

  /**
   * POST /movies/:movie_id/comments
   * Creates a new comment for a specific movie
   * Expected data: content
   */
  async storeMovieComment({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const { content } = await request.validateUsing(createMovieCommentValidator)

      // Verify movie exists
      const movie = await Movie.findOrFail(params.movie_id)

      const comment = await Comment.create({
        content,
        userId: user.id,
        movieId: movie.id,
      })

      await comment.load('user', (userQuery) => {
        userQuery.select('id', 'username', 'email')
      })

      const formattedComment = {
        id: comment.id,
        content: comment.content,
        date: comment.createdAt,
        username: comment.user.username || comment.user.email || 'Anonymous',
        movieId: comment.movieId,
      }

      return response.created(formattedComment)
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ error: 'Movie not found' })
      }
      if (error.code === 'E_VALIDATION_ERROR') {
        return response.badRequest({ error: 'Validation failed', messages: error.messages })
      }
      return response.badRequest({ error: 'Failed to create comment' })
    }
  }
}

export default CommentsController
