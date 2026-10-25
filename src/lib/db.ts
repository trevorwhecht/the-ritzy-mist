import { PrismaClient } from '@prisma/client'

declare global {
  // `var` is required here: `let`/`const` do not attach to globalThis.
  var prisma: PrismaClient | undefined
}

const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
})
if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export { prisma }
export default prisma
