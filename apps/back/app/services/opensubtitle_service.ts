import axios from "axios";
import env from '#start/env'

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


  public async searchSubtitles(tmdb_id: string, lang: string = 'en'): Promise<any> {
    const endpoint = `/subtitles?tmdb_id=${encodeURIComponent(tmdb_id)}&languages=${encodeURIComponent(lang)}`
  }
}
