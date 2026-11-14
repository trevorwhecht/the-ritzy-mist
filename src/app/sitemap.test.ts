import sitemap from "./sitemap"

test("lists public pages only", () => {
  expect(sitemap().map((e) => e.url)).toEqual([
    "https://theritzymist.com",
    "https://theritzymist.com/about-me",
    "https://theritzymist.com/services",
    "https://theritzymist.com/pricing",
    "https://theritzymist.com/care",
    "https://theritzymist.com/spraytancare",
    "https://theritzymist.com/contact",
    "https://theritzymist.com/policies",
  ])
})
