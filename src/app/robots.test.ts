import robots from "./robots"

test("allows all agents, blocks private paths, points at sitemap", () => {
  const r = robots()
  expect(r.rules).toEqual({ userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/api"] })
  expect(r.sitemap).toBe("https://theritzymist.com/sitemap.xml")
})
