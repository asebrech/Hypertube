import torrentStream from 'torrent-stream'
import fs from 'node:fs'
import { PassThrough } from 'node:stream'
import Ffmpeg from 'fluent-ffmpeg'
import { HttpContext } from '@adonisjs/core/http'

export default class EchoService {
  getConvertedStream = (inputStream: any, fileExtension: any) => {
    const pass = new PassThrough()

    Ffmpeg()
      .input(inputStream)
      .outputOptions([
        '-f hls',
        '-deadline realtime',
        '-preset ultrafast',
        '-start_number 0',
        '-hls_time 2',
        '-hls_list_size 0',
        '-movflags frag_keyframe+empty_moov',
        '-g 52',
      ])
      .outputFormat('mp4')
      .on('error', (_) => pass.end())
      .pipe(pass)
    return pass
  }

  stream({ request, response }: HttpContext) {
    const filePath = `./downloads/test.mkv`

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

    const pass = this.getConvertedStream(file, 'mp4')
    response.stream(pass)
    //
    // const passThrough = new PassThrough()
    //
    // file.pipe(passThrough) // Pipe ReadStream into PassThrough
    // Ffmpeg(passThrough)
    //   .on('start', () =>
    //     console.log(3, 'hypertube-server', 'movies.controller.js', 'conversion started...')
    //   )
    //   .on('error', (error) =>
    //     console.log(5, 'hypertube-server', 'movies.controller.js', error.message)
    //   )
    //   .format('webm')
    //   .audioBitrate(128)
    //   .audioCodec('libvorbis')
    //   .videoBitrate(1024)
    //   .videoCodec('libvpx')
    //   .stream(response.response)
  }

  respond() {
    const filePath =
      'magnet:?xt=urn:btih:dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c&dn=Big+Buck+Bunny&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fbig-buck-bunny.torrent'

    // if (!fs.existsSync(filePath)) {
    //   console.error(`File not found: ${filePath}`)
    //   return 'File not found'
    // }

    const engine = torrentStream(filePath, { path: './downloads' })

    engine.on('ready', () => {
      engine.files.forEach((file) => {
        console.log('filename:', file.name)

        // Example: Stream the first file
        if (file.name.endsWith('.mp4')) {
          const stream = file.createReadStream()
          stream.pipe(fs.createWriteStream(`./downloads/${file.name}`))
          console.log(`Streaming file: ${file.name}`)
        }
      })
    })

    return 'Streaming started'
  }
}
