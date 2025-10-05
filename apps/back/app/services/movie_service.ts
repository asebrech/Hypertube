import Movie from '#models/movies'
import { TMDBService } from './tmdb_service.js'
import SearchTorrentService from './search_torrent_service.js'
import { DateTime } from 'luxon'
import { inject } from '@adonisjs/core'

@inject()
export default class MovieService {
  constructor(
    private tmdbService: TMDBService = new TMDBService(),
    private searchTorrentService: SearchTorrentService
  ) {}
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

  /**
   * Check and update torrent availability for a movie in database
   * @param movieId TMDB movie ID
   * @returns torrent availability status
   */
  async checkAndUpdateTorrentAvailability(movieId: number): Promise<boolean> {
    try {
      // Get or create movie record in database
      const movieRecord = await this.getOrCreate(movieId)

      // Check if we need to update torrent availability (only if not set or old data)
      let torrentAvailable = movieRecord.torrentAvailable
      if (torrentAvailable === null || torrentAvailable === undefined) {
        try {
          torrentAvailable = await this.searchTorrentService.isAvailable(movieId)
          movieRecord.torrentAvailable = torrentAvailable
          await movieRecord.save()
        } catch {
          torrentAvailable = false
          movieRecord.torrentAvailable = false
          await movieRecord.save()
        }
      }

      return torrentAvailable
    } catch {
      return false
    }
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

  async updateResolutionStatus(
    tmdbId: number,
    resolution: number,
    ready: boolean
  ): Promise<boolean> {
    const movie = await this.getOrCreate(tmdbId)

    let currentStatus: boolean
    switch (resolution) {
      case 480:
        currentStatus = movie.resolution480pReady
        if (currentStatus === ready) return true
        movie.resolution480pReady = ready
        break
      case 720:
        currentStatus = movie.resolution720pReady
        if (currentStatus === ready) return true
        movie.resolution720pReady = ready
        break
      case 1080:
        currentStatus = movie.resolution1080pReady
        if (currentStatus === ready) return true
        movie.resolution1080pReady = ready
        break
      default:
        return false
    }

    await movie.save()
    return true
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
    } catch {}
  }

  async getDownloadedMoviesPaginated(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    sortBy: string = '',
    sortDirection: string = 'desc'
  ): Promise<{
    movies: Array<{
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
    totalMovies: number
    totalPages: number
    totalSize: number
    globalStats: {
      totalMovies: number
      totalSize: number
    }
  }> {
    let query = Movie.query().whereNotNull('download_status').whereNotNull('last_accessed_at')

    // Add search filter if provided
    if (search.trim()) {
      query = query.where((builder) => {
        builder.whereILike('title', `%${search}%`)

        // If search term is a number, also search by tmdbId
        const searchAsNumber = parseInt(search.trim(), 10)
        if (!isNaN(searchAsNumber)) {
          builder.orWhere('tmdbId', searchAsNumber)
        }
      })
    }

    // Get total count for pagination
    const totalMovies = await query.clone().count('* as total')
    const totalCount = Array.isArray(totalMovies) ? totalMovies[0].$extras.total : totalMovies

    // Apply sorting
    let orderByField = 'created_at'
    let orderByDirection: 'asc' | 'desc' = 'desc'

    if (sortBy === 'lastAccessedAt') {
      orderByField = 'last_accessed_at'
      orderByDirection = sortDirection === 'asc' ? 'asc' : 'desc'
    } else if (sortBy === 'createdAt') {
      orderByField = 'created_at'
      orderByDirection = sortDirection === 'asc' ? 'asc' : 'desc'
    }

    // Apply pagination and ordering
    const movies = await query
      .orderBy(orderByField, orderByDirection)
      .offset((page - 1) * limit)
      .limit(limit)

    const fs = await import('node:fs')
    const path = await import('node:path')

    let totalSize = 0
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

        totalSize += sizeInBytes

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

    // Get global statistics
    const globalStats = await this.getGlobalMovieStats()

    return {
      movies: moviesWithSize,
      totalMovies: totalCount, // Filtered count for pagination
      totalPages: Math.ceil(totalCount / limit),
      totalSize, // Size of current page movies
      globalStats: {
        totalMovies: globalStats.totalMovies,
        totalSize: globalStats.totalSize,
      },
    }
  }

  async getMoviesWithoutDownloadStatus(
    page: number = 1,
    limit: number = 10,
    search: string = ''
  ): Promise<{
    movies: Array<{
      id: number
      tmdbId: number
      title: string | null
      torrentAvailable: boolean | null
      createdAt: DateTime
      updatedAt: DateTime
    }>
    totalMovies: number
    totalPages: number
  }> {
    let query = Movie.query().where((builder) => {
      builder.whereNull('last_accessed_at')
    })

    // Add search filter if provided
    if (search.trim()) {
      query = query.where((builder) => {
        builder.whereILike('title', `%${search}%`)

        // If search term is a number, also search by tmdbId
        const searchAsNumber = parseInt(search.trim(), 10)
        if (!isNaN(searchAsNumber)) {
          builder.orWhere('tmdbId', searchAsNumber)
        }
      })
    }

    // Get total count for pagination
    const totalMovies = await query.clone().count('* as total')
    const totalCount = Array.isArray(totalMovies) ? totalMovies[0].$extras.total : totalMovies

    // Apply pagination and ordering (newest first)
    const movies = await query
      .orderBy('created_at', 'desc')
      .offset((page - 1) * limit)
      .limit(limit)

    const moviesData = movies.map((movie) => ({
      id: movie.id,
      tmdbId: movie.tmdbId,
      title: movie.title,
      torrentAvailable: movie.torrentAvailable,
      createdAt: movie.createdAt,
      updatedAt: movie.updatedAt,
    }))

    return {
      movies: moviesData,
      totalMovies: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    }
  }

  async getGlobalMovieStats(): Promise<{ totalMovies: number; totalSize: number }> {
    // Get all downloaded movies (no search filter)
    const allMovies = await Movie.query()
      .whereNotNull('download_status')
      .whereNotNull('last_accessed_at')
      .select('tmdbId')

    const fs = await import('node:fs')
    const path = await import('node:path')

    let totalSize = 0

    // Calculate total size of all movies
    for (const movie of allMovies) {
      const hlsPath = path.join(process.cwd(), 'hls-output', movie.tmdbId.toString())
      const cachePath = path.join(process.cwd(), 'torrent-cache', movie.tmdbId.toString())

      try {
        if (fs.existsSync(hlsPath)) {
          totalSize += await this.calculateDirectorySize(hlsPath)
        }
        if (fs.existsSync(cachePath)) {
          totalSize += await this.calculateDirectorySize(cachePath)
        }
      } catch (error) {
        console.warn(`Could not calculate size for movie ${movie.tmdbId}:`, error)
      }
    }

    return {
      totalMovies: allMovies.length,
      totalSize,
    }
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
    } catch {}
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
    } catch {}
  }
}
