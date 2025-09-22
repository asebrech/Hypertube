/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import app from '@adonisjs/core/services/app'
import { middleware } from './kernel.js'

const AuthController = () => import('#controllers/auth_controller')
const MoviesController = () => import('#controllers/movies_controller')
const TorrentController = () => import('#controllers/torrent_controller')
const UsersController = () => import('#controllers/users_controller')
const CommentsController = () => import('#controllers/comments_controller')

router.get('/', async () => ({ hello: 'world' }))

router
  .group(() => {
    router.post('register', [AuthController, 'register'])
    router.post('login', [AuthController, 'login'])
    router.post('logout', [AuthController, 'logout']).use(middleware.auth())
    router.post('forgot-password', [AuthController, 'forgotPassword'])
    router.post('reset-password', [AuthController, 'resetPassword'])
    router.patch(':id', [AuthController, 'updateUser']).use(middleware.auth())
  })
  .prefix('user')

// Public user profile route (no authentication required)
router.get('/users/profile/:username', [UsersController, 'profileByUsername'])

// Serve uploaded profile pictures (public route)
router.get('/uploads/profiles/:filename', [UsersController, 'serveProfilePicture'])

// Protected Users routes (require authentication)
router
  .group(() => {
    router.get('me', [UsersController, 'me'])
    router.patch(':id', [UsersController, 'update']) // Update user profile
    router.post('upload-profile-picture', [UsersController, 'uploadProfilePicture']) // Upload profile picture
    router.get(':id', [UsersController, 'show'])
    router.get('', [UsersController, 'index']) // GET /users?ids=1,2,3
    router.get(':user_id/comments', [CommentsController, 'userComments']) // GET /users/:user_id/comments
  })
  .prefix('users')
  .use(middleware.auth())

router
  .group(() => {
    router.get('', [MoviesController, 'index'])
    router.get('backdropImage', [MoviesController, 'backdropImage'])
    router.get('posterImage', [MoviesController, 'posterImage'])
    router.get('logoImage', [MoviesController, 'logoImage'])
    router.get('search', [MoviesController, 'movieSearch'])
    router.get('discover', [MoviesController, 'MovieDiscover'])
    router.get('genres', [MoviesController, 'movieGenres'])
    router.get('similar', [MoviesController, 'MovieSimilar'])
    router.get('credits', [MoviesController, 'MovieCredits'])
    router.get('people', [MoviesController, 'PeopleDetails'])
    router.get(':id', [MoviesController, 'movieDetails'])
    router.get(':id/videos', [MoviesController, 'movieVideos'])
    router.post(':id/watched', [MoviesController, 'markAsWatched']).use(middleware.auth())
    router.post(':id/bookmark', [MoviesController, 'toggleBookmark']).use(middleware.auth())
    router.post(':id/progress', [MoviesController, 'saveWatchProgress']).use(middleware.auth())
    router.get(':id/progress', [MoviesController, 'getWatchProgress']).use(middleware.auth())
    router
      .post(':id/subtitles/download', [MoviesController, 'downloadMultipleSubtitles'])
      .use(middleware.auth())
    router
      .get(':id/subtitles/:language?', [MoviesController, 'getSubtitles'])
      .use(middleware.auth())
  })
  .prefix('movies')

router
  .group(() => {
    router.get(':id/comments', [CommentsController, 'movieComments']).use(middleware.auth())
    router.post(':id/comments', [CommentsController, 'storeMovieComment']).use(middleware.auth())
  })
  .prefix('movie')

router
  .group(() => {
    router
      .delete(':commentId', [CommentsController, 'deleteComment'])
      .use([middleware.auth(), middleware.commentOwnership()])
    router
      .patch(':commentId', [CommentsController, 'updateComment'])
      .use([middleware.auth(), middleware.commentOwnership()])
  })
  .prefix('comments')

router
  .group(() => {
    router.get('/:id', [TorrentController, 'torrent'])
    router.get('/:resolution/:id', [TorrentController, 'ready'])
    router.delete('/', [TorrentController, 'deleteAll']).use(middleware.admin())
    router.delete('/:id', [TorrentController, 'delete']).use(middleware.admin())
  })
  .prefix('torrent')
  .use(middleware.auth())

router.get('/stream/*', [TorrentController, 'stream']).use(middleware.auth())

router
  .get('/:provider/redirect', ({ ally, params }) => {
    return ally.use(params.provider).redirect()
  })
  .where('provider', /github|google|fortyTwo/)

router
  .get('/:provider/callback', [AuthController, 'callback'])
  .where('provider', /github|google|fortyTwo/)
