import Movie from '#models/movies'
import { TMDBService } from './tmdb_service.js'

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

  async resetInterruptedConversions(): Promise<void> {
    try {
      const convertingMovies = await Movie.query().where('conversion_status', 'converting')
      
      for (const movie of convertingMovies) {
        movie.conversionStatus = 'pending'
        await movie.save()
        console.log(`Reset conversion status for movie ${movie.tmdbId} from 'converting' to 'pending'`)
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
