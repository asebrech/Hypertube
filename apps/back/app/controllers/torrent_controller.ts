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

    console.log('TorrentController:tmdb', tmdb)

    if (this.torrentService.isMovieConverted(tmdb)) {
      console.log('TorrentController:tmdb', tmdb, 'already converted')
      return { message: 'Movie already converted' }
    }

    console.log('TorrentController:tmdb', tmdb, 'not converted, starting conversion')
    return await this.torrentService.download(tmdb)
  }

  async ready({ request }: HttpContext) {
    const resolution = request.param('resolution')
    const tmdb = request.param('id')
    return this.torrentService.ready(tmdb, resolution)
  }

  stream({ response, params }: HttpContext) {
    const filePath = join(app.makePath(), 'hls-output', ...params['*'])

    return response.download(filePath)
  }
}
