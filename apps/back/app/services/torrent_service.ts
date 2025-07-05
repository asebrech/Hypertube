import torrentStream from 'torrent-stream'
import fs from 'node:fs'
import { PassThrough } from 'node:stream'
import ffmpeg from 'fluent-ffmpeg'
import { HttpContext } from '@adonisjs/core/http'
import path from 'node:path'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import SearchTorrentService from './search_torrent_service.js'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

export default class EchoService {
  private searchTorrentService: SearchTorrentService = new SearchTorrentService()

  async respond(tmdbId: number) {
    console.log('Searching for torrents for TMDB ID:', tmdbId)
    const torrent = await this.searchTorrentService.search(tmdbId, 'All', 100)
    
    // const filePath =
    //   'magnet:?xt=urn:btih:52DB7C1686A8D3C22F70F3187061FE1737AA0258&dn=Rick+and+Morty+S08E03+1080p+WEB+H264-SuccessfulCrab&tr=http%3A%2F%2Fp4p.arenabg.com%3A1337%2Fannounce&tr=udp%3A%2F%2F47.ip-51-68-199.eu%3A6969%2Fannounce&tr=udp%3A%2F%2F9.rarbg.me%3A2780%2Fannounce&tr=udp%3A%2F%2F9.rarbg.to%3A2710%2Fannounce&tr=udp%3A%2F%2F9.rarbg.to%3A2730%2Fannounce&tr=udp%3A%2F%2F9.rarbg.to%3A2920%2Fannounce&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce&tr=udp%3A%2F%2Fopentracker.i2p.rocks%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.cyberia.is%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.dler.org%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=udp%3A%2F%2Ftracker.pirateparty.gr%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.tiny-vps.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce'
    const filePath = torrent.magnetLink
    const engine = torrentStream(filePath)

    engine.on('ready', () => {
      engine.files.forEach((file) => {
        console.log('filename:', file.name)
        const stream = file.createReadStream()
        this.convert(stream, tmdbId.toString())
      })
    })

    return 'Streaming started'
  }

  convert(stream: any, videoId: string) {
    const resolutions = [480, 720, 1080]

    resolutions.forEach((width) => {
      const outputFolderRootPath = `./hls-output/${videoId}/${width}p`
      if (!fs.existsSync(outputFolderRootPath)) {
        fs.mkdirSync(outputFolderRootPath, { recursive: true })
      }
      const outputFilePath = path.join(outputFolderRootPath, `output.m3u8`)

      ffmpeg(stream)
        .outputOptions([
          '-c:v libx264', // Video codec
          '-c:a aac',
          '-preset veryfast', // Fast encoding with reasonable quality and file size
          '-movflags +faststart', // Optimize for web streaming
          '-crf 27', // Constant Rate Factor for quality
          '-tag:v avc1', // Tag for QuickTime compatibility
          '-f hls', // Output format
          '-hls_time 10', // Segment duration
          '-hls_list_size 0', // Include all segments in playlist
          '-hls_playlist_type event',
          '-hls_flags append_list',
          '-start_number 0',
          '-ac 6',
          '-ar 48000',
          '-b:a 384k',
        ])
        .output(outputFilePath)
        .videoFilter(`scale = ${width}: -2`) // Scale width and maintain aspect ratio
        // .on('progress', () => {
        //   console.log(`An HLS ${width}p segment has been generated successfully!`)
        // })
        .on('end', () => {
          console.log(`All HLS segments for ${width}p have been generated successfully!`)
        })
        .on('error', (err) => {
          console.log(`Error: ${err.message} `)
        })
        .run()
    })
  }

  isMovieConverted(imdbId: string): boolean {
    const outputFolderRootPath = `./hls-output/${imdbId}`
    return fs.existsSync(outputFolderRootPath)
  }
}
