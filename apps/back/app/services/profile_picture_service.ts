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
      // Make sure uploads directory exists
      const uploadsPath = this.getUploadsPath()
      if (!existsSync(uploadsPath)) {
        await mkdir(uploadsPath, { recursive: true })
      }

      // Get file extension from URL or default to jpg
      const urlWithoutParams = url.split('?')[0] // Remove query parameters
      let extension = urlWithoutParams.split('.').pop()?.toLowerCase()
      
      // Validate and normalize extension
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
      if (!extension || !allowedExtensions.includes(extension)) {
        extension = 'jpg' // Default to jpg if no valid extension found
      }

      // Generate unique filename
      const fileName = `${cuid()}.${extension}`
      const filePath = join(uploadsPath, fileName)

      // Download the image
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        timeout: 30000, // 30 second timeout
        headers: {
          'User-Agent': 'Hypertube/1.0',
        },
      })

      // Check if response is valid
      if (response.status !== 200) {
        throw new Error(`Failed to download image: HTTP ${response.status}`)
      }

      // Check content type
      const contentType = response.headers['content-type']
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error(`Invalid content type: ${contentType}`)
      }

      // Save the image
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
      console.error('Failed to download external profile picture:', error)
      throw new Error('Failed to download external profile picture')
    }
  }

  /**
   * Process profile picture URL - download if external, return as-is if local
   */
  async processProfilePictureUrl(url: string): Promise<string> {
    if (!url) {
      throw new Error('Profile picture URL is required')
    }

    // If it's already a local URL, return as-is
    if (!this.isExternalUrl(url)) {
      return url
    }

    // Download external image and return local URL
    return await this.downloadExternalImage(url)
  }
}
