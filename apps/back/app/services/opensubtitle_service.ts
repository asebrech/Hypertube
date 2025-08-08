import axios from "axios";
import env from '#start/env'
import { SubtitleApiResponse, SubtitleResult } from '@hypertube/shared'

export class OpenSubtitleService {
  private apiKey: string | undefined;
  private apiUrl: string | undefined;

  constructor() {
    this.apiKey = env.get('OPENSUBTITLES_API_KEY');
    this.apiUrl = env.get('OPENSUBTITLES_API_URL');
  }

  private async getSomethingFromApi(endpoint: string) {
    const url = `${this.apiUrl}${endpoint}`
    const options = {
      method: 'GET',
      url: url,
      headers: {
        'Api-Key': this.apiKey,
      },
    }
    try {
      const response = await axios(options)
      return response.data
    } catch (error) {
      throw new Error('Failed to fetch data from TMDB. Endpoint : ' + endpoint)
    }
  }

  private async postSomethingToApi(endpoint: string, data: any) {
    const url = `${this.apiUrl}${endpoint}`
    const options = {
      method: 'POST',
      url: url,
      headers: {
        'Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      data: data,
    }
    try {
      const response = await axios(options)
      return response.data
    } catch (error) {
      throw new Error('Failed to post data to TMDB. Endpoint : ' + endpoint)
    }
  }


  public async searchSubtitles(tmdb_id: string, lang: string = 'en'): Promise<SubtitleResult> {
    const endpoint = `/subtitles?tmdb_id=${encodeURIComponent(tmdb_id)}&languages=${encodeURIComponent(lang)}`
    const data: SubtitleApiResponse = await this.getSomethingFromApi(endpoint) as SubtitleApiResponse;
    const subtitle = await data.data.find((item: any) => item.attributes.language === lang && item.attributes.tmdb_id == tmdb_id);
    return subtitle;
  }

  public async downloadSubtitle(file_id: string): Promise<string> {
    const endpoint = `/download`
    const data = {
      file_id: file_id,
    };
    const data: { link: string } = await this.postSomethingToApi(endpoint, data);
    return data.link;
  }

  public async getSubtitleLink(tmdb_id: string, lang: string = 'en'): Promise<string | null> {
    const subtitle = await this.searchSubtitles(tmdb_id, lang);
    if (subtitle) {
      return await this.downloadSubtitle(subtitle.attributes.files[0].file_id.toString());
    }
  }
}
