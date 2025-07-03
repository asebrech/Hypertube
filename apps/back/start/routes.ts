/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const AuthController   = () => import('#controllers/auth_controller')
const MoviesController = () => import('#controllers/movies_controller')

router.get('/', async () => ({ hello: 'world' }))

router
  .group(() => {
    router.post('register', [AuthController, 'register'])
    router.post('login',    [AuthController, 'login'])
    router.post('logout',   [AuthController, 'logout']).use(middleware.auth())
  })
  .prefix('user')

router.group(() => {
  router.get('movies', [MoviesController, 'index']).use(middleware.auth())
  router.get('movies/backdropImage', [MoviesController, 'backdropImage'])
  router.get('movies/posterImage', [MoviesController, 'posterImage'])
  router.get('movies/:id', [MoviesController, 'movieDetails'])
  router.get('movies/:id/videos', [MoviesController, 'movieVideos'])
})

router
  .get('me', async ({ auth, response }) => {
    try {
      const user = auth.getUserOrFail()
      return response.ok(user)
    } catch {
      return response.unauthorized({ error: 'User not found' })
    }
  })
  .use(middleware.auth())

router
  .get('/:provider/redirect', ({ ally, params }) => {
    return ally.use(params.provider).redirect()
  })
  .where('provider', /github|google|fortyTwo/)

router
  .get('/:provider/callback', [AuthController, 'callback'])
  .where('provider', /github|google|fortyTwo/)
