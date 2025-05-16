import type { HttpContext } from '@adonisjs/core/http'
import TorrentSearchApi from 'torrent-search-api'
import { TMDBService } from '#services/tmdb_service'

export default class MoviesController {
  private tmdbService: TMDBService = new TMDBService()

  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const lang = request.input('lang', 'en')
    console.log('TMDB Service initialized:', this.tmdbService)
    // const limit = 10
    // const offset = (page - 1) * limit
    TorrentSearchApi.disableAllProviders()
    // console.log('Yts : ', TorrentSearchApi.isProviderActive('Yts'))
    // console.log('ThePirateBay : ', TorrentSearchApi.isProviderActive('ThePirateBay'))
    TorrentSearchApi.enableProvider('Yts')
    TorrentSearchApi.enableProvider('ThePirateBay')
    // console.log('Yts : ', TorrentSearchApi.isProviderActive('Yts'))
    // console.log('ThePirateBay : ', TorrentSearchApi.isProviderActive('ThePirateBay'))
    const torrents = await TorrentSearchApi.search('tt0133093', 'All', 100)
    const activeTorrentProviders = TorrentSearchApi.getActiveProviders()
    // console.log('Active Torrent Providers:', activeTorrentProviders)
    // console.log('Torrents:', torrents)
    // console.log('Page:', page)
    const genresList = await this.tmdbService.getGenresList(lang)
    console.log('Genres List:', genresList)
    const popularMovies = await this.tmdbService.getPopularMovies(lang, page)
    // console.log('Popular Movies:', popularMovies)
    const movieListByGenre = genresList.genres.map(async (genre: any) => {
      const movies = await this.tmdbService.getMovieListByGenre(genre.id, lang, page)
      return {
        id: genre.id,
        name: genre.name,
        movies: movies.results,
      }
    })
    const movieListByGenreResults = await Promise.all(movieListByGenre)
    // console.log('Movie List by Genre:', JSON.stringify(movieListByGenreResults, null, 2))
    return [
      {
        id: 0,
        name: "TOP 10",
        movies: popularMovies.results,
      },
      ...movieListByGenreResults,
    ]
  }

  async backdropImage ({ request, response }: HttpContext) {
    const tmdb_movie_id = request.input('tmdb_movie_id')
    const lang = request.input('lang', 'en')
    const size = request.input('size', 'original')
    const backdropImageFoundBoolean = await this.tmdbService.getBackdropImageUrl(tmdb_movie_id, size, lang)
    if (backdropImageFoundBoolean) {
      return backdropImageFoundBoolean
    } else {
      return response.notFound({ error: 'Image not found' })
    }
  }
}
