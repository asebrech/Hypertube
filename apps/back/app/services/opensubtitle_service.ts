import axios from 'axios'
import env from '#start/env'
import {
  SubtitleApiResponse,
  SubtitleResult,
  SubtitleDownloadRequest,
  SubtitleDownloadResponse,
} from '@hypertube/shared'

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
        'Accept': '*/*',
        'User-Agent': 'HypertubeApp v1.0',
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
        console.error('Login error response:', {
          status: error.response.status,
          data: error.response.data,
        })
        throw new Error(
          `Failed to login to OpenSubtitles API: ${error.response.status} - ${JSON.stringify(
            error.response.data
          )}`
        )
      } else if (error.request) {
        console.error('Login error request:', error.request)
        throw new Error('Failed to login to OpenSubtitles API: No response received')
      } else {
        console.error('Login error:', error.message)
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
        'Accept': '*/*',
        'User-Agent': 'HypertubeApp v1.0',
      },
    }
    try {
      const response = await axios(options)
      return response.data
    } catch (error: any) {
      if (error.response) {
        throw new Error(
          `Failed to fetch data from OpenSubtitleApi. Endpoint: ${endpoint}, Status: ${error.response.status}, Response: ${JSON.stringify(error.response.data)}`
        )
      } else if (error.request) {
        throw new Error(
          `Failed to fetch data from OpenSubtitleApi. Endpoint: ${endpoint}, No response received`
        )
      } else {
        throw new Error(
          `Failed to fetch data from OpenSubtitleApi. Endpoint: ${endpoint}, Error: ${error.message}`
        )
      }
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
        'Accept': '*/*',
        'User-Agent': 'HypertubeApp v1.0',
      },
      data: data,
    }

    const maxRetries = 3
    let retryCount = 0

    while (retryCount < maxRetries) {
      try {
        const response = await axios(options)
        return response.data
      } catch (error: any) {
        if (error.response) {
          if (error.response.status === 503 && retryCount < maxRetries - 1) {
            retryCount++
            const waitTime = retryCount * 2000 // 2s, 4s, 6s
            await new Promise((resolve) => setTimeout(resolve, waitTime))
            continue
          }

          throw new Error(
            `Failed to post data to OpenSubtitleApi. Endpoint: ${endpoint}, Status: ${error.response.status}, Response: ${JSON.stringify(error.response.data)}`
          )
        } else if (error.request) {
          throw new Error(
            `Failed to post data to OpenSubtitleApi. Endpoint: ${endpoint}, No response received`
          )
        } else {
          throw new Error(
            `Failed to post data to OpenSubtitleApi. Endpoint: ${endpoint}, Error: ${error.message}`
          )
        }
      }
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
        item.attributes.language === lang &&
        item.attributes.feature_details.tmdb_id === Number(tmdb_id)
    )
    return subtitle
  }

  public async downloadSubtitle(
    file_id: number,
    options?: Omit<SubtitleDownloadRequest, 'file_id'>
  ): Promise<SubtitleDownloadResponse> {
    const endpoint = `/download`
    const data: SubtitleDownloadRequest = {
      file_id,
      ...options,
    }

    try {
      const response: SubtitleDownloadResponse = await this.postSomethingToApi(endpoint, data)
      return response
    } catch (error: any) {
      if (error.message.includes('Status: 503')) {
        throw new Error(
          'OpenSubtitles API is temporarily unavailable due to high traffic or maintenance. Please try again later.'
        )
      }
      throw error
    }
  }

  public async getSubtitleLink(tmdb_id: string, lang: string = 'en'): Promise<string | null> {
    const subtitle = await this.searchSubtitles(tmdb_id, lang)
    if (subtitle) {
      const downloadResponse = await this.downloadSubtitle(subtitle.attributes.files[0].file_id)
      return downloadResponse.link
    }
    return null
  }

  public async getSubtitleDownloadInfo(
    tmdb_id: string,
    lang: string = 'en',
    options?: Omit<SubtitleDownloadRequest, 'file_id'>
  ): Promise<SubtitleDownloadResponse | null> {
    const subtitle = await this.searchSubtitles(tmdb_id, lang)
    if (subtitle) {
      return await this.downloadSubtitle(subtitle.attributes.files[0].file_id, options)
    }
    return null
  }
}
