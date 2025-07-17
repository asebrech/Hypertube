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
      const movies = await this.tmdbService.getDiscover([genre.id], undefined, lang, page, movieType)
      return {
        id: genre.id,
        name: genre.name,
        movies: movies.results.map((movie: any) => {
          return {
            media_type: movieType,
            ...movie
          }})
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

  async movieSearch ({ request, response }: HttpContext) {
    const query = request.input('query')
    const lang = request.input('lang', 'en')
    const page = request.input('page', 1)
    if (!query) {
      return response.badRequest({ error: 'Query is required' })
    }
    const searchResults = await this.tmdbService.getMultiSearch(query, lang, page)
    const hasMorePages = searchResults.total_pages > page;
    const media: any[] = [];

    for (const result of searchResults.results) {
      if (result.media_type === 'person' && result.known_for_department === 'Acting') {
        const movieActor = await this.tmdbService.getMovieListByGenre(
          undefined,
          result.id,
          lang,
          1,
          'movie',
          'en'
        );

        const movies = movieActor.results.map((movie: any) => ({
          media_type: 'movie',
          ...movie
        }));

        media.push(...movies);
      } else {
        media.push(result);
      }
    }
    if (searchResults) {
    return {movies: media, hasMorePages}
    } else {
      return response.notFound({ error: 'Search results not found' })
    }
  }

  async MovieDiscover ({ request, response }: HttpContext) {
    let genreId = request.input('genreId')
    if (typeof genreId === 'string') {
      genreId = [genreId]
    }
    const castId = request.input('castId')
    if (typeof castId === 'string') {
      genreId = [castId]
    }
    const lang = request.input('lang', 'en');
    const page = Number(request.input('page', 1));
    const movieType = request.input('type', 'movie');
    const region = request.input('region', 'en');
    const releaseYear = request.input('releaseYear');
    const sortBy = request.input('sortBy', 'popularity.desc');
    const originalLanguage = request.input('originalLanguage');

    const discoverResults = await this.tmdbService.getDiscover(
      genreId,
      castId,
      lang,
      page,
      movieType,
      region,
      releaseYear,
      sortBy,
      originalLanguage
    );
    const hasMorePages = discoverResults.total_pages > page;
    if (discoverResults) {
      return { movies: discoverResults.results, hasMorePages }
    } else {
      return response.notFound({ error: 'Discover results not found' })
    }
  }

  async movieGenres ({ request, response }: HttpContext) {
    const lang = request.input('lang', 'en')
    const movieType = request.input('type', 'movie')
    const genresList = await this.tmdbService.getGenresList(lang, movieType)
    if (genresList) {
      return genresList.genres
    } else {
      return response.notFound({ error: 'Genres not found' })
    }
  }
}
