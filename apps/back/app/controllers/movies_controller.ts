import type { HttpContext } from '@adonisjs/core/http'
import { TMDBService } from '#services/tmdb_service'
import { BackDropImage, UserMovieAction } from '@hypertube/shared'

export default class MoviesController {
  private tmdbService: TMDBService = new TMDBService()

  async index({ request, response, auth }: HttpContext) {
    const page = request.input('page', 1)
    const movieType = request.input('type', 'movie')
    const limit = 4
    const offset = (page - 1) * limit
    const lang = request.input('lang', 'en')
    // // // const limit = 10
    // // // const offset = (page - 1) * limit
    // TorrentSearchApi.disableAllProviders()
    // // console.log('Yts : ', TorrentSearchApi.isProviderActive('Yts'))
    // // console.log('ThePirateBay : ', TorrentSearchApi.isProviderActive('ThePirateBay'))
    // TorrentSearchApi.enableProvider('Yts')
    // TorrentSearchApi.enableProvider('ThePirateBay')
    // console.log('Yts : ', TorrentSearchApi.isProviderActive('Yts'))
    // console.log('ThePirateBay : ', TorrentSearchApi.isProviderActive('ThePirateBay'))
    // const torrents = await TorrentSearchApi.search('tt0111161', 'All', 100)
    // // const activeTorrentProviders = TorrentSearchApi.getActiveProviders()
    // // console.log('Active Torrent Providers:', activeTorrentProviders)
    // console.log('Torrents:', torrents)
    // // console.log('Page:', page)

    const genresList = await this.tmdbService.getGenresList(lang, movieType)
    const popularMovies = await this.tmdbService.getPopularMovies(lang, page, movieType)
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
    let user = null
    if (await auth.check()) {
      user = await auth.authenticate()
    }

    const moviesFinalResult = await Promise.all(slicedResponse.map(async (genre: any) => {
      return {
        id: genre.id,
        name: genre.name,
        movies: await Promise.all(genre.movies.map(async (movie: any) => {
          movie.user_action = null
          if (user) {
            const movieTable = await user
              .related('movies')
              .query()
              .where('movies.tmdbId', movie.id)
              .first()
            if (!!movieTable) {
              const action = movieTable.$extras.pivot_usersAction as UserMovieAction
              movie.user_action = action || null
            }
          }
          return movie
        }))}}))
    const hasMorePages = finalMovieListByGenre.length > offset + limit
    return {movies: moviesFinalResult, hasMorePages}
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
