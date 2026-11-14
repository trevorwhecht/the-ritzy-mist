import { localBusinessSchema } from "./localBusinessSchema"

test("JSON-LD parses with name, url, telephone, areaServed and no ratings", () => {
  const j = JSON.parse(JSON.stringify(localBusinessSchema))
  expect(j["@type"]).toEqual(["LocalBusiness", "BeautySalon"])
  expect(j.name).toBe("The Ritzy Mist")
  expect(j.url).toBe("https://theritzymist.com")
  expect(j.telephone).toBe("+1-916-628-4899")
  expect(j.areaServed).toBe("San Diego County")
  expect(j.aggregateRating).toBeUndefined()
  expect(j.review).toBeUndefined()
})
