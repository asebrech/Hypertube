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
