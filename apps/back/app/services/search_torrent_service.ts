import TorrentSearchApi from 'torrent-search-api'
import { TMDBService } from './tmdb_service.js'

export type VideoQuality = '1080p' | '720p' | '480p' | '0'

export const VideoQualityOrder: VideoQuality[] = ['1080p', '720p', '480p', '0']

export function compareVideoQuality(a: VideoQuality, b: VideoQuality): number {
  return VideoQualityOrder.indexOf(a) - VideoQualityOrder.indexOf(b)
}

export default class SearchTorrentService {
  private tmdbService: TMDBService = new TMDBService()
  async search(
    tmdbId: number,
    category: string = 'All',
    limit: number = 100
  ): Promise<{ magnetLink: string; resolution: VideoQuality } | null> {
    TorrentSearchApi.disableAllProviders()
    TorrentSearchApi.enableProvider('Yts')
    TorrentSearchApi.enableProvider('ThePirateBay')

    const imdbId = await this.tmdbService.getMovieExternalIMDBId(tmdbId)

    // If no IMDB ID, can't search for torrents
    if (!imdbId) {
      return null
    }

    const torrents = await TorrentSearchApi.search(imdbId, category, limit)
    let bestTorrent = null
    let currentResolution: VideoQuality = '0'
    for (const torrent of torrents) {
      if (torrent.title.includes('1080p')) {
        currentResolution = '1080p'
        bestTorrent = torrent
        break
      }
      if (torrent.title.includes('720p') && compareVideoQuality(currentResolution, '720p') > 0) {
        currentResolution = '720p'
        bestTorrent = torrent
        continue
      }
      if (torrent.title.includes('480p') && compareVideoQuality(currentResolution, '480p') > 0) {
        currentResolution = '480p'
        bestTorrent = torrent
        continue
      }
    }
    if (bestTorrent)
      return {
        magnetLink: await TorrentSearchApi.getMagnet(bestTorrent),
        resolution: currentResolution,
      }
    else return null
  }

  /**
   * Checks if a suitable torrent is available for the given TMDB movie ID.
   * Searches for torrents matching the specified category and limit, and determines
   * if a torrent with at least 480p, 720p, or 1080p resolution exists.
   *
   * @param {number} tmdbId - The TMDB movie ID to search for.
   * @param {string} [category='All'] - The category to filter torrents by (default is 'All').
   * @param {number} [limit=100] - The maximum number of torrents to search (default is 100).
   * @returns {Promise<boolean>} - Resolves to true if a suitable torrent is found, otherwise false.
   */
  async isAvailable(tmdbId: number, category: string = 'All', limit: number = 100) {
    try {
      TorrentSearchApi.disableAllProviders()
      TorrentSearchApi.enableProvider('Yts')
      TorrentSearchApi.enableProvider('ThePirateBay')

      const imdbId = await this.tmdbService.getMovieExternalIMDBId(tmdbId)

      // If no IMDB ID, can't search for torrents
      if (!imdbId) {
        return false
      }

      const torrents = await TorrentSearchApi.search(imdbId, category, limit)
      let torrentExist = false
      let currentResolution: VideoQuality = '0'
      for (const torrent of torrents) {
        if (torrent.title.includes('1080p')) {
          currentResolution = '1080p'
          torrentExist = true
          break
        }
        if (torrent.title.includes('720p') && compareVideoQuality(currentResolution, '720p') > 0) {
          currentResolution = '720p'
          torrentExist = true
          break
        }
        if (torrent.title.includes('480p') && compareVideoQuality(currentResolution, '480p') > 0) {
          currentResolution = '480p'
          torrentExist = true
          break
        }
      }
      return torrentExist
    } catch {
      return false
    }
  }
}
