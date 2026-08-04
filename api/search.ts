// Vercel serverless function — live web search via Tavily, key kept server-side.
// The browser POSTs { query }; the TAVILY_API_KEY never reaches the client.
// Set TAVILY_API_KEY in the server env.

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' })
    return
  }
  const key = process.env.TAVILY_API_KEY
  if (!key) {
    res.status(200).json({ results: [], answer: '', disabled: true })
    return
  }
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const query: string | undefined = body?.query
    if (!query) {
      res.status(400).json({ error: 'missing query' })
      return
    }
    const r = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: key,
        query: query.slice(0, 380),
        max_results: 5,
        include_answer: true,
        search_depth: 'basic',
      }),
    })
    if (!r.ok) {
      res.status(200).json({ results: [], answer: '' }) // soft-fail → caller degrades gracefully
      return
    }
    const data = await r.json()
    const results = Array.isArray(data?.results)
      ? data.results.slice(0, 5).map((x: any) => ({
          title: String(x?.title ?? x?.url ?? 'source'),
          url: String(x?.url ?? ''),
          content: String(x?.content ?? '').slice(0, 600),
        }))
      : []
    res.status(200).json({ results, answer: String(data?.answer ?? '') })
  } catch (e: any) {
    res.status(200).json({ results: [], answer: '' })
  }
}
