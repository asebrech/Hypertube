import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { join } from 'node:path'
import app from '@adonisjs/core/services/app'
import { TMDBService } from '#services/tmdb_service'
import { BackDropImage } from '@hypertube/shared'
import MovieService from '#services/movie_service'
import { OpenSubtitleService } from '#services/opensubtitle_service'
import SubtitleService from '#services/subtitle_service'
import { SUPPORTED_LANGUAGES } from '../validators/subtitle.js'
import { isValidTmdbId } from '../utils/format.js'

@inject()
export default class MoviesController {
  constructor(
    private tmdbService: TMDBService,
    private movieService: MovieService,
    private openSubtitleService: OpenSubtitleService,
    private subtitleService: SubtitleService
  ) {}

  async index({ request, auth }: HttpContext) {
    const page = request.input('page', 1)
    const movieType = request.input('type', 'movie')
    const limit = 4
    const offset = (page - 1) * limit
    const lang = request.input('lang', 'en')

    let user = null
    let allowAdultContent = false
    if (await auth.check()) {
      user = await auth.authenticate()
      allowAdultContent = user.allowAdultContent || false
    }

    const genresList = await this.tmdbService.getGenresList(lang, movieType)
    const popularMovies = await this.tmdbService.getPopularMovies(lang, page, movieType)

    const movieListByGenre = genresList.genres.map(async (genre: any) => {
      const movies = await this.tmdbService.getDiscover(
        [genre.id],
        undefined,
        lang,
        page,
        movieType,
        'en',
        undefined,
        'popularity.desc',
        undefined,
        allowAdultContent
      )
      return {
        id: genre.id,
        name: genre.name,
        movies: movies.results.map((movie: any) => {
          return {
            media_type: movieType,
            ...movie,
          }
        }),
      }
    })
    const movieListByGenreResults = await Promise.all(movieListByGenre)
    const finalMovieListByGenre = [
      {
        id: 0,
        name: 'TOP 10',
        movies: popularMovies.results.slice(0, 10).map((movie: any) => {
          return {
            media_type: movieType,
            ...movie,
          }
        }),
      },
      ...movieListByGenreResults,
    ]
    const slicedResponse = finalMovieListByGenre.slice(offset, offset + limit)
   

    const moviesFinalResult = await Promise.all(
      slicedResponse.map(async (genre: any) => {
        return {
          id: genre.id,
          name: genre.name,
          movies: await Promise.all(
            genre.movies.map(async (movie: any) => {
              movie.is_watched = false
              movie.is_bookmarked = false
              movie.watch_progress_seconds = 0

              if (user) {
                const movieTable = await user
                  .related('movies')
                  .query()
                  .where('movies.tmdbId', movie.id)
                  .first()
                if (movieTable) {
                  movie.is_watched = movieTable.$extras.pivot_is_watched || false
                  movie.is_bookmarked = movieTable.$extras.pivot_is_bookmarked || false
                  movie.watch_progress_seconds =
                    movieTable.$extras.pivot_watch_progress_seconds || 0
                }
              }
              return movie
            })
          ),
        }
      })
    )
    const hasMorePages = finalMovieListByGenre.length > offset + limit
    return { movies: moviesFinalResult, hasMorePages }
  }

  async backdropImage({ request, response }: HttpContext): Promise<BackDropImage | void> {
    const tmdb_movie_id = request.input('tmdb_movie_id')
    const lang = request.input('lang', 'en')
    const size = request.input('size', 'original')
    const movieType = request.input('type', 'movie')
    const backdropImageFoundBoolean = await this.tmdbService.getBackdropImageUrl(
      tmdb_movie_id,
      size,
      lang,
      movieType
    )
    if (backdropImageFoundBoolean) {
      return backdropImageFoundBoolean
    } else {
      return response.notFound({ error: 'Image not found' })
    }
  }

