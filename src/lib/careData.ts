// Spray tan prep / aftercare content. Items are raw HTML strings (<strong> for the lead-in).

export interface CareData {
  prep: string[]
  aftercare: string[]
}

export const defaultCareData: CareData = {
  prep: [
    "<strong>SHOWER</strong> 12-24 hrs before appt",
    "<strong>EXFOLIATE/SHAVE/WAX</strong> 24 hrs before appt, pores need time to close before application",
    "<strong>AVOID</strong> lotions, sunscreens, creams, gels, oils and perfumes day of. They leave residue on the skin preventing even application.",
    "<strong>DO NOT</strong> wear makeup or deodorant to appt.",
    "<strong>WEAR</strong> loose dark baggy clothing after application."
  ],
  aftercare: [
    "<strong>AVOID</strong> any and all contact with sweat, water or liquids until first rinse.",
    "<strong>WAIT TO RINSE</strong> for the recommended time by your artist. If sleeping in it, make sure to wear long baggy clothes to avoid transfer on to other body parts or sheets.",
    "<strong>RINSE</strong> with lukewarm water until water runs clear. No soap & pat dry.",
    "<strong>MOISTURIZE</strong> skin daily with a gradual tanning lotion.",
    "<strong>USE</strong> safe products that are sulfate free, paraben free, and alcohol free for long lasting results.",
    "<strong>STAY HYDRATED</strong> to keep your skin and tan looking fresh",
    "*excessive sweating, hot tubs, saunas, hot baths & showers can cause faster discoloration*"
  ]
}
