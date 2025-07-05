import TorrentSearchApi from 'torrent-search-api'
import { TMDBService } from './tmdb_service.js'

export type VideoQuality = '1080p' | '720p' | '480p' | '0'

export const VideoQualityOrder: VideoQuality[] = ['1080p', '720p', '480p', '0']

export function compareVideoQuality(a: VideoQuality, b: VideoQuality): number {
    return VideoQualityOrder.indexOf(a) - VideoQualityOrder.indexOf(b)
}

export default class SearchTorrentService {
    private tmdbService: TMDBService = new TMDBService()
  async search(tmdbId: number, category: string = 'All', limit: number = 100) {
    TorrentSearchApi.disableAllProviders()
    TorrentSearchApi.enableProvider('Yts')
    TorrentSearchApi.enableProvider('ThePirateBay')

    const imdbId = await this.tmdbService.getMovieExternalIMDBId(tmdbId)

    const torrents = await TorrentSearchApi.search(imdbId, category, limit)
    let bestTorrent = null 
    let currentResolution: VideoQuality = '0'
    for (const torrent of torrents) {
        if (torrent.title.includes('1080p')) {
            currentResolution = '1080p'
            bestTorrent = torrent
            break;
        }
        if (torrent.title.includes('720p') && !compareVideoQuality(currentResolution, '720p')) {
            currentResolution = '720p'
            bestTorrent = torrent
            continue;
        }
        if (torrent.title.includes('480p') && !compareVideoQuality(currentResolution, '480p')) {
            currentResolution = '480p'
            bestTorrent = torrent
            continue;
        }
    }
    if (bestTorrent)
        return {magnetLink: await TorrentSearchApi.getMagnet(bestTorrent), resolution: currentResolution}
    else
        throw new Error('No suitable torrent found')  
  }
}