  async posterImage({ request, response }: HttpContext): Promise<BackDropImage | void> {
    const tmdb_movie_id = request.input('tmdb_movie_id')
    const lang = request.input('lang', 'en')
    const size = request.input('size', 'original')
    const movieType = request.input('type', 'movie')
    const backdropImageFoundBoolean = await this.tmdbService.getPosterImageUrl(
      tmdb_movie_id,
      size,
      lang,
      movieType
    )
    if (backdropImageFoundBoolean) {
      return backdropImageFoundBoolean
    } else {
      return response.notFound({ error: 'Image not found' })
    }
  }

  async logoImage({ request, response }: HttpContext): Promise<BackDropImage | void> {
    const tmdb_movie_id = request.input('tmdb_movie_id')
    const lang = request.input('lang', 'en')
    const size = request.input('size', 'original')
    const movieType = request.input('type', 'movie')
    const logoImageFoundBoolean = await this.tmdbService.getLogoImageUrl(
      tmdb_movie_id,
      size,
      lang,
      movieType
    )
    if (logoImageFoundBoolean) {
      return logoImageFoundBoolean
    } else {
      return response.notFound({ error: 'Image not found' })
    }
  }

  async movieDetails({ request, response }: HttpContext) {
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

  async movieVideos({ request, response }: HttpContext) {
    const tmdb_movie_id = request.param('id')
    const lang = request.input('lang', 'en')
    const movieType = request.input('type', 'movie')
    const movieVideos = await this.tmdbService.getMovieVideos(tmdb_movie_id, lang, movieType)
    if (!movieVideos) {
      return response.notFound({ error: 'Movie videos not found' })
    }
    let movieVideo = movieVideos.results.find(
      (video: any) => video.site === 'YouTube' && video.type === 'Clip'
    )
    if (!movieVideo) {
      movieVideo = movieVideos.results.find(
        (video: any) => video.site === 'YouTube' && video.type === 'Trailer'
      )
    }
    return movieVideo
  }

  async movieSearch({ request, response, auth }: HttpContext) {
    const query = request.input('query')
    const lang = request.input('lang', 'en')
    const page = request.input('page', 1)
    if (!query) {
      return response.badRequest({ error: 'Query is required' })
    }

    let user = null
    let allowAdultContent = false
    if (await auth.check()) {
      user = await auth.authenticate()
      allowAdultContent = user.allowAdultContent || false
    }

    const searchResults = await this.tmdbService.getMultiSearch(query, lang, page, allowAdultContent)
    const hasMorePages = searchResults.total_pages > page
    const media: any[] = []

    for (const result of searchResults.results) {
      if (result.media_type === 'person' && result.known_for_department === 'Acting') {
        const movieActor = await this.tmdbService.getMovieListByGenre(
          undefined,
          result.id,
          lang,
          1,
          'movie',
          'en',
          allowAdultContent
        )

        const movies = await Promise.all(
          movieActor.results.map(async (movie: any) => {
            const movieWithDefaults = {
              media_type: 'movie',
              ...movie,
              is_watched: false,
              is_bookmarked: false,
              watch_progress_seconds: 0,
            }

            if (user) {
              const movieTable = await user
                .related('movies')
                .query()
                .where('movies.tmdbId', movie.id)
                .first()
              if (movieTable) {
                movieWithDefaults.is_watched = movieTable.$extras.pivot_is_watched || false
                movieWithDefaults.is_bookmarked = movieTable.$extras.pivot_is_bookmarked || false
                movieWithDefaults.watch_progress_seconds =
                  movieTable.$extras.pivot_watch_progress_seconds || 0
              }
            }

            return movieWithDefaults
          })
        )

        media.push(...movies)
      } else {
        // Handle non-person results (movies, tv shows)
        const movieWithDefaults = {
          ...result,
          is_watched: false,
          is_bookmarked: false,
          watch_progress_seconds: 0,
        }

        if (user && (result.media_type === 'movie' || result.media_type === 'tv')) {
          const movieTable = await user
            .related('movies')
            .query()
            .where('movies.tmdbId', result.id)
            .first()
          if (movieTable) {
            movieWithDefaults.is_watched = movieTable.$extras.pivot_is_watched || false
            movieWithDefaults.is_bookmarked = movieTable.$extras.pivot_is_bookmarked || false
            movieWithDefaults.watch_progress_seconds =
              movieTable.$extras.pivot_watch_progress_seconds || 0
          }
        }

        media.push(movieWithDefaults)
      }
    }
    if (searchResults) {
      return { movies: media, hasMorePages }
    } else {
      return response.notFound({ error: 'Search results not found' })
    }
  }

  async MovieDiscover({ request, response, auth }: HttpContext) {
    let genreId = request.input('genreId')
    if (typeof genreId === 'string') {
      genreId = [genreId]
    }
    let castId = request.input('castId')
    if (typeof castId === 'string') {
      castId = [castId]
    }
    const lang = request.input('lang', 'en')
    const page = Number(request.input('page', 1))
    const movieType = request.input('type', 'movie')
    const region = request.input('region', 'en')
    const releaseYear = request.input('releaseYear')
    const sortBy = request.input('sortBy', 'popularity.desc')
    const originalLanguage = request.input('originalLanguage')

    let user = null
    let allowAdultContent = false
    if (await auth.check()) {
      user = await auth.authenticate()
      allowAdultContent = user.allowAdultContent || false
    }

    const discoverResults = await this.tmdbService.getDiscover(
      genreId,
      castId,
      lang,
      page,
      movieType,
      region,
      releaseYear,
      sortBy,
      originalLanguage,
      allowAdultContent
    )
    const hasMorePages = discoverResults.total_pages > page
    if (discoverResults) {
      const moviesWithMediaType = await Promise.all(
        discoverResults.results.map(async (movie: any) => {
          const movieWithType = {
            media_type: movieType,
            ...movie,
            is_watched: false,
            is_bookmarked: false,
            watch_progress_seconds: 0,
          }

          if (user) {
            const movieTable = await user
              .related('movies')
              .query()
              .where('movies.tmdbId', movie.id)
              .first()
            if (movieTable) {
              movieWithType.is_watched = movieTable.$extras.pivot_is_watched || false
              movieWithType.is_bookmarked = movieTable.$extras.pivot_is_bookmarked || false
              movieWithType.watch_progress_seconds =
                movieTable.$extras.pivot_watch_progress_seconds || 0
            }
          }

          return movieWithType
        })
      )
      return { movies: moviesWithMediaType, hasMorePages }
    } else {
      return response.notFound({ error: 'Discover results not found' })
    }
  }

  async movieGenres({ request, response }: HttpContext) {
    const lang = request.input('lang', 'en')
    const movieType = request.input('type', 'movie')
    const genresList = await this.tmdbService.getGenresList(lang, movieType)
    if (genresList) {
      return genresList.genres
    } else {
      return response.notFound({ error: 'Genres not found' })
    }
  }

  async MovieSimilar({ request, response }: HttpContext) {
    const tmdb_movie_id = request.input('tmdb_movie_id')
    const lang = request.input('lang', 'en')
    const page = request.input('page', 1)
    const movieType = request.input('type', 'movie')
    const similarMovies = await this.tmdbService.getSimilarMovies(
      tmdb_movie_id,
      lang,
      page,
      movieType
    )
    const hasMorePages = similarMovies.total_pages > page
    if (similarMovies) {
      const moviesWithMediaType = similarMovies.results.map((movie: any) => ({
        media_type: movieType,
        ...movie,
      }))
      return { movies: moviesWithMediaType, hasMorePages }
    } else {
      return response.notFound({ error: 'Similar movies not found' })
    }
  }

  async MovieCredits({ request, response }: HttpContext) {
    const tmdb_movie_id = request.input('tmdb_movie_id')
    const lang = request.input('lang', 'en')
    const movieType = request.input('type', 'movie')
    const movieCredits = await this.tmdbService.getMovieCredits(tmdb_movie_id, lang, movieType)
    if (movieCredits) {
      return movieCredits
    } else {
      return response.notFound({ error: 'Movie credits not found' })
    }
  }

  async PeopleDetails({ request, response }: HttpContext) {
    const tmdb_person_id = request.input('tmdb_people_id')
    const lang = request.input('lang', 'en')
    const personDetails = await this.tmdbService.getPeopleDetails(tmdb_person_id, lang)
    if (personDetails) {
      return personDetails
    } else {
      return response.notFound({ error: 'Person details not found' })
    }
  }

  async markAsWatched({ params, auth, response }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const tmdbId = Number.parseInt(params.id)

      if (Number.isNaN(tmdbId)) {
        return response.badRequest({ error: 'Invalid movie ID' })
      }

      const movie = await this.movieService.getOrCreate(tmdbId)

      const existingRelation = await user
        .related('movies')
        .query()
        .where('movies.id', movie.id)
        .first()

      if (existingRelation) {
        await user.related('movies').detach([movie.id])
      }

      const currentIsBookmarked = existingRelation?.$extras.pivot_is_bookmarked || false

      await user.related('movies').attach({
        [movie.id]: {
          is_watched: true,
          is_bookmarked: currentIsBookmarked,
          last_watched_at: new Date(),
        },
      })

      return response.ok({ message: 'Movie marked as watched successfully' })
    } catch (error) {
      console.error('Error marking movie as watched:', error)
      return response.internalServerError({
        error: 'Failed to mark movie as watched',
      })
    }
  }

