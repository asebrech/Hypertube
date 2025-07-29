import torrentStream from 'torrent-stream'
import fs from 'node:fs'
import ffmpeg from 'fluent-ffmpeg'
import path from 'node:path'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import SearchTorrentService from './search_torrent_service.js'
import MovieService from './movie_service.js'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

export default class TorrentService {
  private searchTorrentService: SearchTorrentService = new SearchTorrentService()
  private movieService: MovieService = new MovieService()

  async download(tmdbId: number) {
    console.log('Searching for torrents for TMDB ID:', tmdbId)

    const movie = await this.movieService.getOrCreate(tmdbId)
    console.log('Movie instance:', { id: movie.id, tmdbId: movie.tmdbId, title: movie.title })

    const torrent = await this.searchTorrentService.search(tmdbId, 'All', 100)

    await this.movieService.updateMagnetLink(tmdbId, torrent.magnetLink)

    const filePath = torrent.magnetLink
    const engine = torrentStream(filePath)

    engine.on('ready', () => {
      console.log('Torrent engine ready, files:', engine.files.length)

      const videoFile = engine.files
        .filter((file: any) => this.isVideoFile(file.name))
        .sort((a: any, b: any) => b.length - a.length)[0]

      if (!videoFile) {
        throw new Error('No video file found in torrent')
      }

      console.log('Selected video file:', videoFile.name, 'Size:', videoFile.length)

      videoFile.select()

      this.progressiveConvert(videoFile, tmdbId.toString())
    })

    engine.on('download', (pieceIndex: number) => {
      const downloaded = engine.swarm.downloaded
      const total = (engine as any).torrent?.length || 1
      const progress = ((downloaded / total) * 100).toFixed(2)
      console.log(`Download progress: ${progress}% (Piece ${pieceIndex})`)
    })

    engine.on('done', () => {
      console.log('Torrent download completed - all pieces downloaded')
      console.log('Final download size:', engine.swarm.downloaded, 'bytes')
    })

    return { message: 'Sequential torrent download started', tmdbId }
  }

  private isVideoFile(filename: string): boolean {
    const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v']
    return videoExtensions.some((ext) => filename.toLowerCase().endsWith(ext))
  }

  private progressiveConvert(file: any, videoId: string) {
    const resolutions = [480, 720, 1080]

    resolutions.forEach((width) => {
      this.startProgressiveHLSConversion(file, videoId, width)
    })
  }

  private startProgressiveHLSConversion(file: any, videoId: string, width: number) {
    const outputFolderRootPath = `./hls-output/${videoId}/${width}p`
    if (!fs.existsSync(outputFolderRootPath)) {
      fs.mkdirSync(outputFolderRootPath, { recursive: true })
    }

    const outputFilePath = path.join(outputFolderRootPath, `output.m3u8`)

    // Create a readable stream that can handle partial file data
    const stream = file.createReadStream()

    console.log(`Starting progressive HLS conversion for ${width}p`)

    ffmpeg(stream)
      .outputOptions([
        '-c:v libx264',
        '-c:a aac',
        '-preset veryfast',
        '-movflags +faststart',
        '-crf 27',
        '-tag:v avc1',
        '-f hls',
        '-hls_time 6', // Shorter segments for faster initial playback
        '-hls_list_size 0',
        '-hls_playlist_type event',
        '-hls_flags append_list',
        '-start_number 0',
        '-hls_segment_filename',
        path.join(outputFolderRootPath, 'segment_%03d.ts'),
        // Enable low latency streaming
        '-hls_flags +append_list+omit_endlist',
        '-hls_allow_cache 0',
        '-ac 6',
        '-ar 48000',
        '-b:a 384k',
        // Buffer settings for progressive streaming
        '-bufsize 1M',
        '-maxrate 2M',
      ])
      .output(outputFilePath)
      .videoFilter(`scale=${width}:-2`)
      .on('start', (commandLine) => {
        console.log(`FFmpeg command for ${width}p: ${commandLine}`)
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`HLS ${width}p conversion progress: ${progress.percent.toFixed(2)}%`)
        }
        // Update playlist to mark segments as available for streaming
        this.updateProgressivePlaylist(outputFilePath, width, videoId)
      })
      .on('end', () => {
        console.log(`Progressive HLS conversion completed for ${width}p`)
        // Finalize the playlist
        this.finalizePlaylist(outputFilePath)
      })
      .on('error', (err) => {
        console.error(`Error in progressive conversion for ${width}p:`, err.message)
        throw new Error(`FFmpeg conversion failed for ${width}p: ${err.message}`)
      })
      .run()
  }

  private async updateProgressivePlaylist(playlistPath: string, resolution: number, videoId: string) {
    // This method can be enhanced to update the playlist dynamically
    // as new segments become available for immediate streaming
    try {
      if (fs.existsSync(playlistPath)) {
        const playlist = fs.readFileSync(playlistPath, 'utf8')
        // Check if playlist has enough segments for initial playback (e.g., 3 segments)
        const segmentCount = (playlist.match(/segment_\d+\.ts/g) || []).length

        if (segmentCount >= 3) {
          // Mark this resolution as ready for progressive streaming
          await this.markProgressiveReady(parseInt(videoId), resolution)
        }
      }
    } catch (error) {
      console.error('Error updating progressive playlist:', error)
      throw new Error(`Failed to update progressive playlist: ${error}`)
    }
  }

  private async markProgressiveReady(tmdbId: number, resolution: number) {
    // Update database to indicate progressive streaming is available
    try {
      await this.movieService.updateResolutionStatus(tmdbId, resolution, true)
      console.log(`Progressive streaming available for ${resolution}p`)
    } catch (error) {
      console.error('Error marking progressive ready in database:', error)
    }
  }

  private finalizePlaylist(playlistPath: string) {
    try {
      if (fs.existsSync(playlistPath)) {
        let playlist = fs.readFileSync(playlistPath, 'utf8')
        // Add end tag if not present
        if (!playlist.includes('#EXT-X-ENDLIST')) {
          playlist += '#EXT-X-ENDLIST\n'
          fs.writeFileSync(playlistPath, playlist)
        }
      }
    } catch (error) {
      console.error('Error finalizing playlist:', error)
      throw new Error(`Failed to finalize playlist: ${error}`)
    }
  }

  async ready(tmdbId: number) {
    try {
      const resolutionStatus = await this.movieService.getResolutionStatus(tmdbId)
      
      if (resolutionStatus.allReady) {
        return {
          status: 200,
          message: 'All video resolutions are ready',
          allReady: true,
          resolutions: {
            '480p': resolutionStatus.resolution480pReady,
            '720p': resolutionStatus.resolution720pReady,
            '1080p': resolutionStatus.resolution1080pReady
          }
        }
      } else {
        return {
          status: 206,
          message: 'Video conversion in progress',
          allReady: false,
          resolutions: {
            '480p': resolutionStatus.resolution480pReady,
            '720p': resolutionStatus.resolution720pReady,
            '1080p': resolutionStatus.resolution1080pReady
          }
        }
      }
    } catch (error) {
      return {
        status: 500,
        message: 'Error checking video readiness',
        allReady: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  isMovieConverted(imdbId: string): boolean {
    const outputFolderRootPath = `./hls-output/${imdbId}`
    return fs.existsSync(outputFolderRootPath)
  }
}
