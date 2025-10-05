import torrentStream from 'torrent-stream'
import fs from 'node:fs'
import ffmpeg from 'fluent-ffmpeg'
import path from 'node:path'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import { inject } from '@adonisjs/core'
import SearchTorrentService from './search_torrent_service.js'
import MovieService from './movie_service.js'
import ProgressLoggingService from './progress_logging_service.js'
import SubtitleService from './subtitle_service.js'
import { SUPPORTED_LANGUAGES } from '../validators/subtitle.js'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

@inject()
export default class TorrentService {
  constructor(
    private searchTorrentService: SearchTorrentService,
    private movieService: MovieService,
    private progressLoggingService: ProgressLoggingService,
    private subtitleService: SubtitleService
  ) {}
  private readyResolutions: Set<string> = new Set()
  private lastSegmentCounts: Map<string, number> = new Map()
  private getQualitySettings(width: number) {
    switch (width) {
      case 480:
        return {
          crf: 20,
          videoBitrate: '1500k',
          maxBitrate: '2000k',
          bufsize: '3000k',
          audioBitrate: '192k',
          audioChannels: 2,
        }
      case 720:
        return {
          crf: 19,
          videoBitrate: '3000k',
          maxBitrate: '4000k',
          bufsize: '6000k',
          audioBitrate: '256k',
          audioChannels: 6,
        }
      case 1080:
        return {
          crf: 18,
          videoBitrate: '5000k',
          maxBitrate: '7000k',
          bufsize: '10000k',
          audioBitrate: '320k',
          audioChannels: 6,
        }
      default:
        return {
          crf: 20,
          videoBitrate: '2000k',
          maxBitrate: '3000k',
          bufsize: '4000k',
          audioBitrate: '192k',
          audioChannels: 2,
        }
    }
  }
  private completedConversions: Map<string, Set<number>> = new Map()
  private videoDurations: Map<string, number> = new Map()

  async download(tmdbId: number) {
    console.log('Starting torrent download for TMDB ID:', tmdbId)
    await this.movieService.getOrCreate(tmdbId)

    await this.movieService.updateLastAccessed(tmdbId)

    // Check if movie is already fully converted
    const movie = await this.movieService.getByTmdbId(tmdbId)
    if (movie && movie.conversionStatus === 'completed') {
      console.log(`Movie ${tmdbId} is already fully converted, skipping download and conversion`)
      return { message: 'Movie is already fully converted and ready', tmdbId }
    }

    // If conversion was not completed, clean up any partial HLS files to start fresh
    if (movie && movie.conversionStatus !== 'completed') {
      if (!(await this.cleanupHLSFiles(tmdbId))) {
        return { message: 'Couldnt clean.', tmdbId }
      }
    }

    await this.downloadSubtitlesForMovie(tmdbId)

    const torrent = await this.searchTorrentService.search(tmdbId, 'All', 100)

    if (!torrent) {
      // Mark as failed so we have it tracked in the database
      await this.movieService.updateDownloadStatus(tmdbId, 'failed')
      await this.movieService.updateConversionStatus(tmdbId, 'failed')
      return { message: 'No torrent file found', tmdbId }
    }

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
        return { message: 'No video file found in torrent', tmdbId }
      }

