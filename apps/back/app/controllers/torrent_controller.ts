import TorrentService from '#services/torrent_service'
import { inject } from '@adonisjs/core'
import { join } from 'node:path'
import app from '@adonisjs/core/services/app'

@inject()
export default class TorrentController {
  constructor(protected torrentService: TorrentService) {}

  torrent() {
    return this.torrentService.respond()
  }

  stream({ response, params }: any) {
    const filePath = join(app.makePath(), 'hls-output', ...params['*'])
    return response.download(filePath)
  }
}
