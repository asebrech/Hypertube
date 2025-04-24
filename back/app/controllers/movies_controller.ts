import type { HttpContext } from '@adonisjs/core/http'
import axios from 'axios'

let cachedMovies: any = null
let lastFetchedTime: Date | null = null

export default class MoviesController {
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = 10
    const offset = (page - 1) * limit

    console.log('Page:', page)
    if (page === 1 || !cachedMovies) {
      try {
        // Fetch fresh data from the external API
        const externalResponse = await axios.get('https://freetestapi.com/api/v1/movies', {
          params: { offset, limit },
        })
        console.log('Movies data fetched from external API ->', externalResponse.data)
        // Cache the data (store in memory)
        cachedMovies = externalResponse.data
        lastFetchedTime = new Date() // Update the fetch time

        console.log('Movies data refreshed.')

        // Return the requested page from the cached data
        const paginatedMovies = cachedMovies?.slice(offset, offset + limit)
        const hasMorePages = cachedMovies.totalPages > page
        return response.json({
          data: paginatedMovies,
          hasMorePages,
        })
      } catch (error) {
        console.error('Error fetching movies from external API:', error)
        return response.status(500).json({ error: 'Failed to fetch movies' })
      }
    } else if (cachedMovies) {
      const paginatedMovies = cachedMovies.results.slice(offset, offset + limit)
      const hasMorePages = cachedMovies.totalPages > page
      return response.json({
        data: paginatedMovies,
        hasMorePages,
      })
    }
  }
}
