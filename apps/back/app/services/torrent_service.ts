import torrentStream from 'torrent-stream'
import fs from 'node:fs'
import ffmpeg from 'fluent-ffmpeg'
import path from 'node:path'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import SearchTorrentService from './search_torrent_service.js'
import MovieService from './movie_service.js'
import ProgressLoggingService from './progress_logging_service.js'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

export default class TorrentService {
  private searchTorrentService: SearchTorrentService = new SearchTorrentService()
  private movieService: MovieService = new MovieService()
  private progressLoggingService: ProgressLoggingService = new ProgressLoggingService()
  private readyResolutions: Set<string> = new Set()
  private lastSegmentCounts: Map<string, number> = new Map()
  private completedConversions: Map<string, Set<number>> = new Map()
  private videoDurations: Map<string, number> = new Map()

  async download(tmdbId: number) {
    console.log('Starting torrent download for TMDB ID:', tmdbId)

    await this.movieService.getOrCreate(tmdbId)
    const torrent = await this.searchTorrentService.search(tmdbId, 'All', 100)
    await this.movieService.updateMagnetLink(tmdbId, torrent.magnetLink)

    await this.movieService.updateDownloadStatus(tmdbId, 'downloading')

    const cacheDir = `./torrent-cache/${tmdbId}`
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true })
    }

    const engine = torrentStream(torrent.magnetLink, {
      tmp: cacheDir,
      verify: true,
      uploads: 0,
    })

    if (fs.existsSync(cacheDir) && fs.readdirSync(cacheDir).length > 0) {
      console.log(`Resuming torrent download for TMDB ID: ${tmdbId}`)
    }

    engine.on('ready', () => {
      const videoFile = engine.files
        .filter((file: any) => this.isVideoFile(file.name))
        .sort((a: any, b: any) => b.length - a.length)[0]

      if (!videoFile) {
        throw new Error('No video file found in torrent')
      }

      console.log('Starting conversion for:', videoFile.name)
      videoFile.select()
      this.progressiveConvert(videoFile, tmdbId.toString())
    })

    engine.on('download', () => {
      this.progressLoggingService.trackDownloadProgress(tmdbId, engine)
    })

    engine.on('done', () => {
      console.log('Torrent download completed for TMDB ID:', tmdbId)
      this.progressLoggingService.logDownloadCompletion(tmdbId)
      // Set download status to completed
      this.movieService.updateDownloadStatus(tmdbId, 'completed')
    })

    engine.on('error', (err: Error) => {
      console.error('Torrent download error for TMDB ID:', tmdbId, err)
      // Set download status to failed
      this.movieService.updateDownloadStatus(tmdbId, 'failed')
    })

    return { message: 'Sequential torrent download started', tmdbId }
  }

  private isVideoFile(filename: string): boolean {
    const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v']
    return videoExtensions.some((ext) => filename.toLowerCase().endsWith(ext))
  }

  private async probeVideoDuration(file: any): Promise<number> {
    return new Promise((resolve, reject) => {
      const stream = file.createReadStream()

      ffmpeg(stream).ffprobe((err, metadata) => {
        if (err) {
          console.error('Error probing video duration:', err)
          reject(err)
          return
        }

        const duration = metadata.format?.duration
        if (duration) {
          console.log(`Video duration detected: ${duration} seconds`)
          resolve(duration)
        } else {
          console.error('Could not determine video duration from metadata')
          reject(new Error('Could not determine video duration'))
        }
      })
    })
  }

  private async progressiveConvert(file: any, videoId: string) {
    const resolutions = [480, 720, 1080]
    const tmdbId = Number.parseInt(videoId)

    try {
      await this.movieService.updateConversionStatus(tmdbId, 'converting')

      const duration = await this.probeVideoDuration(file)
      this.videoDurations.set(videoId, duration)
      console.log(`Video duration stored for ${videoId}: ${duration} seconds`)

      await this.movieService.updateDuration(tmdbId, duration)
    } catch (error) {
      console.error('Failed to probe video duration:', error)
      await this.movieService.updateConversionStatus(tmdbId, 'failed')
      return
    }

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

    const stream = file.createReadStream()

    console.log(`Starting HLS conversion for ${width}p`)

    ffmpeg(stream)
      .outputOptions([
        '-c:v libx264',
        '-c:a aac',
        '-preset veryfast',
        '-movflags +faststart',
        '-crf 27',
        '-tag:v avc1',
        '-f hls',
        '-hls_time 6',
        '-hls_list_size 0',
        '-hls_playlist_type event',
        '-start_number 0',
        '-hls_segment_filename',
        path.join(outputFolderRootPath, 'segment_%03d.ts'),
        '-hls_flags +append_list',
        '-hls_allow_cache 0',
        '-ac 6',
        '-ar 48000',
        '-b:a 384k',
        '-bufsize 1M',
        '-maxrate 2M',
      ])
      .output(outputFilePath)
      .videoFilter(`scale=${width}:-2`)
      .on('progress', (progress) => {
        this.updateProgressivePlaylist(outputFilePath, width, videoId)
        const duration = this.videoDurations.get(videoId)
        this.progressLoggingService.trackConversionProgress(videoId, width, progress, duration)
      })
      .on('end', () => {
        console.log(`HLS conversion completed for ${width}p`)
        this.progressLoggingService.logConversionCompletion(videoId, width)
        this.markConversionComplete(videoId, width)
      })
      .on('error', async (err) => {
        console.error(`Error in conversion for ${width}p:`, err.message)
        const tmdbId = Number.parseInt(videoId)
        await this.movieService.updateConversionStatus(tmdbId, 'failed')
        throw new Error(`FFmpeg conversion failed for ${width}p: ${err.message}`)
      })
      .run()
  }

  private async updateProgressivePlaylist(
    playlistPath: string,
    resolution: number,
    videoId: string
  ) {
    try {
      if (fs.existsSync(playlistPath)) {
        const playlist = fs.readFileSync(playlistPath, 'utf8')
        const segmentCount = (playlist.match(/segment_\d+\.ts/g) || []).length

        const trackingKey = `${videoId}-${resolution}`
        const lastCount = this.lastSegmentCounts.get(trackingKey) || 0

        if (segmentCount > lastCount) {
          this.lastSegmentCounts.set(trackingKey, segmentCount)

          if (segmentCount >= 3) {
            await this.markProgressiveReady(Number.parseInt(videoId), resolution)
          }
        }
      }
    } catch (error) {
      console.error('Error updating progressive playlist:', error)
      throw new Error(`Failed to update progressive playlist: ${error}`)
    }
  }

  private async markProgressiveReady(tmdbId: number, resolution: number) {
    const key = `${tmdbId}-${resolution}`
    if (this.readyResolutions.has(key)) {
      return
    }

    try {
      await this.movieService.updateResolutionStatus(tmdbId, resolution, true)
      this.readyResolutions.add(key)
      console.log(`${resolution}p ready for streaming`)
    } catch (error) {
      console.error('Error marking progressive ready in database:', error)
    }
  }

  private async markConversionComplete(videoId: string, resolution: number) {
    const tmdbId = Number.parseInt(videoId)

    if (!this.completedConversions.has(videoId)) {
      this.completedConversions.set(videoId, new Set())
    }

    const completedSet = this.completedConversions.get(videoId)!
    completedSet.add(resolution)

    const allResolutions = [480, 720, 1080]
    const allCompleted = allResolutions.every((res) => completedSet.has(res))

    if (allCompleted) {
      console.log(`All conversions completed for movie ${tmdbId}`)
      await this.movieService.updateConversionStatus(tmdbId, 'completed')
      await this.cleanupMovieCache(tmdbId)
      this.completedConversions.delete(videoId)
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
            '1080p': resolutionStatus.resolution1080pReady,
          },
        }
      } else {
        return {
          status: 206,
          message: 'Video conversion in progress',
          allReady: false,
          resolutions: {
            '480p': resolutionStatus.resolution480pReady,
            '720p': resolutionStatus.resolution720pReady,
            '1080p': resolutionStatus.resolution1080pReady,
          },
        }
      }
    } catch (error) {
      return {
        status: 500,
        message: 'Error checking video readiness',
        allReady: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async isMovieProcessing(tmdbId: number): Promise<boolean> {
    try {
      const movie = await this.movieService.getByTmdbId(tmdbId)
      if (!movie) {
        return false
      }

      return movie.conversionStatus === 'converting' || movie.conversionStatus === 'completed'
    } catch (error) {
      console.error('Error checking movie conversion status:', error)
      return false
    }
  }

  async cleanupMovieCache(tmdbId: number): Promise<void> {
    const cacheDir = `./torrent-cache/${tmdbId}`

    if (fs.existsSync(cacheDir)) {
      try {
        fs.rmSync(cacheDir, { recursive: true, force: true })
        console.log(`Cleaned up torrent cache for movie ${tmdbId}`)
        this.progressLoggingService.cleanupMovieTracking(tmdbId)
      } catch (error) {
        console.error(`Error cleaning up torrent cache for movie ${tmdbId}:`, error)
      }
    }
  }
}
