// src/orm/index.ts
// Central export for all ORM modules

import { GivenNamesORM } from './GivenNamesORM.js'
import { UsersORM } from './UsersORM.js'

// Export individual ORMs if needed elsewhere
export { GivenNamesORM, UsersORM }

// Close all ORM connections safely
// export function closeAllORMs() {
//   try {
//     GivenNamesORM.close()
//   } catch (err) {
//     console.error('[orm] Error closing GivenNamesORM', err)
//   }

//   try {
//     UsersORM.close()
//   } catch (err) {
//     console.error('[orm] Error closing UsersORM', err)
//   }
// }