  async saveWatchProgress({ params, auth, request, response }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const tmdbId = Number.parseInt(params.id)
      const { currentTime } = request.only(['currentTime'])

      if (isNaN(tmdbId)) {
        return response.badRequest({ error: 'Invalid movie ID' })
      }

      if (typeof currentTime !== 'number' || currentTime < 0) {
        return response.badRequest({ error: 'Invalid current time' })
      }

      const movie = await this.movieService.getOrCreate(tmdbId)

      const progressSeconds = Math.floor(currentTime)

      const existingRelation = await user
        .related('movies')
        .query()
        .where('movies.id', movie.id)
        .first()

      if (existingRelation) {
        await user.related('movies').detach([movie.id])
      }

      const currentIsWatched = existingRelation?.$extras.pivot_is_watched || false
      const currentIsBookmarked = existingRelation?.$extras.pivot_is_bookmarked || false

      await user.related('movies').attach({
        [movie.id]: {
          is_watched: currentIsWatched,
          is_bookmarked: currentIsBookmarked,
          watch_progress_seconds: progressSeconds,
          last_watched_at: new Date(),
        },
      })

      return response.ok({
        message: 'Watch progress saved successfully',
        progress: progressSeconds,
      })
    } catch (error) {
      console.error('Error saving watch progress:', error)
      return response.internalServerError({
        error: 'Failed to save watch progress',
      })
    }
  }

  async getWatchProgress({ params, auth, response }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const tmdbId = Number.parseInt(params.id)

      if (isNaN(tmdbId)) {
        return response.badRequest({ error: 'Invalid movie ID' })
      }

      const movie = await this.movieService.getOrCreate(tmdbId)

      const relation = await user.related('movies').query().where('movies.id', movie.id).first()

      if (!relation) {
        return response.ok({
          progress: 0,
          lastWatchedAt: null,
        })
      }

      return response.ok({
        progress: relation.$extras.pivot_watch_progress_seconds || 0,
        lastWatchedAt: relation.$extras.pivot_last_watched_at || null,
        isWatched: relation.$extras.pivot_is_watched || false,
        isBookmarked: relation.$extras.pivot_is_bookmarked || false,
      })
    } catch (error) {
      console.error('Error getting watch progress:', error)
      return response.internalServerError({
        error: 'Failed to get watch progress',
      })
    }
  }

  async toggleBookmark({ params, auth, response }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const tmdbId = Number.parseInt(params.id)

      if (isNaN(tmdbId)) {
        return response.badRequest({ error: 'Invalid movie ID' })
      }

      const movieService = new MovieService()
      const movie = await movieService.getOrCreate(tmdbId)

      const existingRelation = await user
        .related('movies')
        .query()
        .where('movies.id', movie.id)
        .first()

      if (existingRelation) {
        await user.related('movies').detach([movie.id])
      }

      const currentIsWatched = existingRelation?.$extras.pivot_is_watched || false
      const currentIsBookmarked = existingRelation?.$extras.pivot_is_bookmarked || false
      const currentWatchProgress = existingRelation?.$extras.pivot_watch_progress_seconds || 0
      const currentLastWatchedAt = existingRelation?.$extras.pivot_last_watched_at || null

      const newBookmarkStatus = !currentIsBookmarked

      await user.related('movies').attach({
        [movie.id]: {
          is_watched: currentIsWatched,
          is_bookmarked: newBookmarkStatus,
          watch_progress_seconds: currentWatchProgress,
          last_watched_at: currentLastWatchedAt,
        },
      })

      const message = newBookmarkStatus
        ? 'Movie bookmarked successfully'
        : 'Bookmark removed successfully'

      return response.ok({
        message,
        bookmarked: newBookmarkStatus,
      })
    } catch (error) {
      console.error('Error toggling bookmark:', error)
      return response.internalServerError({
        error: 'Failed to toggle bookmark',
      })
    }
  }

  async downloadMultipleSubtitles({ request, response }: HttpContext) {
    try {
      const tmdbId = Number.parseInt(request.param('id'))

      if (Number.isNaN(tmdbId) || !isValidTmdbId(tmdbId)) {
        return response.badRequest({
          success: false,
          error: 'Invalid movie ID provided',
        })
      }

      // Manual validation with better error messages
      const rawLanguages = request.input('languages')
      const rawLanguage = request.input('language')

      let finalLanguages: string[]

      if (rawLanguages && Array.isArray(rawLanguages)) {
        const unsupportedLanguages = rawLanguages.filter(
          (lang) => !SUPPORTED_LANGUAGES.includes(lang)
        )
        if (unsupportedLanguages.length > 0) {
          return response.badRequest({
            success: false,
            error: `Unsupported language(s): ${unsupportedLanguages.join(', ')}`,
            supportedLanguages: SUPPORTED_LANGUAGES,
            message: `Please use one of the supported languages: ${SUPPORTED_LANGUAGES.join(', ')}`,
          })
        }
        finalLanguages = rawLanguages
      } else if (rawLanguage) {
        if (!SUPPORTED_LANGUAGES.includes(rawLanguage)) {
          return response.badRequest({
            success: false,
            error: `Unsupported language: ${rawLanguage}`,
            supportedLanguages: SUPPORTED_LANGUAGES,
            message: `Please use one of the supported languages: ${SUPPORTED_LANGUAGES.join(', ')}`,
          })
        }
        finalLanguages = [rawLanguage]
      } else {
        finalLanguages = ['en']
      }

      const result = await this.subtitleService.downloadMultipleSubtitles(tmdbId, finalLanguages)

      return response.ok({
        success: result.success,
        message: `Downloaded subtitles for ${result.results.filter((r) => r.success).length} language(s)`,
        results: result.results,
      })
    } catch (error) {
      console.error('Error downloading multiple subtitles:', error)
      return response.internalServerError({
        error: 'Failed to download subtitles',
      })
    }
  }

  async getSubtitles({ request, response }: HttpContext) {
    try {
      const tmdbId = Number.parseInt(request.param('id'))
      const language = request.param('language')

      if (Number.isNaN(tmdbId) || !isValidTmdbId(tmdbId)) {
        return response.badRequest({
          success: false,
          error: 'Invalid movie ID provided',
        })
      }

      if (language) {
        if (language.length !== 2) {
          return response.badRequest({
            success: false,
            error: 'Invalid language code provided. Must be 2 characters (e.g., "en", "fr")',
          })
        }

        const webVttContent = await this.subtitleService.getSubtitleAsWebVtt(tmdbId, language)

        if (!webVttContent) {
          return response.notFound({
            error: `Subtitle not found for language: ${language}`,
          })
        }

        return response
          .header('Content-Type', 'text/vtt; charset=utf-8')
          .header('Cache-Control', 'public, max-age=3600')
          .header('Access-Control-Allow-Origin', '*')
          .header('Access-Control-Allow-Methods', 'GET')
          .header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
          .send(webVttContent)
      }

      const availableLanguages = await this.subtitleService.getAvailableSubtitles(tmdbId)

      return response.ok({
        success: true,
        tmdbId: tmdbId,
        availableLanguages,
        count: availableLanguages.length,
      })
    } catch (error) {
      console.error('Error getting subtitles:', error)
      return response.internalServerError({
        error: 'Failed to get subtitles',
      })
    }
  }

  async getUserMovies({ request, response, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const page = Number.parseInt(request.input('page', '1'))
      const limit = Number.parseInt(request.input('limit', '20'))
      const isWatched = request.input('isWatched')
      const isBookmarked = request.input('isBookmarked')

      // Validate pagination parameters
      if (isNaN(page) || page < 1) {
        return response.badRequest({
          success: false,
          error: 'Invalid page number. Must be a positive integer.',
        })
      }

      if (isNaN(limit) || limit < 1 || limit > 100) {
        return response.badRequest({
          success: false,
          error: 'Invalid limit. Must be between 1 and 100.',
        })
      }

      // Build query for user's movies
      let query = user.related('movies').query()

      // Apply filters based on parameters
      if (isWatched !== undefined) {
        const watchedFilter = isWatched === 'true' || isWatched === true
        query = query.wherePivot('is_watched', watchedFilter)
      }

      if (isBookmarked !== undefined) {
        const bookmarkedFilter = isBookmarked === 'true' || isBookmarked === true
        query = query.wherePivot('is_bookmarked', bookmarkedFilter)
      }

      // Get total count for pagination
      const totalQuery = query.clone()
      const totalCount = await totalQuery.count('* as total')
      const total = Number(totalCount[0].$extras.total)

      // Apply pagination
      const offset = (page - 1) * limit
      const movies = await query
        .orderBy('movie_user.last_watched_at', 'desc')
        .offset(offset)
        .limit(limit)

      console.log("movies",   movies)
      // Calculate pagination info
      const totalPages = Math.ceil(total / limit)
      const hasNextPage = page < totalPages
      const hasPrevPage = page > 1

      // Format response with movie details and user interaction data
      const formattedMovies = movies.map((movie) => ({
        id: movie.id,
        tmdbId: movie.tmdbId,
        title: movie.title,
        createdAt: movie.createdAt,
        updatedAt: movie.updatedAt,
        userInteraction: {
          isWatched: movie.$extras.pivot_is_watched || false,
          isBookmarked: movie.$extras.pivot_is_bookmarked || false,
          watchProgressSeconds: movie.$extras.pivot_watch_progress_seconds || 0,
          lastWatchedAt: movie.$extras.pivot_last_watched_at || null,
        },
      }))

      return response.ok({
        success: true,
        movies: formattedMovies,
        pagination: {
          currentPage: page,
          totalPages,
          totalMovies: total,
          moviesPerPage: limit,
          hasNextPage,
          hasPrevPage,
        },
        filters: {
          isWatched: isWatched !== undefined ? (isWatched === 'true' || isWatched === true) : null,
          isBookmarked: isBookmarked !== undefined ? (isBookmarked === 'true' || isBookmarked === true) : null,
        },
      })
    } catch (error) {
      console.error('Error fetching user movies:', error)
      return response.internalServerError({
        success: false,
        error: 'Failed to fetch user movies',
      })
    }
  }


}
