import TorrentService from '#services/torrent_service'
import MovieService from '#services/movie_service'
import MovieCleanupService from '#services/movie_cleanup_service'
import { inject } from '@adonisjs/core'
import { join } from 'node:path'
import app from '@adonisjs/core/services/app'
import { HttpContext } from '@adonisjs/core/http'
import { formatBytes, isValidTmdbId } from '../utils/format.js'

interface DeleteMovieResult {
  success: boolean
  message: string
  spaceFreed: number
  error?: string
}

interface DeleteAllMoviesResult {
  success: boolean
  message: string
  moviesDeleted: number
  spaceFreed: number
  errors: number
  errorMessages: string[]
}

@inject()
export default class TorrentController {
  constructor(
    protected torrentService: TorrentService,
    protected movieService: MovieService,
    protected movieCleanupService: MovieCleanupService
  ) {}

  async torrent({ request }: HttpContext) {
    const tmdb = request.param('id')

    if (await this.torrentService.isMovieProcessing(tmdb)) {
      return { message: 'Movie is currently being processed or already processed' }
    }

    return await this.torrentService.download(tmdb)
  }

  async ready({ request }: HttpContext) {
    const tmdb = request.param('id')
    return this.torrentService.ready(tmdb)
  }

  async stream({ response, params }: HttpContext) {
    const filePath = join(app.makePath(), 'hls-output', ...params['*'])

    const pathParts = params['*'] as string[]
    if (pathParts && pathParts.length > 0) {
      const tmdbId = Number.parseInt(pathParts[0])
      if (!Number.isNaN(tmdbId)) {
        await this.movieService.updateLastAccessed(tmdbId)
      }
    }

    return response.download(filePath)
  }

  async delete({ request, response }: HttpContext) {
    try {
      const tmdbId = Number.parseInt(request.param('id'))

      if (Number.isNaN(tmdbId) || !isValidTmdbId(tmdbId)) {
        return response.badRequest({
          success: false,
          message: 'Invalid movie ID provided',
        })
      }

      const movieExists = await this.movieService.exists(tmdbId)
      if (!movieExists) {
        return response.notFound({
          success: false,
          message: 'Movie not found',
        })
      }

      const result = await this.movieCleanupService.deleteMovie(tmdbId)
      return this.handleDeleteResponse(response, result)
    } catch (error) {
      return this.handleDeleteError(response, error, 'deleting the movie')
    }
  }

  async deleteAll({ response }: HttpContext) {
    try {
      const result = await this.movieCleanupService.deleteAllMovies()
      return this.handleDeleteAllResponse(response, result)
    } catch (error) {
      return this.handleDeleteError(response, error, 'deleting all movies')
    }
  }

  private handleDeleteResponse(response: HttpContext['response'], result: DeleteMovieResult) {
    if (result.success) {
      return response.ok({
        success: true,
        message: result.message,
        spaceFreed: result.spaceFreed,
        spaceFreedFormatted: formatBytes(result.spaceFreed),
      })
    } else {
      if (result.error?.includes('currently')) {
        return response.conflict({
          success: false,
          message: result.message,
          error: result.error,
        })
      }
      
      return response.internalServerError({
        success: false,
        message: result.message,
        error: result.error,
      })
    }
  }

  private handleDeleteAllResponse(
    response: HttpContext['response'],
    result: DeleteAllMoviesResult
  ) {
    if (result.success) {
      return response.ok({
        success: true,
        message: result.message,
        moviesDeleted: result.moviesDeleted,
        spaceFreed: result.spaceFreed,
        spaceFreedFormatted: formatBytes(result.spaceFreed),
        errors: result.errors,
        errorMessages: result.errorMessages,
      })
    } else {
      return response.internalServerError({
        success: false,
        message: result.message,
        errors: result.errors,
        errorMessages: result.errorMessages,
      })
    }
  }

  private handleDeleteError(response: HttpContext['response'], error: unknown, operation: string) {
    console.error(`Error ${operation}:`, error)
    return response.internalServerError({
      success: false,
      message: `An unexpected error occurred while ${operation}`,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
