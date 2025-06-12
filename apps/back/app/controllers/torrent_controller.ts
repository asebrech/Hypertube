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

  stream({ request, response }: HttpContext) {
    const filePath = `./downloads/test.mp4`

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`)
    }

    const stat = fs.statSync(filePath)
    const fileSize = stat.size
    const range = request.header('range') || 'bytes=0-'

    const parts = range.replace(/bytes=/, '').split('-')
    const start = Number.parseInt(parts[0], 10)
    const end = parts[1] ? Number.parseInt(parts[1], 10) : fileSize - 1

    if (start >= fileSize) {
      return response.status(416).send('Range Not Satisfiable')
    }

    const chunkSize = end - start + 1
    const file = fs.createReadStream(filePath, { start, end })

    response
      .status(206)
      .header('Content-Range', `bytes ${start}-${end}/${fileSize}`)
      .header('Accept-Ranges', 'bytes')
      .header('Content-Length', chunkSize)
      .header('Content-Type', 'video/mp4')

    return response.stream(file)
  }
}
