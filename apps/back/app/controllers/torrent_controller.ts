import TorrentService from '#services/torrent_service'
import MovieService from '#services/movie_service'
import MovieCleanupService from '#services/movie_cleanup_service'
import { inject } from '@adonisjs/core'
import { join } from 'node:path'
import app from '@adonisjs/core/services/app'
import { HttpContext } from '@adonisjs/core/http'

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

      if (Number.isNaN(tmdbId)) {
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

  private handleDeleteResponse(response: any, result: any) {
    if (result.success) {
      return response.ok({
        success: true,
        message: result.message,
        spaceFreed: result.spaceFreed,
        spaceFreedFormatted: this.formatBytes(result.spaceFreed),
      })
    } else {
      return response.internalServerError({
        success: false,
        message: result.message,
        error: result.error,
      })
    }
  }

  private handleDeleteAllResponse(response: any, result: any) {
    if (result.success) {
      return response.ok({
        success: true,
        message: result.message,
        moviesDeleted: result.moviesDeleted,
        spaceFreed: result.spaceFreed,
        spaceFreedFormatted: this.formatBytes(result.spaceFreed),
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

  private handleDeleteError(response: any, error: any, operation: string) {
    console.error(`Error ${operation}:`, error)
    return response.internalServerError({
      success: false,
      message: `An unexpected error occurred while ${operation}`,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }
}
