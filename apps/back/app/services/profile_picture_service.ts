import { join } from 'node:path'
import { createWriteStream, existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import app from '@adonisjs/core/services/app'
import { cuid } from '@adonisjs/core/helpers'
import env from '#start/env'
import axios from 'axios'

export default class ProfilePictureService {
  /**
   * Get the uploads directory path
   */
  public getUploadsPath(): string {
    return join(app.makePath(), 'public', 'uploads', 'profiles')
  }

  /**
   * Check if a URL is external (not from our own server)
   */
  private isExternalUrl(url: string): boolean {
    const backUrl = env.get('BACK_URL') || 'http://localhost:3333'
    return !url.startsWith(backUrl)
  }

  /**
   * Download an external image and save it locally
   */
  private async downloadExternalImage(url: string): Promise<string> {
    try {
      const uploadsPath = this.getUploadsPath()
      if (!existsSync(uploadsPath)) {
        await mkdir(uploadsPath, { recursive: true })
      }

      const urlWithoutParams = url.split('?')[0]
      let extension = urlWithoutParams.split('.').pop()?.toLowerCase()
      
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
      if (!extension || !allowedExtensions.includes(extension)) {
        extension = 'jpg'
      }

      const fileName = `${cuid()}.${extension}`
      const filePath = join(uploadsPath, fileName)

      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        timeout: 30000,
        headers: {
          'User-Agent': 'Hypertube/1.0',
        },
      })

      if (response.status !== 200) {
        throw new Error(`Failed to download image: HTTP ${response.status}`)
      }

      const contentType = response.headers['content-type']
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error(`Invalid content type: ${contentType}`)
      }

      const writer = createWriteStream(filePath)
      response.data.pipe(writer)

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          const backUrl = env.get('BACK_URL') || 'http://localhost:3333'
          const publicUrl = `${backUrl}/uploads/profiles/${fileName}`
          resolve(publicUrl)
        })
        writer.on('error', reject)
      })
    } catch (error) {
      // Rethrow the error so callers can handle it explicitly
      throw error;
    }
  }

  /**
   * Process profile picture URL - download if external, return as-is if local
   */
  async processProfilePictureUrl(url: string): Promise<string> {
    if (!url) {
      throw new Error('Profile picture URL is required')
    }

    if (!this.isExternalUrl(url)) {
      return url
    }

    return await this.downloadExternalImage(url)
  }
}
