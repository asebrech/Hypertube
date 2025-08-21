import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import Comment from '#models/comment'

/**
 * Comment ownership middleware ensures that only the comment owner can edit or delete their comments
 */
export default class CommentOwnershipMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { params, response, auth } = ctx

    try {
      const user = auth.getUserOrFail()
      const commentId = parseInt(params.commentId)

      if (!commentId || isNaN(commentId)) {
        return response.badRequest({ error: 'Invalid comment ID' })
      }

      // Find the comment and check if it exists
      const comment = await Comment.find(commentId)

      if (!comment) {
        return response.notFound({ error: 'Comment not found' })
      }

      // Check if the current user owns this comment
      if (comment.userId !== user.id) {
        return response.forbidden({
          error: 'You do not have permission to perform this action on this comment',
        })
      }

      // Store the comment in the context for use in the controller
      ctx.comment = comment

      await next()
    } catch (error) {
      console.log('Comment ownership middleware error:', error.message)
      return response.unauthorized({ error: 'Authentication required' })
    }
  }
}
