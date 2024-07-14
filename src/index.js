const express    = require('express'),
      helmet     = require('helmet'),
      bodyParser = require('body-parser'),
      cors       = require('cors')

const https = require('node:https')
const { JSDOM } = require('jsdom')

const PORT = 8080

const app = express()

app.use(helmet())
app.use(cors({
  origin: '*',
  methods: 'GET',
  allowedHeaders: ['Content-Type']
}))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

function scrap(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode !== 200)
        return reject(new Error('Scrap failed'))

      res.setEncoding('utf8')
  
      let chunk = []
      
      res.on('data', function(data) {
        chunk.push(data)
      })
  
      res.on('end', () => {
        const { window } = new JSDOM(chunk.join(''))
  
        resolve({
          charset: window.document.querySelector('meta[charset]')?.getAttribute('charset') || '',
          viewport: window.document.querySelector('meta[name="viewport"]')?.content || '',
          title: window.document.querySelector('title')?.textContent || '',
          description: window.document.querySelector('meta[name="description"]')?.content || '',
          canonicalURL: window.document.querySelector('link[rel="canonical"]')?.href || '',
          imageURL: window.document.querySelector('meta[property="og:image"]')?.content || '',
          imageAltText: window.document.querySelector('meta[name="twitter:image:alt"]')?.content || '',
          favicon: window.document.querySelector('link[rel="icon"]')?.href,
          pageAuthor: window.document.querySelector('meta[name="author"]')?.content || '',
          robots: window.document.querySelector('meta[name="robots"]')?.content || '',
          themeColor: window.document.querySelector('meta[name="theme-color"]')?.content || '',
          locale: window.document.querySelector('meta[property="og:locale"]')?.content || '',
          pageSite: window.document.querySelector('meta[name="twitter:site"]')?.content || ''
        })
      })
    }).on('error', function(err) {
      reject(err)
    })
  })
}

app.get('/api/scrap', async (req, res) => {
  const site = req.query.url

  if (!site)
    return res.status(400).json({ success: false, message: '"site"  required' })

  try {
    const data = await scrap(site)

    res.json({
      success: true,
      data
    })
  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
      message: error.message || 'Scrap failed'
    })
  }
})

app.use((req, res) => {
  res.status(404).json({ success: false })
})

app.listen(PORT, () => console.log(`Running at port ${PORT}`))