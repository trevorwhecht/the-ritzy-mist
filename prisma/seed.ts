import { PrismaClient, ServiceLocation } from '@prisma/client'
import { hash } from 'bcryptjs'
import { defaultPricingData } from '../src/lib/pricingData'
import { parsePriceCents } from '../src/lib/money'
import { SETTING_DEFAULTS } from '../src/lib/settingsDefaults'

const prisma = new PrismaClient()

async function main() {
  let sort = 0
  for (const [location, tab] of [[ServiceLocation.STUDIO, defaultPricingData.inStudio], [ServiceLocation.MOBILE, defaultPricingData.mobile]] as const) {
    for (const s of tab.services) {
      // Read the counter once: `sort++` inline would give update and create different values.
      const sortOrder = sort++
      const fields = {
        name: s.title,
        description: s.description,
        priceCents: parsePriceCents(s.price),
        location,
        sortOrder,
      }
      await prisma.service.upsert({
        where: { slug: s.id },
        update: fields,
        create: { slug: s.id, ...fields },
      })
    }
  }
  const addOns = defaultPricingData.inStudio.addOns?.items ?? []
  for (const [i, a] of addOns.entries()) {
    if (!a.price) continue
    await prisma.addOn.upsert({
      where: { name: a.title },
      update: { description: a.description, priceCents: parsePriceCents(a.price), sortOrder: i },
      create: { name: a.title, description: a.description, priceCents: parsePriceCents(a.price), sortOrder: i },
    })
  }
  for (const [key, value] of Object.entries(SETTING_DEFAULTS)) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } })
  }
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FIRST_NAME = 'Admin', ADMIN_LAST_NAME = 'User' } = process.env
  if (ADMIN_EMAIL && ADMIN_PASSWORD) {
    await prisma.user.upsert({
      where: { email: ADMIN_EMAIL.toLowerCase() },
      update: { role: 'ADMIN' },
      create: { email: ADMIN_EMAIL.toLowerCase(), password: await hash(ADMIN_PASSWORD, 12), firstName: ADMIN_FIRST_NAME, lastName: ADMIN_LAST_NAME, role: 'ADMIN' },
    })
  } else {
    console.warn('ADMIN_EMAIL/ADMIN_PASSWORD not set — no admin user seeded')
  }
}

main()
  .then(async () => {
    const [services, addOns, settings] = await Promise.all([
      prisma.service.count(),
      prisma.addOn.count(),
      prisma.setting.count(),
    ])
    console.log(`Seeded: ${services} services, ${addOns} add-ons, ${settings} settings`)
  })
  .catch((error) => {
    // Without this the process exits 0 on failure and a half-seeded database looks successful.
    console.error('Seed failed:', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
