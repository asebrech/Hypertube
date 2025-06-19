import TorrentService from '#services/torrent_service'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import fs from 'node:fs'
import { PassThrough } from 'node:stream'

@inject()
export default class TorrentController {
  constructor(protected torrentService: TorrentService) {}

  torrent() {
    return this.torrentService.respond()
  }

  stream(ctx: HttpContext) {
    this.torrentService.stream(ctx)
  }
}
