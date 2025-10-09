import TorrentService from '#services/torrent_service'
import MovieService from '#services/movie_service'
import MovieCleanupService from '#services/movie_cleanup_service'
import { inject } from '@adonisjs/core'
import { join } from 'node:path'
import app from '@adonisjs/core/services/app'
import { HttpContext } from '@adonisjs/core/http'
import { formatBytes } from '../utils/format.js'
import { tmdbIdValidator } from '../validators/torrent.js'

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

  async torrent({ request, response }: HttpContext) {
    const tmdb = request.param('id')

    if (await this.torrentService.isMovieProcessing(tmdb)) {
      return { message: 'Movie is currently being processed or already processed' }
    }

    const result = await this.torrentService.download(tmdb)

    // If the result indicates failure (no torrent, cleanup failed, etc), return 404
    const failureMessages = ['No torrent file found', 'Couldnt clean', 'Couldnt create or access movie record']
    if (failureMessages.some((msg) => result.message.includes(msg))) {
      return response.notFound(result)
    }

    return result
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
      const idParam = request.param('id')

      const payload = await tmdbIdValidator.validate({ id: idParam })
      const tmdbId = payload.id

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

  async list({ request, response }: HttpContext) {
    try {
      const page = Math.max(1, parseInt(request.qs().page || '1', 10))
      const limit = Math.min(100, Math.max(1, parseInt(request.qs().limit || '10', 10)))
      const search = request.qs().search?.toString() || ''
      const sortBy = request.qs().sortBy?.toString() || ''
      const sortDirection = request.qs().sortDirection?.toString() || 'desc'

      const result = await this.movieService.getDownloadedMoviesPaginated(
        page,
        limit,
        search,
        sortBy,
        sortDirection
      )

      return response.ok({
        success: true,
        movies: result.movies,
        pagination: {
          currentPage: page,
          totalPages: result.totalPages,
          totalMovies: result.totalMovies, // Filtered count for pagination
          limit: limit,
          hasNextPage: page < result.totalPages,
          hasPrevPage: page > 1,
        },
        totalSize: result.totalSize, // Size of current page
        globalStats: result.globalStats, // Global statistics for header
      })
    } catch (error) {
      return this.handleDeleteError(response, error, 'fetching movies list')
    }
  }

  async listWithoutStatus({ request, response }: HttpContext) {
    try {
      const page = Math.max(1, parseInt(request.qs().page || '1', 10))
      const limit = Math.min(100, Math.max(1, parseInt(request.qs().limit || '10', 10)))
      const search = request.qs().search?.toString() || ''

      const result = await this.movieService.getMoviesWithoutDownloadStatus(page, limit, search)

      return response.ok({
        success: true,
        movies: result.movies,
        pagination: {
          currentPage: page,
          totalPages: result.totalPages,
          totalMovies: result.totalMovies,
          limit: limit,
          hasNextPage: page < result.totalPages,
          hasPrevPage: page > 1,
        },
      })
    } catch (error) {
      return this.handleDeleteError(response, error, 'fetching movies without status')
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

      return response.notFound({
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
      return response.notFound({
        success: false,
        message: result.message,
        errors: result.errors,
        errorMessages: result.errorMessages,
      })
    }
  }

  private handleDeleteError(response: HttpContext['response'], error: unknown, operation: string) {
    return response.notFound({
      success: false,
      message: `An unexpected error occurred while ${operation}`,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
