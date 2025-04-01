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

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router
  .group(() => {
    router.post('register', [AuthController, 'register'])
    router.post('login', [AuthController, 'login'])
    router.post('logout', [AuthController, 'logout']).use(middleware.auth())
  })
  .prefix('user')

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

router.get('/:provider/callback', async ({ ally, params }) => {
  const driverInstance = ally.use(params.provider)

  /**
   * User has denied access by canceling
   * the login flow
   */
  if (driverInstance.accessDenied()) {
    return 'You have cancelled the login process'
  }

  /**
   * OAuth state verification failed. This happens when the
   * CSRF cookie gets expired.
   */
  if (driverInstance.stateMisMatch()) {
    return 'We are unable to verify the request. Please try again'
  }

  /**
   * GitHub responded with some error
   */
  if (driverInstance.hasError()) {
    return driverInstance.getError()
  }

  /**
   * Access user info
   */
  const user = await driverInstance.user()

  console.log(user.original)
  return user
})
