export interface Env {
  ASSETS: Fetcher
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    
    // Try to serve static asset first
    const assetResponse = await env.ASSETS.fetch(request)
    
    // If asset found (not 404), return it
    if (assetResponse.status !== 404) {
      return assetResponse
    }
    
    // Otherwise serve index.html for SPA routing
    const indexRequest = new Request(new URL('/', url.origin).toString())
    return env.ASSETS.fetch(indexRequest)
  }
}
