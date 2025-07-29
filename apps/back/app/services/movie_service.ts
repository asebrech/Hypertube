import Movie from '#models/movies'
import { TMDBService } from './tmdb_service.js'

export default class MovieService {
  private tmdbService: TMDBService = new TMDBService()
  async getOrCreate(tmdbId: number, data?: Partial<Movie>): Promise<Movie> {
    let movie = await Movie.query().where('tmdbId', tmdbId).first()

    if (movie) {
      console.log(`Movie found for TMDB ID ${tmdbId}:`, movie.title || 'Untitled')

      if (!movie.title && (!data || !data.title)) {
        await this.fetchAndUpdateMovieDetails(movie)
      }

      return movie
    }

    console.log(`Creating new movie for TMDB ID ${tmdbId}`)
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
    console.log(
      `Movie created with ID ${movie.id} for TMDB ID ${tmdbId}:`,
      movie.title || 'Untitled'
    )

    return movie
  }

  async updateMagnetLink(tmdbId: number, magnetLink: string): Promise<Movie> {
    const movie = await this.getOrCreate(tmdbId)
    movie.magicLink = magnetLink
    await movie.save()

    console.log(`Updated magnet link for movie ${movie.id}`)
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
    
    switch (resolution) {
      case 480:
        movie.resolution480pReady = ready
        break
      case 720:
        movie.resolution720pReady = ready
        break
      case 1080:
        movie.resolution1080pReady = ready
        break
      default:
        throw new Error(`Unsupported resolution: ${resolution}`)
    }
    
    await movie.save()
    console.log(`Updated ${resolution}p status to ${ready} for movie ${movie.id}`)
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
      allReady: movie.resolution480pReady && movie.resolution720pReady && movie.resolution1080pReady
    }
  }

  private async fetchAndUpdateMovieDetails(movie: Movie): Promise<void> {
    try {
      console.log(`Fetching movie details from TMDB for ID ${movie.tmdbId}`)
      const movieDetails = await this.tmdbService.getMovieDetails(movie.tmdbId)

      if (movieDetails) {
        if (movieDetails.title) {
          movie.title = movieDetails.title
          console.log(`Updated movie title: ${movieDetails.title}`)
        }

        if (movieDetails.imdb_id && !movie.imdbId) {
          movie.imdbId = movieDetails.imdb_id
          console.log(`Updated IMDB ID: ${movieDetails.imdb_id}`)
        }
      }
    } catch (error) {
      console.error(`Failed to fetch movie details from TMDB for ID ${movie.tmdbId}:`, error)
    }
  }
}
