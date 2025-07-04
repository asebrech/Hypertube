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

const AuthController = () => import('#controllers/auth_controller')
const MoviesController = () => import('#controllers/movies_controller')
const TorrentController = () => import('#controllers/torrent_controller')

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router.get('home', [TorrentController, 'torrent'])
router.get('/hls/*', [TorrentController, 'stream'])

router
  .group(() => {
    router.post('register', [AuthController, 'register'])
    router.post('login', [AuthController, 'login'])
    router.post('logout', [AuthController, 'logout']).use(middleware.auth())
  })
  .prefix('user')

router.group(() => {
  router.get('movies', [MoviesController, 'index'])
  router.get('movies/backdropImage', [MoviesController, 'backdropImage'])
  router.get('movies/:id', [MoviesController, 'movieDetails'])
})

router
  .get('me', async ({ auth, response }) => {
    try {
      const user = auth.getUserOrFail()
      return response.ok(user)
    } catch (error) {
      return response.unauthorized({ error: 'User not found' })
    }
  })
  .use(middleware.auth())

router
  .get('/:provider/redirect', ({ ally, params }) => {
    const driverInstance = ally.use(params.provider)
    return driverInstance.redirect()
  })
  .where('provider', /github|google/)

router.get('/:provider/callback', [AuthController, 'callback']).where('provider', /github|google/)
