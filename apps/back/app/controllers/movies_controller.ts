import type { HttpContext } from '@adonisjs/core/http'
import TorrentSearchApi from 'torrent-search-api'
import { TMDBService } from '#services/tmdb_service'
import { BackDropImage } from '@hypertube/shared'

export default class MoviesController {
  private tmdbService: TMDBService = new TMDBService()

  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
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


    const genresList = await this.tmdbService.getGenresList(lang)
    const popularMovies = await this.tmdbService.getPopularMovies(lang, page)
    const movieListByGenre = genresList.genres.map(async (genre: any) => {
      const movies = await this.tmdbService.getMovieListByGenre(genre.id, lang, page)
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
    const backdropImageFoundBoolean = await this.tmdbService.getBackdropImageUrl(tmdb_movie_id, size, lang)
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
    const backdropImageFoundBoolean = await this.tmdbService.getPosterImageUrl(tmdb_movie_id, size, lang)
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
    const logoImageFoundBoolean = await this.tmdbService.getLogoImageUrl(tmdb_movie_id, size, lang)
    if (logoImageFoundBoolean) {
      return logoImageFoundBoolean
    } else {
      return response.notFound({ error: 'Image not found' })
    }
  }

  async movieDetails ({ request, response }: HttpContext) {
    const tmdb_movie_id = request.param('id')
    const lang = request.input('lang', 'en')
    const movieDetails = await this.tmdbService.getMovieDetails(tmdb_movie_id, lang)
    if (movieDetails) {
      return movieDetails
    } else {
      return response.notFound({ error: 'Movie not found' })
    }
  }

  async movieVideos ({ request, response }: HttpContext) {
    const tmdb_movie_id = request.param('id')
    const lang = request.input('lang', 'en')
    const movieVideos = await this.tmdbService.getMovieVideos(tmdb_movie_id, lang)
    if (!movieVideos)
      return response.notFound({ error: 'Movie videos not found' })
    const movieVideo = movieVideos.results.find((video: any) => video.site === 'YouTube' && video.type === 'Trailer')
    return movieVideo;
  }
}
