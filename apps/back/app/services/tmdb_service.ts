import axios from 'axios'
import env from '#start/env'

export type ImageSize =
  | 'w92'
  | 'w154'
  | 'w185'
  | 'w342'
  | 'w500'
  | 'w780'
  | 'w1280'
  | 'original';

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
      console.error(`Error fetching data from TMDB. URL: ${url}, Error:`, error)
      throw new Error('Failed to fetch data from TMDB')
    }
  }

  public async getMovieExternalIMDBId(movieId: number) {
      const endpoint = `/movie/${movieId}/external_ids`
      const data = await this.getSomething(endpoint)
      return data.imdb_id
  }

  public async getGenresList(language: string) {
    const endpoint = `/genre/movie/list?language=${language}`
    const data = await this.getSomething(endpoint)
    return data
  }

  public async getPopularMovies(language: string, page: number) {
    const endpoint = `/movie/popular?language=${language}&page=${page}&region=${language}`
    const data = await this.getSomething(endpoint)
    return data
  }

  public async getMovieListByGenre(
    genreId: number,
    language: string = 'en',
    page: number = 1,
    region: string = 'en'
  ) {
    const endpoint = `/discover/movie?with_genres=${genreId}&language=${language}&page=${page}&sort_by=popularity.desc&region=${region}`
    const data = await this.getSomething(endpoint)
    return data
  }

  private getBackdropImageUrlFromData(data: any) {
    if (data.backdrops && data.backdrops.length > 0) {
      return data.backdrops[0].file_path
    }
    // if (data.posters && data.posters.length > 0) {
    //   return data.posters[0].file_path
    // }
    // if (data.logos && data.logos.length > 0) {
    //   return data.logos[0].file_path
    // }
    return null
  }

  private getSize(size: string) : ImageSize {
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
  }}

  async getBackdropImageUrl(tmdb_movie_id: number, size: string, lang: string = 'en') {
    const endpoint = `/movie/${tmdb_movie_id}/images?language=${lang.split('-')[0]}`
    let langFound = true
    let data = await this.getSomething(endpoint)
    let imageUrl = this.getBackdropImageUrlFromData(data)
    if (!imageUrl) {
      data = await this.getSomething(`/movie/${tmdb_movie_id}/images?language=en`)
      imageUrl = this.getBackdropImageUrlFromData(data)
    }
    if (!imageUrl) {
      langFound = false
      data = await this.getSomething(`/movie/${tmdb_movie_id}/images`)
      imageUrl = this.getBackdropImageUrlFromData(data)
    }
    return {url: `https://image.tmdb.org/t/p/${this.getSize(size)}${imageUrl}`, langFound: langFound}
  }

  async getMovieDetails(tmdb_movie_id: number, lang: string = 'en') {
    return this.getSomething(`/movie/${tmdb_movie_id}?language=${lang}`)
  }

  async getMovieVideos(tmdb_movie_id: number, lang: string = 'en') {
    return this.getSomething(`/movie/${tmdb_movie_id}/videos?language=${lang}`)
  }
}