      console.log('Starting conversion for:', videoFile.name)
      videoFile.select()
      this.progressiveConvert(videoFile, tmdbId.toString())
    })

    engine.on('download', () => {
      this.progressLoggingService.trackDownloadProgress(tmdbId, engine)
    })

    engine.on('idle', () => {
      console.log(`Torrent download completed for movie ${tmdbId}: 100%`)
      this.movieService.updateDownloadStatus(tmdbId, 'completed')
    })

    engine.on('error', (_err: Error) => {
      this.movieService.updateDownloadStatus(tmdbId, 'failed')
    })

    return { message: 'Sequential torrent download started', tmdbId }
  }

  /**
   * Download subtitles for all supported languages before starting movie download
   */
  private async downloadSubtitlesForMovie(tmdbId: number): Promise<void> {
    try {
      console.log(`Downloading subtitles for movie ${tmdbId} before starting torrent download`)

      const result = await this.subtitleService.downloadMultipleSubtitles(
        tmdbId,
        SUPPORTED_LANGUAGES
      )

      const successCount = result.results.filter((r) => r.success).length
      const totalCount = result.results.length

      console.log(
        `Subtitle download completed for movie ${tmdbId}: ${successCount}/${totalCount} languages downloaded`
      )

      if (successCount > 0) {
        console.log(
          `Successfully downloaded subtitles for: ${result.results
            .filter((r) => r.success)
            .map((r) => r.language)
            .join(', ')}`
        )
      }

      if (successCount < totalCount) {
        const failedLanguages = result.results.filter((r) => !r.success).map((r) => r.language)
        console.log(`Failed to download subtitles for: ${failedLanguages.join(', ')}`)
      }
    } catch {
      console.log(`Continuing with movie download despite subtitle download issues`)
    }
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
          reject(err)
          return
        }

        const duration = metadata.format?.duration
        if (duration) {
          resolve(duration)
        } else {
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

      await this.movieService.updateDuration(tmdbId, duration)
    } catch {
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

    const qualitySettings = this.getQualitySettings(width)

    ffmpeg(stream)
      .outputOptions([
        '-c:v libx264',
        '-c:a aac',
        '-preset medium',
        '-movflags +faststart',
        `-crf ${qualitySettings.crf}`,
        `-b:v ${qualitySettings.videoBitrate}`,
        `-maxrate ${qualitySettings.maxBitrate}`,
        `-bufsize ${qualitySettings.bufsize}`,
        '-profile:v high',
        '-level 4.1',
        '-pix_fmt yuv420p',
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
        `-ac ${qualitySettings.audioChannels}`,
        '-ar 48000',
        `-b:a ${qualitySettings.audioBitrate}`,
      ])
      .output(outputFilePath)
      .videoFilter(`scale=${width}:-2`)
      .on('progress', (progress) => {
        this.updateProgressivePlaylist(outputFilePath, width, videoId)
        const duration = this.videoDurations.get(videoId)
        this.progressLoggingService.trackConversionProgress(videoId, width, progress, duration)
      })
      .on('end', () => {
        this.progressLoggingService.logConversionCompletion(videoId, width)
        this.markConversionComplete(videoId, width)
      })
      .on('error', async (_err) => {
        const tmdbId = Number.parseInt(videoId)
        await this.movieService.updateConversionStatus(tmdbId, 'failed')
        return
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
    } catch {}
  }

  private async markProgressiveReady(tmdbId: number, resolution: number) {
    const key = `${tmdbId}-${resolution}`
    if (this.readyResolutions.has(key)) {
      return
    }

    try {
      if (!(await this.movieService.updateResolutionStatus(tmdbId, resolution, true))) {
        return
      }
      this.readyResolutions.add(key)

      const allResolutions = [480, 720, 1080]
      const allReady = allResolutions.every((res) => this.readyResolutions.has(`${tmdbId}-${res}`))

      if (allReady) {
        console.log(`All resolutions ready for streaming: 480p, 720p, 1080p`)
      }
    } catch {}
  }

  private async markConversionComplete(videoId: string, resolution: number) {
    try {
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
    } catch {}
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
    } catch {
      return false
    }
  }

  async cleanupMovieCache(tmdbId: number): Promise<void> {
    const cacheDir = `./torrent-cache/${tmdbId}`

    if (fs.existsSync(cacheDir)) {
      try {
        fs.rmSync(cacheDir, { recursive: true })
        console.log(`Cleaned up torrent cache for movie ${tmdbId}`)
        this.progressLoggingService.cleanupMovieTracking(tmdbId)
      } catch (error) {
        throw new Error(`Failed to cleanup cache directory ${cacheDir}: ${error}`)
      }
    }
  }

  /**
   * Clean up HLS files for a movie to start conversion fresh
   */
  private async cleanupHLSFiles(tmdbId: number): Promise<boolean> {
    const hlsDir = `./hls-output/${tmdbId}`

    if (fs.existsSync(hlsDir)) {
      try {
        console.log(`Cleaning up existing HLS files for movie ${tmdbId} to start fresh conversion`)
        fs.rmSync(hlsDir, { recursive: true })
        console.log(`Successfully cleaned up HLS files for movie ${tmdbId}`)

        // Reset resolution status in database
        if (
          !(await this.movieService.updateResolutionStatus(tmdbId, 480, false)) ||
          !(await this.movieService.updateResolutionStatus(tmdbId, 720, false)) ||
          !(await this.movieService.updateResolutionStatus(tmdbId, 1080, false))
        ) {
          return false
        }
        // Clear from ready resolutions set
        this.readyResolutions.delete(`${tmdbId}-480`)
        this.readyResolutions.delete(`${tmdbId}-720`)
        this.readyResolutions.delete(`${tmdbId}-1080`)

        // Clear segment counts
        this.lastSegmentCounts.delete(`${tmdbId}-480`)
        this.lastSegmentCounts.delete(`${tmdbId}-720`)
        this.lastSegmentCounts.delete(`${tmdbId}-1080`)
      } catch {
        return false
      }
    }
    return true
  }
}
