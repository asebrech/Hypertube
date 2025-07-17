import axios from 'axios'
import env from '#start/env'
import { ImageSizeType, MovieType } from '@hypertube/shared'
import { release } from 'os'

export type ImageSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'w1280' | 'original'

export class TMDBService {
  private apiKey: string | undefined
  private apiUrl: string | undefined

  constructor() {
    this.apiKey = env.get('TMDB_API_KEY')
    this.apiUrl = env.get('TMDB_API_URL')
  }

  private async getSomething(endpoint: string) {
    const url = `${this.apiUrl}${endpoint}`
    const options = {
      method: 'GET',
      url: url,
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
    }
    try {
      const response = await axios(options)
      return response.data
    } catch (error) {
      throw new Error('Failed to fetch data from TMDB. Endpoint : ' + endpoint)
    }
  }

  public async getMovieExternalIMDBId(movieId: number) {
    const endpoint = `/movie/${movieId}/external_ids`
    const data = await this.getSomething(endpoint)
    return data.imdb_id
  }

  public async getGenresList(language: string, movieType: MovieType = 'movie') {
    const endpoint = `/genre/${movieType}/list?language=${language}`
    const data = await this.getSomething(endpoint)
    return data
  }

  public async getPopularMovies(language: string, page: number, movieType: MovieType = 'movie') {
    const endpoint = `/${movieType}/popular?language=${language}&page=${page}&region=${language}`
    const data = await this.getSomething(endpoint)
    return data
  }

  public async getMovieListByGenre(
    genreId: number | undefined,
    castId: number | undefined,
    language: string = 'en',
    page: number = 1,
    movieType: MovieType = 'movie',
    region: string = 'en'
  ) {

    const endpoint = `/discover/${movieType}?with_genres=${genreId || ''}&language=${language}&page=${page}&sort_by=popularity.desc&region=${region}&with_cast=${castId || ''}`
    console.log('TMDBService.getMovieListByGenre endpoint:', endpoint)
    const data = await this.getSomething(endpoint)
    return data
  }

  public async getDiscover(
    genreId: number[] | undefined,
    castId: number[] | undefined,
    language: string = 'en',
    page: number = 1,
    movieType: MovieType = 'movie',
    region: string = 'en',
    releaseYear: string | undefined = undefined,
    sortBy: string = 'popularity.desc'
  ) {

    const endpoint = `/discover/${movieType}?with_genres=${genreId ? genreId?.join(',') : ''}&language=${language}&page=${page}&sort_by=${sortBy}&region=${region}&with_cast=${castId || ''}&primary_release_year=${releaseYear || ''}`
    console.log('TMDBService.getMovieListByGenre endpoint:', endpoint)
    const data = await this.getSomething(endpoint)
    return data
  }

  private getBackdropImageUrlFromData(data: any) {
    if (data.backdrops && data.backdrops.length > 0) {
      return data.backdrops[0]
    }
    // if (data.posters && data.posters.length > 0) {
    //   return data.posters[0].file_path
    // }
    // if (data.logos && data.logos.length > 0) {
    //   return data.logos[0].file_path
    // }
    return null
  }

  private getPosterImageUrlFromData(data: any) {
    if (data.posters && data.posters.length > 0) {
      return data.posters[0]
    }
    return null
  }

  private getLogoImageUrlFromData(data: any) {
    if (data.logos && data.logos.length > 0) {
      return data.logos[0]
    }
    return null
  }

  private getSize(size: ImageSizeType): ImageSize {
    switch (size) {
      case 'small':
        return 'w342'
      case 'medium':
        return 'w500'
      case 'large':
        return 'w780'
      case 'original':
        return 'original'
      default:
        return 'original'
    }
  }

  async getBackdropImageUrl(tmdb_movie_id: number, size: ImageSizeType, lang: string = 'en', movieType: MovieType = 'movie') {
    const endpoint = `/${movieType}/${tmdb_movie_id}/images?language=${lang.split('-')[0]}`
    let langFound = true
    let data = await this.getSomething(endpoint)
    let image = this.getBackdropImageUrlFromData(data)
    if (!image) {
      data = await this.getSomething(`/${movieType}/${tmdb_movie_id}/images?language=en`)
      image = this.getBackdropImageUrlFromData(data)
    }
    if (!image) {
      langFound = false
      data = await this.getSomething(`/${movieType}/${tmdb_movie_id}/images`)
      image = this.getBackdropImageUrlFromData(data)
    }
    if (!image) {
      return null
    }
    return {
      url: `https://image.tmdb.org/t/p/${this.getSize(size)}${image.file_path}`,
      ...image,
      langFound: langFound,
    }
  }

  async getMovieDetails(tmdb_movie_id: number, lang: string = 'en', movieType: MovieType = 'movie') {
    let movie = await this.getSomething(`/${movieType}/${tmdb_movie_id}?language=${lang}`)
    return movie
  }

  async getMovieVideos(tmdb_movie_id: number, lang: string = 'en', movieType: MovieType = 'movie') {
    return this.getSomething(`/${movieType}/${tmdb_movie_id}/videos?language=${lang}`)
  }

  async getPosterImageUrl(tmdb_movie_id: number, size: ImageSizeType, lang: string = 'en', movieType: MovieType = 'movie') {
    const endpoint = `/${movieType}/${tmdb_movie_id}/images?language=${lang.split('-')[0]}`
    let langFound = true
    let data = await this.getSomething(endpoint)
    let image = this.getPosterImageUrlFromData(data)
    if (!image) {
      data = await this.getSomething(`/${movieType}/${tmdb_movie_id}/images?language=en`)
      image = this.getPosterImageUrlFromData(data)
    }
    if (!image) {
      langFound = false
      data = await this.getSomething(`/${movieType}/${tmdb_movie_id}/images`)
      image = this.getPosterImageUrlFromData(data)
    }
    if (!image) {
      return null
    }
    return {
      url: `https://image.tmdb.org/t/p/${this.getSize(size)}${image.file_path}`,
      ...image,
      langFound: langFound,
    }
  }

  async getLogoImageUrl(tmdb_movie_id: number, size: ImageSizeType, lang: string = 'en', movieType: MovieType = 'movie') {
    const endpoint = `/${movieType}/${tmdb_movie_id}/images?language=${lang.split('-')[0]}`
    let langFound = true
    let data = await this.getSomething(endpoint)
    let image = this.getLogoImageUrlFromData(data)
    if (!image) {
      data = await this.getSomething(`/${movieType}/${tmdb_movie_id}/images?language=en`)
      image = this.getLogoImageUrlFromData(data)
    }
    if (!image) {
      langFound = false
      data = await this.getSomething(`/${movieType}/${tmdb_movie_id}/images`)
      image = this.getLogoImageUrlFromData(data)
    }
    if (!image) {
      return null
    }
    return {
      url: `https://image.tmdb.org/t/p/${this.getSize(size)}${image.file_path}`,
      ...image,
      langFound: langFound,
    }
  }

  async getMovieSearch(query: string, language: string = 'en', page: number = 1, movieType: MovieType = 'movie') {
    const endpoint = `/search/${movieType}?query=${encodeURIComponent(query)}&language=${language}&page=${page}`
    const data = await this.getSomething(endpoint)
    return data
  }

  async getMultiSearch(query: string, language: string = 'en', page: number = 1) {
    console.log('TMDBService.getMultiSearch', query, language, page)
    const endpoint = `/search/multi?query=${encodeURIComponent(query)}&language=${language}&page=${page}`
    console.log('TMDBService.getMultiSearch endpoint', endpoint)
    const data = await this.getSomething(endpoint)
    return data
  }
}
