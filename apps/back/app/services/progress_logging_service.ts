export default class ProgressLoggingService {
  private downloadProgressTracking: Map<string, Set<number>> = new Map()
  private conversionProgressTracking: Map<string, Set<number>> = new Map()

  trackDownloadProgress(tmdbId: number, engine: any) {
    const downloaded = engine.swarm.downloaded
    const total = engine.torrent.length
    const percent = Math.floor((downloaded / total) * 100)

    const progressKey = tmdbId.toString()
    if (!this.downloadProgressTracking.has(progressKey)) {
      this.downloadProgressTracking.set(progressKey, new Set())
    }

    const loggedProgress = this.downloadProgressTracking.get(progressKey)!

    if (percent >= 25 && !loggedProgress.has(25)) {
      loggedProgress.add(25)
      this.logDownloadProgress(tmdbId, 25)
    }
    if (percent >= 50 && !loggedProgress.has(50)) {
      loggedProgress.add(50)
      this.logDownloadProgress(tmdbId, 50)
    }
    if (percent >= 75 && !loggedProgress.has(75)) {
      loggedProgress.add(75)
      this.logDownloadProgress(tmdbId, 75)
    }
  }

  logDownloadCompletion(tmdbId: number) {
    console.log(`Torrent download completed for movie ${tmdbId}: 100%`)
  }

  trackConversionProgress(videoId: string, resolution: number, progress: any, duration?: number) {
    let percent = 0
    
    // Calculate percentage from timemark and duration if available
    if (duration && progress.timemark) {
      const currentTimeSeconds = this.parseTimemarkToSeconds(progress.timemark)
      percent = Math.floor((currentTimeSeconds / duration) * 100)
    } else if (progress.percent !== undefined) {
      // Fallback: Handle both string percentage like "25.5%" and numeric values
      if (typeof progress.percent === 'string') {
        // Remove % sign if present and parse
        percent = Math.floor(Number.parseFloat(progress.percent.replace('%', '')))
      } else {
        // Handle numeric values (could be 0-1 or 0-100 range)
        const numericPercent = Number.parseFloat(progress.percent.toString())
        percent = numericPercent <= 1 ? Math.floor(numericPercent * 100) : Math.floor(numericPercent)
      }
    }

    const progressKey = `${videoId}-${resolution}`
    if (!this.conversionProgressTracking.has(progressKey)) {
      this.conversionProgressTracking.set(progressKey, new Set())
    }

    const loggedProgress = this.conversionProgressTracking.get(progressKey)!

    if (percent >= 25 && !loggedProgress.has(25)) {
      loggedProgress.add(25)
      this.logConversionProgress(videoId, resolution, 25)
    }
    if (percent >= 50 && !loggedProgress.has(50)) {
      loggedProgress.add(50)
      this.logConversionProgress(videoId, resolution, 50)
    }
    if (percent >= 75 && !loggedProgress.has(75)) {
      loggedProgress.add(75)
      this.logConversionProgress(videoId, resolution, 75)
    }
  }

  logConversionCompletion(videoId: string, resolution: number) {
    this.logConversionProgress(videoId, resolution, 100)
  }

  cleanupMovieTracking(tmdbId: number) {
    const downloadKey = tmdbId.toString()
    this.downloadProgressTracking.delete(downloadKey)

    const resolutions = [480, 720, 1080]
    resolutions.forEach((resolution) => {
      const conversionKey = `${tmdbId}-${resolution}`
      this.conversionProgressTracking.delete(conversionKey)
    })

    console.log(`Cleaned up progress tracking for movie ${tmdbId}`)
  }

  private parseTimemarkToSeconds(timemark: string): number {
    // Parse timemark format: "HH:MM:SS.SS" to seconds
    try {
      const parts = timemark.split(':')
      if (parts.length !== 3) {
        console.error('Invalid timemark format:', timemark)
        return 0
      }

      const hours = Number.parseInt(parts[0], 10)
      const minutes = Number.parseInt(parts[1], 10)
      const seconds = Number.parseFloat(parts[2])

      return hours * 3600 + minutes * 60 + seconds
    } catch (error) {
      console.error('Error parsing timemark:', timemark, error)
      return 0
    }
  }

  private logDownloadProgress(tmdbId: number, percent: number) {
    console.log(`Torrent download progress for movie ${tmdbId}: ${percent}%`)
  }

  private logConversionProgress(videoId: string, resolution: number, percent: number) {
    console.log(`FFmpeg conversion progress for movie ${videoId} at ${resolution}p: ${percent}%`)
  }
}
