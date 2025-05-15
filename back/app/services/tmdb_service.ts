import axios from 'axios'
import env from '#start/env'


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
    const endpoint = `/movie/popular?language=${language}&page=${page}`
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
    if (data.posters && data.posters.length > 0) {
      return data.posters[0].file_path
    }
    if (data.logos && data.logos.length > 0) {
      return data.logos[0].file_path
    }
    return null
  }

  async getBackdropImageUrl(tmdb_movie_id: number, lang: string = 'en') {
    let langageFound = true
    const endpoint = `/movie/${tmdb_movie_id}/images?language=${lang.split('-')[0]}`
    let data = await this.getSomething(endpoint)
    let imageUrl = this.getBackdropImageUrlFromData(data)
    if (!imageUrl) {
      langageFound = false
      console.log('No image found, trying without language', endpoint)
      data = await this.getSomething(`/movie/${tmdb_movie_id}/images`)
      imageUrl = this.getBackdropImageUrlFromData(data)
    }
    return {url : `https://image.tmdb.org/t/p/original${imageUrl}`, langageFound: langageFound}
  }
}
