import TorrentService from '#services/torrent_service'
import { inject } from '@adonisjs/core'

@inject()
export default class TorrentController {
  constructor(protected torrentService: TorrentService) {}

  torrent() {
    return this.torrentService.respond()
  }

  // stream({ response }: any) {
  //   return this.torrentService.stream({ response })
  // }
}
