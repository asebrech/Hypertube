import TorrentService from '#services/torrent_service'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import fs from 'node:fs'
import { PassThrough } from 'node:stream'
import env from '#start/env'
import { exec } from 'node:child_process'
import path, { join } from 'node:path'
import app from '@adonisjs/core/services/app'
import { Transcoder } from 'simple-hls'
import ffmpeg from 'fluent-ffmpeg'
import pathToFfmpeg from 'ffmpeg-static' // Use import instead of require

// if (typeof pathToFfmpeg === 'string') {
//   console.log(pathToFfmpeg)
//   ffmpeg.setFfmpegPath(pathToFfmpeg)
// } else {
//   console.log(pathToFfmpeg)
//   throw new Error('Invalid path to ffmpeg binary')
// }

@inject()
export default class TorrentController {
  constructor(protected torrentService: TorrentService) {}

  torrent() {
    return this.torrentService.respond()
  }

  stream({ response, params }: any) {
    const filePath = join(app.makePath(), 'hls-output', params.videoId, ...params['*'])

    return response.download(filePath)
  }

  async convert_tmp({ request, response }: HttpContext) {
    const customRenditions = [
      {
        width: 640,
        height: 360,
        profile: 'main',
        hlsTime: '4', // Segment duration in seconds
        bv: '800k', // Video bitrate
        maxrate: '856k', // Maximum video bitrate
        bufsize: '1200k', // Buffer size
        ba: '128k', // Increase audio bitrate for better compatibility
        ts_title: '360p',
        master_title: '360p',
      },
    ]

    const t = new Transcoder(`./downloads/test/ladyGa.mkv`, `./hls-output/test`, {})
    try {
      const hlsPath = await t.transcode()
      console.log('Successfully Transcoded Video')
    } catch (e) {
      console.log('Something went wrong')
    }
  }

  convert() {
    const videoId = '117'
    const resolutions = [480, 720, 1080]
    const inputFilePath = './downloads/test/rick.mkv'
    const outputFolderRootPath = `./hls-output/${videoId}`

    if (!fs.existsSync(outputFolderRootPath)) {
      fs.mkdirSync(outputFolderRootPath, { recursive: true })
    }

    resolutions.forEach((width) => {
      const outputFilePath = path.join(outputFolderRootPath, `${width}.m3u8`)
      ffmpeg(inputFilePath)
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
        .videoFilter(`scale=${width}:-2`) // Scale width and maintain aspect ratio
        .on('progress', () => {
          console.log(`An HLS ${width}p segment has been generated successfully!`)

          const customContent = `#EXT-X-ENDLIST\n# Custom content for ${width}p resolution`
          fs.appendFileSync(outputFilePath, `\n${customContent}`)
          console.log(`Custom content appended to ${outputFilePath}`)
        })
        .on('end', () => {
          console.log(`All HLS segments for ${width}p have been generated successfully!`)
        })
        .on('error', (err) => {
          console.log(`Error: ${err.message}`)
        })
        .run()
    })
  }

  convert_hello({ request, response }: HttpContext) {
    // if (!req.file) {
    //   return res.status(400).send('Video not sent!')
    // }

    const port = env.get('PORT')

    const videoId = '117'
    const uploadedVideoPath = './downloads/test/rick.mkv'

    const outputFolderRootPath = `./hls-output/${videoId}`

    const outputFolderSubDirectoryPath = {
      '360p': `${outputFolderRootPath}/360p`,
      // '480p': `${outputFolderRootPath}/480p`,
      // '720p': `${outputFolderRootPath}/720p`,
      // '1080p': `${outputFolderRootPath}/1080p`,
    }

    // Create directories for storing output video
    if (!fs.existsSync(outputFolderRootPath)) {
      fs.mkdirSync(outputFolderSubDirectoryPath['360p'], { recursive: true })
      // fs.mkdirSync(outputFolderSubDirectoryPath['480p'], { recursive: true })
      // fs.mkdirSync(outputFolderSubDirectoryPath['720p'], { recursive: true })
      // fs.mkdirSync(outputFolderSubDirectoryPath['1080p'], { recursive: true })
    }

    // Commands to convert video to HLS format for 360p, 480p, 720p, 1080p resolutions
    const ffmpegCommands = [
      `ffmpeg -i ${uploadedVideoPath} -vf "scale=w=640:h=360" -c:v libx264 -b:v 800k -c:a aac -ac 6 -ar 48000 -b:a 384k -f hls -hls_list_size 0 -hls_flags append_list+temp_file -hls_time 15  -hls_segment_filename "${outputFolderSubDirectoryPath['360p']}/segment%03d.ts" -start_number 0 "${outputFolderSubDirectoryPath['360p']}/index.m3u8"`,
      // `ffmpeg -i ${uploadedVideoPath} -vf "scale=w=854:h=480" -c:v libx264 -b:v 1400k -c:a aac -b:a 128k -f hls -hls_time 15 -hls_playlist_type vod -hls_segment_filename "${outputFolderSubDirectoryPath['480p']}/segment%03d.ts" -start_number 0 "${outputFolderSubDirectoryPath['480p']}/index.m3u8"`,
      // `ffmpeg -i ${uploadedVideoPath} -vf "scale=w=1280:h=720" -c:v libx264 -b:v 2800k -c:a aac -b:a 128k -f hls -hls_time 15 -hls_playlist_type vod -hls_segment_filename "${outputFolderSubDirectoryPath['720p']}/segment%03d.ts" -start_number 0 "${outputFolderSubDirectoryPath['720p']}/index.m3u8"`,
      // `ffmpeg -i ${uploadedVideoPath} -vf "scale=w=1920:h=1080" -c:v libx264 -b:v 5000k -c:a aac -b:a 192k -f hls -hls_time 15 -hls_playlist_type vod -hls_segment_filename "${outputFolderSubDirectoryPath['1080p']}/segment%03d.ts" -start_number 0 "${outputFolderSubDirectoryPath['1080p']}/index.m3u8"`,
    ]

    // run the ffmpeg command in a queue
    const executeCommand = (command: string) => {
      return new Promise<void>((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`)
            reject(error)
          } else {
            resolve()
          }
        })
      })
    }

    Promise.all(ffmpegCommands.map((cmd) => executeCommand(cmd)))
      .then(() => {
        const videoUrls = {
          '360p': `http://localhost:${port}/hls-output/${videoId}/360p/index.m3u8`,
          // '480p': `http://localhost:${port}/hls-output/${videoId}/480p/index.m3u8`,
          // '720p': `http://localhost:${port}/hls-output/${videoId}/720p/index.m3u8`,
        }

        return response.status(200).json({ videoId, videoUrls })
      })
      .catch((error) => {
        console.error(`HLS conversion error: ${error}`)

        // Delete the uploaded video file
        try {
          fs.unlinkSync(uploadedVideoPath)
        } catch (err) {
          console.error(`Failed to delete original video file: ${err}`)
        }

        // Delete the generated HLS files and folders
        try {
          fs.unlinkSync(outputFolderRootPath)
        } catch (err) {
          console.error(`Failed to delete generated HLS files: ${err}`)
        }

        return response.status(500).send('HLS conversion failed!')
      })
  }
}
