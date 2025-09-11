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
  private tokenExpiry: number = 0
  private lastRequestTime: number = 0
  private readonly MIN_REQUEST_INTERVAL = 50
  private requestQueue: Promise<any> = Promise.resolve()

  constructor() {
    this.apiKey = env.get('OPENSUBTITLES_API_KEY')
    this.apiUrl = env.get('OPENSUBTITLES_API_URL')
    this.username = env.get('OPENSUBTITLES_USERNAME')
    this.password = env.get('OPENSUBTITLES_PASSWORD')
  }

  private async rateLimitDelay(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest))
    }
    this.lastRequestTime = Date.now()
  }

  private async executeWithQueue<T>(operation: () => Promise<T>): Promise<T> {
    this.requestQueue = this.requestQueue.then(async () => {
      await this.rateLimitDelay()
      return operation()
    })
    return this.requestQueue
  }

  private async exponentialBackoff(attempt: number, error: any): Promise<void> {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after']
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 2000
      await new Promise(resolve => setTimeout(resolve, delay))
    } else if (error.response?.status >= 500) {
      const delay = Math.min(Math.pow(2, attempt) * 1000, 30000)
      await new Promise(resolve => setTimeout(resolve, delay))
    } else {
      const delay = Math.min(Math.pow(2, attempt) * 500, 5000)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  private async executeWithRetry<T>(operation: () => Promise<T>, maxRetries: number = 3): Promise<T> {
    let lastError: any
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          await this.exponentialBackoff(attempt - 1, lastError)
        }
        
        return await operation()
      } catch (error: any) {
        lastError = error
        
        // Don't retry on authentication errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          if (error.response?.status === 401) {
            this.userToken = undefined
            this.tokenExpiry = 0
          }
          throw error
        }
        
        // Don't retry on bad requests
        if (error.response?.status === 400 || error.response?.status === 404) {
          throw error
        }
        
        if (attempt === maxRetries) {
          throw error
        }
      }
    }
    
    throw lastError
  }

  private isTokenValid(): boolean {
    return this.userToken !== undefined && Date.now() < this.tokenExpiry
  }

  private async login(): Promise<void> {
    if (this.isTokenValid()) {
      return
    }

    const operation = async () => {
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

      const response = await axios(options)
      this.userToken = response.data.token
      this.tokenExpiry = Date.now() + 23 * 60 * 60 * 1000
      return response.data
    }

    return this.executeWithQueue(() => this.executeWithRetry(operation))
  }

  private async getSomethingFromApi(endpoint: string) {
    const operation = async () => {
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
      
      const response = await axios(options)
      return response.data
    }

    return this.executeWithQueue(() => this.executeWithRetry(operation))
  }

  private async postSomethingToApi(endpoint: string, data: any) {
    await this.login()

    const operation = async () => {
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

      const response = await axios(options)
      return response.data
    }

    return this.executeWithQueue(() => this.executeWithRetry(operation, 5))
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
    const subtitle = data.data.find(
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
      if (error.response?.status === 429) {
        throw new Error('OpenSubtitles API rate limit exceeded. Please wait before trying again.')
      }
      if (error.response?.status === 503 || error.message.includes('Status: 503')) {
        throw new Error(
          'OpenSubtitles API is temporarily unavailable due to high traffic or maintenance. Please try again later.'
        )
      }
      throw error
    }
  }

  public async getSubtitleLink(tmdb_id: string, lang: string = 'en'): Promise<string | null> {
    const subtitle = await this.searchSubtitles(tmdb_id, lang)
    if (subtitle && subtitle.attributes.files && subtitle.attributes.files.length > 0) {
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
    if (subtitle && subtitle.attributes.files && subtitle.attributes.files.length > 0) {
      return await this.downloadSubtitle(subtitle.attributes.files[0].file_id, options)
    }
    return null
  }
}
