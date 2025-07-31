import TorrentService from '#services/torrent_service'
import MovieService from '#services/movie_service'
import { inject } from '@adonisjs/core'
import { join } from 'node:path'
import app from '@adonisjs/core/services/app'
import { HttpContext } from '@adonisjs/core/http'

@inject()
export default class TorrentController {
  constructor(protected torrentService: TorrentService) {}

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

    // Extract tmdbId from the path to track access
    const pathParts = params['*'] as string[]
    if (pathParts && pathParts.length > 0) {
      const tmdbId = Number.parseInt(pathParts[0])
      if (!Number.isNaN(tmdbId)) {
        // Update last accessed timestamp
        const movieService = new MovieService()
        await movieService.updateLastAccessed(tmdbId)
      }
    }

    return response.download(filePath)
  }
}
