import Movie from '#models/movies'
import fs from 'node:fs'
import path from 'node:path'
import { DateTime } from 'luxon'
import { formatBytes, isValidTmdbId } from '../utils/format.js'

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
    const { dryRun = false, daysThreshold = 30, logProgress = console.log } = options
    const cutoffDate = DateTime.now().minus({ days: daysThreshold })

    logProgress(`Starting cleanup for movies not accessed since ${cutoffDate.toISODate()}`)
    if (dryRun) logProgress('DRY RUN MODE - No files will be deleted')

    const result: CleanupResult = {
      moviesProcessed: 0,
      errors: 0,
      spaceFreed: 0,
      moviesCleaned: [],
      errorMessages: [],
    }

    try {
      const moviesToCleanup = await this.getCleanupCandidates(daysThreshold)

      if (moviesToCleanup.length === 0) {
        logProgress('No movies found for cleanup')
        return result
      }

      logProgress(`Found ${moviesToCleanup.length} movies for cleanup`)

      for (const movie of moviesToCleanup) {
        try {
          const movieId = movie.tmdbId
          const movieTitle = movie.title || 'Unknown title'

          if (!isValidTmdbId(movieId)) {
            throw new Error(`Invalid tmdbId: ${movieId}`)
          }

          const hlsPath = path.join(process.cwd(), 'hls-output', movieId.toString())
          const cachePath = path.join(process.cwd(), 'torrent-cache', movieId.toString())

          const spaceFreed =
            (await this.calculateDirectorySize(hlsPath)) +
            (await this.calculateDirectorySize(cachePath))

          if (!dryRun) {
            if (!this.isValidCleanupPath(hlsPath) || !this.isValidCleanupPath(cachePath)) {
              throw new Error(`Invalid cleanup path detected for movie ${movieId}`)
            }

            if (fs.existsSync(hlsPath)) {
              try {
                fs.rmSync(hlsPath, { recursive: true })
              } catch (error) {
                throw new Error(`Failed to remove HLS directory ${hlsPath}: ${error}`)
              }
            }

            if (fs.existsSync(cachePath)) {
              try {
                fs.rmSync(cachePath, { recursive: true })
              } catch (error) {
                throw new Error(`Failed to remove cache directory ${cachePath}: ${error}`)
              }
            }

            await this.resetMovieStatus(movie)
            result.moviesCleaned.push(`${movieId} (${movieTitle})`)
          } else {
            result.moviesCleaned.push(`${movieId} (${movieTitle}) - ${formatBytes(spaceFreed)}`)
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

      logProgress(`Cleanup completed: ${result.moviesProcessed} processed, ${result.errors} errors`)
      logProgress(`Space ${dryRun ? 'would be freed' : 'freed'}: ${formatBytes(result.spaceFreed)}`)
    } catch (error) {
      const errorMessage = `Cleanup failed: ${error}`
      result.errorMessages.push(errorMessage)
      throw error
    }

    return result
  }

  async getCleanupCandidates(daysThreshold: number = 30): Promise<Movie[]> {
    const cutoffDate = DateTime.now().minus({ days: daysThreshold })

    return await Movie.query()
      .where('last_accessed_at', '<', cutoffDate.toSQL())
      .orderBy('last_accessed_at', 'asc')
  }

  private async resetMovieStatus(movie: Movie): Promise<void> {
    movie.resolution480pReady = false
    movie.resolution720pReady = false
    movie.resolution1080pReady = false
    movie.conversionStatus = 'pending'
    movie.downloadStatus = 'pending'
    movie.lastAccessedAt = null
    await movie.save()
  }

  private isValidCleanupPath(cleanupPath: string): boolean {
    const normalizedPath = path.normalize(cleanupPath)
    const cwd = process.cwd()

    if (!normalizedPath.startsWith(cwd)) return false

    const expectedPaths = [path.join(cwd, 'hls-output'), path.join(cwd, 'torrent-cache')]

    return expectedPaths.some((expectedPath) => normalizedPath.startsWith(expectedPath))
  }

  private async calculateDirectorySize(dirPath: string): Promise<number> {
    if (!fs.existsSync(dirPath)) return 0

    let totalSize = 0

    try {
      const files = fs.readdirSync(dirPath, { withFileTypes: true })

      for (const file of files) {
        const filePath = path.join(dirPath, file.name)
        if (file.isDirectory()) {
          totalSize += await this.calculateDirectorySize(filePath)
        } else {
          totalSize += fs.statSync(filePath).size
        }
      }
    } catch (error) {
      console.warn(`Error calculating directory size for ${dirPath}:`, error)
    }

    return totalSize
  }

  async deleteMovie(tmdbId: number): Promise<{
    success: boolean
    message: string
    spaceFreed: number
    error?: string
  }> {
    try {
      if (!isValidTmdbId(tmdbId)) {
        return {
          success: false,
          message: 'Invalid movie ID',
          spaceFreed: 0,
          error: `Invalid tmdbId: ${tmdbId}`,
        }
      }

      const movie = await Movie.query().where('tmdbId', tmdbId).first()

      if (!movie) {
        return {
          success: false,
          message: 'Movie not found',
          spaceFreed: 0,
          error: 'Movie with this TMDB ID does not exist',
        }
      }

      if (movie.conversionStatus === 'converting' || movie.downloadStatus === 'downloading') {
        return {
          success: false,
          message: 'Cannot delete movie during processing',
          spaceFreed: 0,
          error: `Movie is currently ${movie.conversionStatus === 'converting' ? 'being converted' : 'downloading'}. Please wait for the process to complete before deleting.`,
        }
      }

      const result = await this.deleteSingleMovie(movie)
      const movieTitle = movie.title || 'Unknown title'

      if (result.success) {
        return {
          success: true,
          message: `Movie "${movieTitle}" (ID: ${tmdbId}) has been successfully deleted`,
          spaceFreed: result.spaceFreed,
        }
      } else {
        return {
          success: false,
          message: 'Failed to delete movie',
          spaceFreed: 0,
          error: result.error,
        }
      }
    } catch (error) {
      const errorMessage = `Failed to delete movie ${tmdbId}: ${error}`
      console.error(errorMessage)
      return {
        success: false,
        message: 'Failed to delete movie',
        spaceFreed: 0,
        error: errorMessage,
      }
    }
  }

  async deleteAllMovies(): Promise<{
    success: boolean
    message: string
    moviesDeleted: number
    spaceFreed: number
    errors: number
    errorMessages: string[]
  }> {
    try {
      const allMovies = await Movie.all()

      if (allMovies.length === 0) {
        return {
          success: true,
          message: 'No movies found to delete',
          moviesDeleted: 0,
          spaceFreed: 0,
          errors: 0,
          errorMessages: [],
        }
      }

      const result = {
        success: true,
        message: '',
        moviesDeleted: 0,
        spaceFreed: 0,
        errors: 0,
        errorMessages: [] as string[],
      }

      console.log(`Starting deletion of ${allMovies.length} movies`)

      for (const movie of allMovies) {
        if (movie.conversionStatus === 'converting' || movie.downloadStatus === 'downloading') {
          console.log(
            `Skipping movie ${movie.tmdbId} (${movie.title || 'Unknown title'}) - currently ${movie.conversionStatus === 'converting' ? 'converting' : 'downloading'}`
          )
          result.errors++
          result.errorMessages.push(`Movie ${movie.tmdbId} skipped - currently being processed`)
          continue
        }

        const deleteResult = await this.deleteSingleMovie(movie)

        if (deleteResult.success) {
          result.moviesDeleted++
          result.spaceFreed += deleteResult.spaceFreed
          console.log(`Deleted movie ${movie.tmdbId} (${movie.title || 'Unknown title'})`)
        } else {
          result.errors++
          result.errorMessages.push(deleteResult.error || `Unknown error for movie ${movie.tmdbId}`)
        }
      }

      if (result.errors > 0) {
        result.message = `Deleted ${result.moviesDeleted} movies with ${result.errors} errors`
      } else {
        result.message = `Successfully deleted all ${result.moviesDeleted} movies`
      }

      console.log(`Deletion completed: ${result.moviesDeleted} deleted, ${result.errors} errors`)
      return result
    } catch (error) {
      console.error('Failed to delete all movies:', error)
      return {
        success: false,
        message: 'Failed to delete all movies',
        moviesDeleted: 0,
        spaceFreed: 0,
        errors: 1,
        errorMessages: [error instanceof Error ? error.message : 'Unknown error'],
      }
    }
  }

  private async deleteSingleMovie(movie: Movie): Promise<{
    success: boolean
    spaceFreed: number
    error?: string
  }> {
    try {
      const tmdbId = movie.tmdbId
      
      if (!isValidTmdbId(tmdbId)) {
        throw new Error(`Invalid tmdbId: ${tmdbId}`)
      }

      if (movie.conversionStatus === 'converting' || movie.downloadStatus === 'downloading') {
        throw new Error(
          `Cannot delete movie ${tmdbId} - currently ${movie.conversionStatus === 'converting' ? 'converting' : 'downloading'}`
        )
      }

      const hlsPath = path.join(process.cwd(), 'hls-output', tmdbId.toString())
      const cachePath = path.join(process.cwd(), 'torrent-cache', tmdbId.toString())

      const spaceFreed =
        (await this.calculateDirectorySize(hlsPath)) +
        (await this.calculateDirectorySize(cachePath))

      if (!this.isValidCleanupPath(hlsPath) || !this.isValidCleanupPath(cachePath)) {
        throw new Error(`Invalid cleanup path detected for movie ${tmdbId}`)
      }

      if (fs.existsSync(hlsPath)) {
        try {
          fs.rmSync(hlsPath, { recursive: true })
        } catch (error) {
          throw new Error(`Failed to remove HLS directory ${hlsPath}: ${error}`)
        }
      }

      if (fs.existsSync(cachePath)) {
        try {
          fs.rmSync(cachePath, { recursive: true })
        } catch (error) {
          throw new Error(`Failed to remove cache directory ${cachePath}: ${error}`)
        }
      }

      await movie.delete()

      return {
        success: true,
        spaceFreed,
      }
    } catch (error) {
      const errorMessage = `Error deleting movie ${movie.tmdbId}: ${error}`
      console.error(errorMessage)
      return {
        success: false,
        spaceFreed: 0,
        error: errorMessage,
      }
    }
  }
}
