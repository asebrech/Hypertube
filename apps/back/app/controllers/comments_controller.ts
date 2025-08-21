import type { HttpContext } from '@adonisjs/core/http'
import Comment from '#models/comment'
import Movie from '#models/movies'
import MovieService from '#services/movie_service'
import { createMovieCommentValidator } from '#validators/comment'

declare module '@adonisjs/core/http' {
  interface HttpContext {
    comment?: Comment
  }
}

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

      // Find movie by tmdbId - use first() instead of firstOrFail()
      const movie = await Movie.query().where('tmdbId', params.id).first()

      if (!movie) {
        // Movie doesn't exist in our database yet, return empty comments
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
        userId: comment.user.id,
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

      // Get or create movie by tmdbId using MovieService
      const movieService = new MovieService()
      const movie = await movieService.getOrCreate(parseInt(params.id))

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
        userId: comment.user.id,
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
   * DELETE /movies/comments/:commentId
   * Deletes a comment by ID (ownership verified by middleware)
   */
  async deleteComment({ response, comment }: HttpContext) {
    try {
      // Delete the comment (ownership already verified by middleware)
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
      const { content } = await request.validateUsing(createMovieCommentValidator)

      // Update the comment (ownership already verified by middleware)
      comment!.content = content
      await comment!.save()

      // Load user relationship for response
      await comment!.load('user', (userQuery: any) => {
        userQuery.select('id', 'username', 'email')
      })

      const formattedComment = {
        id: comment!.id,
        content: comment!.content,
        date: comment!.createdAt,
        username: comment!.user.username || comment!.user.email || 'Anonymous',
        userId: comment!.user.id,
        movieId: comment!.movieId,
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
}

export default CommentsController
