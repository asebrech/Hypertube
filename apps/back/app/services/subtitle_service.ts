import { join } from 'node:path'
import { createWriteStream, existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import app from '@adonisjs/core/services/app'
import axios from 'axios'
import { OpenSubtitleService } from '#services/opensubtitle_service'
import { inject } from '@adonisjs/core'

@inject()
export default class SubtitleService {
  constructor(private openSubtitleService: OpenSubtitleService) {}

  private getSubtitlesPath(tmdbId: number): string {
    return join(app.makePath(), 'hls-output', tmdbId.toString(), 'subtitles')
  }

  private getSubtitleFilePath(tmdbId: number, language: string): string {
    return join(this.getSubtitlesPath(tmdbId), `${language}.srt`)
  }

  async subtitleExists(tmdbId: number, language: string): Promise<boolean> {
    const filePath = this.getSubtitleFilePath(tmdbId, language)
    return existsSync(filePath)
  }

  private async ensureSubtitlesDirectory(tmdbId: number): Promise<void> {
    const subtitlesPath = this.getSubtitlesPath(tmdbId)
    if (!existsSync(subtitlesPath)) {
      await mkdir(subtitlesPath, { recursive: true })
    }
  }

  async downloadAndSaveSubtitle(
    tmdbId: number,
    language: string = 'en'
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      if (await this.subtitleExists(tmdbId, language)) {
        return {
          success: true,
          filePath: this.getSubtitleFilePath(tmdbId, language),
        }
      }

      const downloadInfo = await this.openSubtitleService.getSubtitleDownloadInfo(
        tmdbId.toString(),
        language
      )

      if (!downloadInfo) {
        return {
          success: false,
          error: `No subtitle found for tmdbId: ${tmdbId}, language: ${language}`,
        }
      }

      await this.ensureSubtitlesDirectory(tmdbId)

      const response = await axios({
        method: 'GET',
        url: downloadInfo.link,
        responseType: 'stream',
        timeout: 30000,
      })

      const filePath = this.getSubtitleFilePath(tmdbId, language)
      const writer = createWriteStream(filePath)

      response.data.pipe(writer)

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          resolve({
            success: true,
            filePath: filePath,
          })
        })

        writer.on('error', (error) => {
          reject({
            success: false,
            error: `Failed to write subtitle file: ${error.message}`,
          })
        })
      })
    } catch (error: any) {
      console.error('Error downloading subtitle:', error)
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
      }
    }
  }

  async downloadMultipleSubtitles(
    tmdbId: number,
    languages: string[] = ['en', 'fr', 'es']
  ): Promise<{
    success: boolean
    results: Array<{ language: string; success: boolean; filePath?: string; error?: string }>
  }> {
    const results = await Promise.allSettled(
      languages.map(async (lang) => {
        const result = await this.downloadAndSaveSubtitle(tmdbId, lang)
        return { language: lang, ...result }
      })
    )

    const processedResults = results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          language: 'unknown',
          success: false,
          error: result.reason,
        }
      }
    })

    const successCount = processedResults.filter((r) => r.success).length

    return {
      success: successCount > 0,
      results: processedResults,
    }
  }

  async getAvailableSubtitles(tmdbId: number): Promise<string[]> {
    try {
      const subtitlesPath = this.getSubtitlesPath(tmdbId)

      if (!existsSync(subtitlesPath)) {
        return []
      }

      const fs = await import('node:fs/promises')
      const files = await fs.readdir(subtitlesPath)

      return files.filter((file) => file.endsWith('.srt')).map((file) => file.replace('.srt', ''))
    } catch (error) {
      console.error('Error getting available subtitles:', error)
      return []
    }
  }

  async deleteSubtitle(tmdbId: number, language: string): Promise<boolean> {
    try {
      const filePath = this.getSubtitleFilePath(tmdbId, language)

      if (!existsSync(filePath)) {
        return true
      }

      const fs = await import('node:fs/promises')
      await fs.unlink(filePath)
      return true
    } catch (error) {
      console.error('Error deleting subtitle:', error)
      return false
    }
  }

  async deleteAllSubtitles(tmdbId: number): Promise<boolean> {
    try {
      const subtitlesPath = this.getSubtitlesPath(tmdbId)

      if (!existsSync(subtitlesPath)) {
        return true
      }

      const fs = await import('node:fs/promises')
      await fs.rm(subtitlesPath, { recursive: true, force: true })
      return true
    } catch (error) {
      console.error('Error deleting all subtitles:', error)
      return false
    }
  }
}
