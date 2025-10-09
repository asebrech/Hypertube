import type { HttpContext } from '@adonisjs/core/http'
import Comment from '#models/comment'
import Movie from '#models/movies'
import MovieService from '#services/movie_service'
import { createMovieCommentValidator } from '#validators/comment'
import { inject } from '@adonisjs/core'

declare module '@adonisjs/core/http' {
  interface HttpContext {
    comment?: Comment
  }
}

@inject()
class CommentsController {
  constructor(private movieService: MovieService) {}

  /**
   * GET /comments/:id
   * Returns comment, author's username, comment id, date posted
   */
  async show({ params, response }: HttpContext) {
    try {
      const comment = await Comment.query()
        .where('id', params.id)
        .preload('user', (userQuery) => {
          userQuery.select('id', 'username', 'email', 'profilePicture')
        })
        .preload('movie', (movieQuery) => {
          movieQuery.select('id', 'title')
        })
        .firstOrFail()

      const formattedComment = {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISO(),
        updatedAt: comment.updatedAt.toISO(),
        username: comment.user.username || comment.user.email || 'Anonymous',
        userId: comment.user.id,
        movieId: comment.movieId,
        movieTitle: comment.movie.title,
        profilePicture: comment.user.profilePicture || null,
      }

      return response.ok(formattedComment)
    } catch (error) {
      return response.notFound({ error: 'Comment not found' })
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

      if (!params.id) {
        return response.badRequest({ error: 'Movie ID is required' })
      }

      const movie = await Movie.query().where('tmdbId', params.id).first()

      if (!movie) {
        return response.ok({
          data: [],
          meta: {
            total: 0,
            per_page: limit,
            current_page: page,
            last_page: 1,
            first_page: 1,
          },
        })
      }

      const comments = await Comment.query()
        .where('movie_id', movie.id)
        .preload('user', (userQuery) => {
          userQuery.select('id', 'username', 'email', 'profilePicture')
        })
        .orderBy('createdAt', 'desc')
        .paginate(page, limit)

      const formattedComments = comments.toJSON()
      formattedComments.data = formattedComments.data.map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        username: comment.user.username || comment.user.email || 'Anonymous',
        userId: comment.user.id,
        profilePicture: comment.user.profilePicture || null,
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
   * POST /movies/:id/comments
   * Creates a new comment for a specific movie
   * Expected data: content
   */
  async storeMovieComment({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const { content } = await request.validateUsing(createMovieCommentValidator)

      const movie = await this.movieService.getOrCreate(parseInt(params.id))

      const comment = await Comment.create({
        content,
        userId: user.id,
        movieId: movie.id,
      })

      await comment.load('user', (userQuery) => {
        userQuery.select('id', 'username', 'email', 'profilePicture')
      })

      const formattedComment = {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISO(),
        updatedAt: comment.updatedAt.toISO(),
        username: comment.user.username || comment.user.email || 'Anonymous',
        userId: comment.user.id,
        movieId: comment.movieId,
        profilePicture: comment.user.profilePicture || null,
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
   * DELETE /movies/comments/:commentId
   * Deletes a comment by ID (ownership verified by middleware)
   */
  async deleteComment({ response, comment }: HttpContext) {
    try {
      await comment!.delete()

      return response.ok({ message: 'Comment deleted successfully' })
    } catch (error) {
      console.log('Delete comment error:', error.message)
      return response.badRequest({ error: 'Failed to delete comment' })
    }
  }

  /**
   * PUT /movies/comments/:commentId
   * Updates a comment by ID (ownership verified by middleware)
   */
  async updateComment({ request, response, comment }: HttpContext) {
    try {
      if (!comment) {
        return response.badRequest({ error: 'Comment not found' })
      }

      const { content } = await request.validateUsing(createMovieCommentValidator)

      comment.content = content
      await comment.save()

      await comment.load('user', (userQuery: any) => {
        userQuery.select('id', 'username', 'email', 'profilePicture')
      })

      const formattedComment = {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISO(),
        updatedAt: comment.updatedAt.toISO(),
        username: comment.user.username || comment!.user.email || 'Anonymous',
        userId: comment.user.id,
        movieId: comment.movieId,
        profilePicture: comment.user.profilePicture || null,
      }

      return response.ok(formattedComment)
    } catch (error) {
      console.log('Update comment error:', error.message)
      if (error.code === 'E_VALIDATION_ERROR') {
        return response.badRequest({ error: 'Validation failed', messages: error.messages })
      }
      return response.badRequest({ error: 'Failed to update comment' })
    }
  }

  /**
   * GET /users/:user_id/comments
   * Returns all comments for a specific user with pagination
   */
  async userComments({ params, request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const limit = request.input('limit', 20)

      if (!params.user_id) {
        return response.badRequest({ error: 'User ID is required' })
      }

      const comments = await Comment.query()
        .where('user_id', params.user_id)
        .preload('user', (userQuery) => {
          userQuery.select('id', 'username', 'email', 'profilePicture')
        })
        .preload('movie', (movieQuery) => {
          movieQuery.select('id', 'title', 'tmdbId')
        })
        .orderBy('createdAt', 'desc')
        .paginate(page, limit)

      const formattedComments = comments.toJSON()
      formattedComments.data = formattedComments.data.map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        username: comment.user.username || comment.user.email || 'Anonymous',
        userId: comment.user.id,
        movieId: comment.movie.tmdbId,
        movieTitle: comment.movie.title,
        profilePicture: comment.user.profilePicture || null,
      }))

      return response.ok(formattedComments)
    } catch (error) {
      console.log('User comments error:', error.message, error.code)
      return response.badRequest({
        error: 'Failed to fetch user comments',
        details: error.message,
      })
    }
  }
}

export default CommentsController
