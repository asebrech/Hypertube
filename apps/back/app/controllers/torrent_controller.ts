import TorrentService from '#services/torrent_service'
import { inject } from '@adonisjs/core'
import { join } from 'node:path'
import app from '@adonisjs/core/services/app'

@inject()
export default class TorrentController {
  constructor(protected torrentService: TorrentService) {}

  async torrent({ request }) {
    const tmdb = request.qs().tmdbId
    console.log('TorrentController:tmdb', tmdb)
    if (this.torrentService.isMovieConverted(tmdb)) {
      console.log('TorrentController:tmdb', tmdb, 'already converted')
      return { message: 'Movie already converted' }
    }
    return await this.torrentService.respond(tmdb)
  }

  stream({ response, params }: any) {
    const filePath = join(app.makePath(), 'hls-output', ...params['*'])
    return response.download(filePath)
  }
}
