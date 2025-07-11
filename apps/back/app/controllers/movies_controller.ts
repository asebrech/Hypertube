import type { HttpContext } from '@adonisjs/core/http'
import { TMDBService } from '#services/tmdb_service'
import { BackDropImage } from '@hypertube/shared'

export default class MoviesController {
  private tmdbService: TMDBService = new TMDBService()

  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const movieType = request.input('type', 'movie')
    const limit = 4
    const offset = (page - 1) * limit
    const lang = request.input('lang', 'en')

    const genresList = await this.tmdbService.getGenresList(lang)
    const popularMovies = await this.tmdbService.getPopularMovies(lang, page)

    const movieListByGenre = genresList.genres.map(async (genre: any) => {
      const movies = await this.tmdbService.getMovieListByGenre(genre.id, lang, page, movieType)
      return {
        id: genre.id,
        name: genre.name,
        movies: movies.results,
      }
    })
    const movieListByGenreResults = await Promise.all(movieListByGenre)
    const finalMovieListByGenre = [
      {
        id: 0,
        name: "TOP 10",
        movies: popularMovies.results.slice(0, 10),
      },
      ...movieListByGenreResults,
    ]
    const slicedResponse = finalMovieListByGenre.slice(offset, offset + limit)
    const hasMorePages = finalMovieListByGenre.length > offset + limit
    return {movies: slicedResponse, hasMorePages}
  }

  async backdropImage ({ request, response }: HttpContext): Promise<BackDropImage | void> {
    const tmdb_movie_id = request.input('tmdb_movie_id')
    const lang = request.input('lang', 'en')
    const size = request.input('size', 'original')
    const movieType = request.input('type', 'movie')
    const backdropImageFoundBoolean = await this.tmdbService.getBackdropImageUrl(tmdb_movie_id, size, lang, movieType)
    if (backdropImageFoundBoolean) {
      return backdropImageFoundBoolean
    } else {
      return response.notFound({ error: 'Image not found' })
    }
  }

  async posterImage ({ request, response }: HttpContext): Promise<BackDropImage | void> {
    const tmdb_movie_id = request.input('tmdb_movie_id')
    const lang = request.input('lang', 'en')
    const size = request.input('size', 'original')
    const movieType = request.input('type', 'movie')
    const backdropImageFoundBoolean = await this.tmdbService.getPosterImageUrl(tmdb_movie_id, size, lang, movieType)
    if (backdropImageFoundBoolean) {
      return backdropImageFoundBoolean
    } else {
      return response.notFound({ error: 'Image not found' })
    }
  }

  async logoImage ({ request, response }: HttpContext): Promise<BackDropImage | void> {
    const tmdb_movie_id = request.input('tmdb_movie_id')
    const lang = request.input('lang', 'en')
    const size = request.input('size', 'original')
    const movieType = request.input('type', 'movie')
    const logoImageFoundBoolean = await this.tmdbService.getLogoImageUrl(tmdb_movie_id, size, lang, movieType)
    if (logoImageFoundBoolean) {
      return logoImageFoundBoolean
    } else {
      return response.notFound({ error: 'Image not found' })
    }
  }

  async movieDetails ({ request, response }: HttpContext) {
    const tmdb_movie_id = request.param('id')
    const lang = request.input('lang', 'en')
    const movieType = request.input('type', 'movie')
    const movieDetails = await this.tmdbService.getMovieDetails(tmdb_movie_id, lang, movieType)
    if (movieDetails) {
      return movieDetails
    } else {
      return response.notFound({ error: 'Movie not found' })
    }
  }

  async movieVideos ({ request, response }: HttpContext) {
    const tmdb_movie_id = request.param('id')
    const lang = request.input('lang', 'en')
    const movieType = request.input('type', 'movie')
    console.log('type', movieType)
    const movieVideos = await this.tmdbService.getMovieVideos(tmdb_movie_id, lang, movieType)
    if (!movieVideos)
      return response.notFound({ error: 'Movie videos not found' })
    let movieVideo = movieVideos.results.find((video: any) => video.site === 'YouTube' && video.type === 'Clip')
    if (!movieVideo)
      movieVideo = movieVideos.results.find((video: any) => video.site === 'YouTube' && video.type === 'Trailer')
    return movieVideo;
  }
}
