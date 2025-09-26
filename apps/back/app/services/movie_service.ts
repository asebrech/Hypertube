import Movie from '#models/movies'
import { TMDBService } from './tmdb_service.js'
import { DateTime } from 'luxon'

export default class MovieService {
  private tmdbService: TMDBService = new TMDBService()
  async getOrCreate(tmdbId: number, data?: Partial<Movie>): Promise<Movie> {
    let movie = await Movie.query().where('tmdbId', tmdbId).first()

    if (movie) {
      if (!movie.title && (!data || !data.title)) {
        await this.fetchAndUpdateMovieDetails(movie)
      }

      return movie
    }

    movie = new Movie()
    movie.tmdbId = tmdbId

    if (data) {
      if (data.imdbId) movie.imdbId = data.imdbId
      if (data.title) movie.title = data.title
      if (data.magicLink) movie.magicLink = data.magicLink
    }

    if (!movie.title) {
      await this.fetchAndUpdateMovieDetails(movie)
    }

    await movie.save()

    return movie
  }

  async updateMagnetLink(tmdbId: number, magnetLink: string): Promise<Movie> {
    const movie = await this.getOrCreate(tmdbId)
    movie.magicLink = magnetLink
    await movie.save()

    return movie
  }

  async getByTmdbId(tmdbId: number): Promise<Movie | null> {
    return await Movie.query().where('tmdbId', tmdbId).first()
  }

  async exists(tmdbId: number): Promise<boolean> {
    const movie = await Movie.query().where('tmdbId', tmdbId).first()
    return !!movie
  }

  async updateResolutionStatus(tmdbId: number, resolution: number, ready: boolean): Promise<void> {
    const movie = await this.getOrCreate(tmdbId)

    let currentStatus: boolean
    switch (resolution) {
      case 480:
        currentStatus = movie.resolution480pReady
        if (currentStatus === ready) return
        movie.resolution480pReady = ready
        break
      case 720:
        currentStatus = movie.resolution720pReady
        if (currentStatus === ready) return
        movie.resolution720pReady = ready
        break
      case 1080:
        currentStatus = movie.resolution1080pReady
        if (currentStatus === ready) return
        movie.resolution1080pReady = ready
        break
      default:
        throw new Error(`Unsupported resolution: ${resolution}`)
    }

    await movie.save()
  }

  async updateDownloadStatus(
    tmdbId: number,
    status: 'pending' | 'downloading' | 'completed' | 'failed'
  ): Promise<void> {
    const movie = await this.getOrCreate(tmdbId)
    movie.downloadStatus = status
    await movie.save()
  }

  async updateConversionStatus(
    tmdbId: number,
    status: 'pending' | 'converting' | 'completed' | 'failed'
  ): Promise<void> {
    const movie = await this.getOrCreate(tmdbId)
    movie.conversionStatus = status
    await movie.save()
  }

  async updateDuration(tmdbId: number, duration: number): Promise<void> {
    const movie = await this.getOrCreate(tmdbId)
    movie.duration = Math.round(duration)
    await movie.save()
  }

  async getResolutionStatus(tmdbId: number): Promise<{
    resolution480pReady: boolean
    resolution720pReady: boolean
    resolution1080pReady: boolean
    allReady: boolean
  }> {
    const movie = await this.getOrCreate(tmdbId)

    return {
      resolution480pReady: movie.resolution480pReady,
      resolution720pReady: movie.resolution720pReady,
      resolution1080pReady: movie.resolution1080pReady,
      allReady:
        movie.resolution480pReady && movie.resolution720pReady && movie.resolution1080pReady,
    }
  }

  async updateLastAccessed(tmdbId: number): Promise<void> {
    try {
      const movie = await this.getOrCreate(tmdbId)
      movie.lastAccessedAt = DateTime.now()
      await movie.save()
    } catch (error) {
      console.error(`Error updating last accessed time for movie ${tmdbId}:`, error)
    }
  }

  async getDownloadedMovies(): Promise<
    Array<{
      id: number
      tmdbId: number
      title: string | null
      downloadStatus: string
      conversionStatus: string
      resolution480pReady: boolean
      resolution720pReady: boolean
      resolution1080pReady: boolean
      lastAccessedAt: DateTime | null
      createdAt: DateTime
      updatedAt: DateTime
      sizeInBytes?: number
    }>
  > {
    const movies = await Movie.query().whereNotNull('download_status').orderBy('created_at', 'desc')

    const fs = await import('node:fs')
    const path = await import('node:path')

    const moviesWithSize = await Promise.all(
      movies.map(async (movie) => {
        let sizeInBytes = 0

        // Calculate total size of movie files
        const hlsPath = path.join(process.cwd(), 'hls-output', movie.tmdbId.toString())
        const cachePath = path.join(process.cwd(), 'torrent-cache', movie.tmdbId.toString())

        try {
          if (fs.existsSync(hlsPath)) {
            sizeInBytes += await this.calculateDirectorySize(hlsPath)
          }
          if (fs.existsSync(cachePath)) {
            sizeInBytes += await this.calculateDirectorySize(cachePath)
          }
        } catch (error) {
          console.warn(`Could not calculate size for movie ${movie.tmdbId}:`, error)
        }

        return {
          id: movie.id,
          tmdbId: movie.tmdbId,
          title: movie.title,
          downloadStatus: movie.downloadStatus,
          conversionStatus: movie.conversionStatus,
          resolution480pReady: movie.resolution480pReady,
          resolution720pReady: movie.resolution720pReady,
          resolution1080pReady: movie.resolution1080pReady,
          lastAccessedAt: movie.lastAccessedAt,
          createdAt: movie.createdAt,
          updatedAt: movie.updatedAt,
          sizeInBytes,
        }
      })
    )

    return moviesWithSize
  }

  private async calculateDirectorySize(dirPath: string): Promise<number> {
    const fs = await import('node:fs')
    const path = await import('node:path')

    let totalSize = 0

    try {
      const files = fs.readdirSync(dirPath)

      for (const file of files) {
        const filePath = path.join(dirPath, file)
        const stats = fs.statSync(filePath)

        if (stats.isDirectory()) {
          totalSize += await this.calculateDirectorySize(filePath)
        } else {
          totalSize += stats.size
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
      return 0
    }

    return totalSize
  }

  async resetInterruptedConversions(): Promise<void> {
    try {
      const convertingMovies = await Movie.query().where('conversion_status', 'converting')

      for (const movie of convertingMovies) {
        movie.conversionStatus = 'pending'
        await movie.save()
        console.log(
          `Reset conversion status for movie ${movie.tmdbId} from 'converting' to 'pending'`
        )
      }

      if (convertingMovies.length > 0) {
        console.log(`Reset ${convertingMovies.length} interrupted movie conversions to pending`)
      }
    } catch (error) {
      console.error('Error resetting interrupted conversions:', error)
    }
  }

  private async fetchAndUpdateMovieDetails(movie: Movie): Promise<void> {
    try {
      const movieDetails = await this.tmdbService.getMovieDetails(movie.tmdbId)

      if (movieDetails) {
        if (movieDetails.title) {
          movie.title = movieDetails.title
        }

        if (movieDetails.imdb_id && !movie.imdbId) {
          movie.imdbId = movieDetails.imdb_id
        }
      }
    } catch (error) {
      console.error(`Failed to fetch movie details from TMDB for ID ${movie.tmdbId}:`, error)
    }
  }
}
