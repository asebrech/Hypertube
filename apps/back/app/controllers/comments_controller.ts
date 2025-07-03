import Comment from '#models/comment'
import type { HttpContext } from '@adonisjs/core/http'

export default class CommentsController {
  async index({ auth, request, response }: HttpContext) {
    let user = auth.user
    let tmdbId = request.param('tmdbId')
    let page = request.input('page', 1)
    let comments = await Comment.query().where('tmdbId', tmdbId).paginate(page, 6)
    return response.ok(comments.toJSON())
  }
}
