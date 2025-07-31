import Movie from '#models/movies'
import fs from 'node:fs'
import path from 'node:path'
import { DateTime } from 'luxon'

export interface CleanupResult {
  moviesProcessed: number
  errors: number
  spaceFreed: number
  moviesCleaned: string[]
  errorMessages: string[]
}

export interface CleanupOptions {
  dryRun?: boolean
  daysThreshold?: number
  logProgress?: (message: string) => void
}

export default class MovieCleanupService {
  async cleanupOldMovies(options: CleanupOptions = {}): Promise<CleanupResult> {
    const {
      dryRun = false,
      daysThreshold = 30,
      logProgress = console.log
    } = options

    const cutoffDate = DateTime.now().minus({ days: daysThreshold })
    
    logProgress(`Starting movie cleanup for movies not accessed since ${cutoffDate.toISODate()}`)
    
    if (dryRun) {
      logProgress('DRY RUN MODE - No files will be deleted')
    }

    const result: CleanupResult = {
      moviesProcessed: 0,
      errors: 0,
      spaceFreed: 0,
      moviesCleaned: [],
      errorMessages: []
    }

    try {
      // Find movies that haven't been accessed for the specified number of days
      const moviesToCleanup = await Movie.query()
        .where((query) => {
          query
            .whereNull('last_accessed_at')
            .orWhere('last_accessed_at', '<', cutoffDate.toSQL())
        })
        .andWhere((query) => {
          // Only cleanup movies that have been converted (have video files)
          query
            .where('conversion_status', 'completed')
            .orWhere('resolution_480p_ready', true)
            .orWhere('resolution_720p_ready', true)
            .orWhere('resolution_1080p_ready', true)
        })

      if (moviesToCleanup.length === 0) {
        logProgress('No movies found for cleanup')
        return result
      }

      logProgress(`Found ${moviesToCleanup.length} movies for cleanup`)

      for (const movie of moviesToCleanup) {
        try {
          const movieId = movie.tmdbId
          const movieTitle = movie.title || 'Unknown title'
          
          logProgress(`Processing movie ${movieId} (${movieTitle})`)

          // Calculate space that will be freed
          const hlsPath = path.join(process.cwd(), 'hls-output', movieId.toString())
          const cachePath = path.join(process.cwd(), 'torrent-cache', movieId.toString())
          
          const spaceFreed = await this.calculateDirectorySize(hlsPath) + 
                            await this.calculateDirectorySize(cachePath)

          if (!dryRun) {
            // Safety check: Ensure we're only deleting expected directories
            if (!this.isValidCleanupPath(hlsPath) || !this.isValidCleanupPath(cachePath)) {
              throw new Error(`Invalid cleanup path detected for movie ${movieId}`)
            }

            // Delete HLS output files
            if (fs.existsSync(hlsPath)) {
              fs.rmSync(hlsPath, { recursive: true, force: true })
              logProgress(`✓ Deleted HLS files for movie ${movieId}`)
            }

            // Delete torrent cache
            if (fs.existsSync(cachePath)) {
              fs.rmSync(cachePath, { recursive: true, force: true })
              logProgress(`✓ Deleted cache files for movie ${movieId}`)
            }

            // Update movie status in database
            await this.resetMovieStatus(movie)
            
            logProgress(`✓ Reset movie ${movieId} status in database`)
            result.moviesCleaned.push(`${movieId} (${movieTitle})`)
          } else {
            logProgress(`Would delete ${this.formatBytes(spaceFreed)} for movie ${movieId}`)
            result.moviesCleaned.push(`${movieId} (${movieTitle}) - ${this.formatBytes(spaceFreed)}`)
          }

          result.spaceFreed += spaceFreed
          result.moviesProcessed++

        } catch (error) {
          const errorMessage = `Error processing movie ${movie.tmdbId}: ${error}`
          logProgress(`✗ ${errorMessage}`)
          result.errors++
          result.errorMessages.push(errorMessage)
        }
      }

      logProgress(`Cleanup completed:`)
      logProgress(`- Movies processed: ${result.moviesProcessed}`)
      logProgress(`- Errors: ${result.errors}`)
      logProgress(`- Space ${dryRun ? 'would be freed' : 'freed'}: ${this.formatBytes(result.spaceFreed)}`)

    } catch (error) {
      const errorMessage = `Cleanup failed: ${error}`
      logProgress(`✗ ${errorMessage}`)
      result.errorMessages.push(errorMessage)
      throw error
    }

    return result
  }

  private async resetMovieStatus(movie: Movie): Promise<void> {
    // Reset resolution statuses
    movie.resolution480pReady = false
    movie.resolution720pReady = false
    movie.resolution1080pReady = false
    
    // Reset processing statuses
    movie.conversionStatus = 'pending'
    movie.downloadStatus = 'pending'
    
    // Keep magnet link for potential re-download
    // movie.magicLink = '' // Don't clear this as it helps with re-download
    
    await movie.save()
  }

  private isValidCleanupPath(cleanupPath: string): boolean {
    const normalizedPath = path.normalize(cleanupPath)
    const cwd = process.cwd()
    
    // Ensure the path is within our project directory
    if (!normalizedPath.startsWith(cwd)) {
      return false
    }
    
    // Ensure it's one of our expected directories
    const expectedPaths = [
      path.join(cwd, 'hls-output'),
      path.join(cwd, 'torrent-cache')
    ]
    
    return expectedPaths.some(expectedPath => 
      normalizedPath.startsWith(expectedPath)
    )
  }

  private async calculateDirectorySize(dirPath: string): Promise<number> {
    if (!fs.existsSync(dirPath)) {
      return 0
    }

    let totalSize = 0
    
    try {
      const files = fs.readdirSync(dirPath, { withFileTypes: true })
      
      for (const file of files) {
        const filePath = path.join(dirPath, file.name)
        if (file.isDirectory()) {
          totalSize += await this.calculateDirectorySize(filePath)
        } else {
          const stats = fs.statSync(filePath)
          totalSize += stats.size
        }
      }
    } catch (error) {
      console.warn(`Error calculating directory size for ${dirPath}:`, error)
    }
    
    return totalSize
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  async getCleanupCandidates(daysThreshold: number = 30): Promise<Movie[]> {
    const cutoffDate = DateTime.now().minus({ days: daysThreshold })
    
    return await Movie.query()
      .where((query) => {
        query
          .whereNull('last_accessed_at')
          .orWhere('last_accessed_at', '<', cutoffDate.toSQL())
      })
      .andWhere((query) => {
        // Only select movies that have been converted (have video files)
        query
          .where('conversion_status', 'completed')
          .orWhere('resolution_480p_ready', true)
          .orWhere('resolution_720p_ready', true)
          .orWhere('resolution_1080p_ready', true)
      })
      .orderBy('last_accessed_at', 'asc')
  }
}

