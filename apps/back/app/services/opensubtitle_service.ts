import axios from 'axios'
import env from '#start/env'
import { SubtitleApiResponse, SubtitleResult } from '@hypertube/shared'

export class OpenSubtitleService {
  private apiKey: string | undefined
  private apiUrl: string | undefined
  private username: string | undefined
  private password: string | undefined
  private userToken: string | undefined

  constructor() {
    this.apiKey = env.get('OPENSUBTITLES_API_KEY')
    this.apiUrl = env.get('OPENSUBTITLES_API_URL')
    this.username = env.get('OPENSUBTITLES_USERNAME')
    this.password = env.get('OPENSUBTITLES_PASSWORD')
  }

  private async login(): Promise<void> {
    if (this.userToken) {
      return
    }

    const url = `${this.apiUrl}/login`
    const options = {
      method: 'POST',
      url: url,
      headers: {
        'Api-Key': this.apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'HypertubeLaBoiteDeCarton/1.0',
      },
      data: {
        username: this.username,
        password: this.password,
      },
    }

    try {
      const response = await axios(options)
      this.userToken = response.data.token
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Failed to login to OpenSubtitles API: ${error.response.status} - ${JSON.stringify(
            error.response.data
          )}`
        )
      } else if (error.request) {
        throw new Error('Failed to login to OpenSubtitles API: No response received')
      } else {
        throw new Error(`Failed to login to OpenSubtitles API: ${error.message}`)
      }
    }
  }

  private async getSomethingFromApi(endpoint: string) {
    const url = `${this.apiUrl}${endpoint}`
    const options = {
      method: 'GET',
      url: url,
      headers: {
        'Api-Key': this.apiKey,
        'User-Agent': 'HypertubeLaBoiteDeCarton/1.0',
      },
    }
    try {
      const response = await axios(options)
      return response.data
    } catch (error) {
      throw new Error('Failed to fetch data from OpenSubtitleApi. Endpoint : ' + endpoint)
    }
  }
  private async postSomethingToApi(endpoint: string, data: any) {
    await this.login()

    const url = `${this.apiUrl}${endpoint}`
    const options = {
      method: 'POST',
      url: url,
      headers: {
        'Api-Key': this.apiKey,
        'Authorization': `Bearer ${this.userToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'HypertubeLaBoiteDeCarton/1.0',
      },
      data: data,
    }
    try {
      const response = await axios(options)
      return response.data
    } catch (error) {
      throw new Error('Failed to post data to OpenSubtitleApi. Endpoint : ' + endpoint)
    }
  }

  public async getAllSubtitles(tmdb_id: string): Promise<SubtitleResult[]> {
    const endpoint = `/subtitles?tmdb_id=${encodeURIComponent(tmdb_id)}`
    const data: SubtitleApiResponse = (await this.getSomethingFromApi(
      endpoint
    )) as SubtitleApiResponse
    const uniqueSubtitlesPerLanguage = new Map<string, SubtitleResult>()
    data.data.forEach((subtitle: SubtitleResult) => {
      const lang = subtitle.attributes.language
      if (!uniqueSubtitlesPerLanguage.has(lang)) {
        uniqueSubtitlesPerLanguage.set(lang, subtitle)
      }
    })
    return Array.from(uniqueSubtitlesPerLanguage.values())
  }

  public async searchSubtitles(tmdb_id: string, lang: string = 'en'): Promise<SubtitleResult> {
    const endpoint = `/subtitles?tmdb_id=${encodeURIComponent(
      tmdb_id
    )}&languages=${encodeURIComponent(lang)}`
    const data: SubtitleApiResponse = (await this.getSomethingFromApi(
      endpoint
    )) as SubtitleApiResponse
    const subtitle = await data.data.find(
      (item: any) =>
        item.attributes.language === lang && item.attributes.feature_details.tmdb_id === tmdb_id
    )
    return subtitle
  }

  public async downloadSubtitle(file_id: string): Promise<string> {
    const endpoint = `/download`
    const data = {
      file_id: file_id,
    }
    const data2: { link: string } = await this.postSomethingToApi(endpoint, data)
    return data2.link
  }

  public async getSubtitleLink(tmdb_id: string, lang: string = 'en'): Promise<string | null> {
    const subtitle = await this.searchSubtitles(tmdb_id, lang)
    if (subtitle) {
      return await this.downloadSubtitle(subtitle.attributes.files[0].file_id.toString())
    }
  }
}
