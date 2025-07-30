import TorrentService from '#services/torrent_service'
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

  stream({ response, params }: HttpContext) {
    const filePath = join(app.makePath(), 'hls-output', ...params['*'])

    return response.download(filePath)
  }
}
