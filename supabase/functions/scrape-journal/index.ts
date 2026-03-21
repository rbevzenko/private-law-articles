import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Topic classification keywords
const TOPIC_KEYWORDS: Record<string, string[]> = {
  'Обязательственное право': ['обязательств', 'исполнени', 'неустойк', 'залог', 'поручительств', 'цессия', 'перевод долга', 'зачёт', 'зачет', 'новация', 'прощение долга', 'синаллагм', 'реституц'],
  'Вещное право': ['вещн', 'собственност', 'владен', 'сервитут', 'ипотек', 'залог', 'давност', 'виндикац', 'негаторн', 'регистрац'],
  'Договорное право': ['договор', 'контракт', 'купл', 'продаж', 'аренд', 'подряд', 'оказани', 'услуг', 'поставк', 'лизинг', 'страхован', 'товарищест', 'заём', 'кредит', 'дарени'],
  'Наследственное право': ['наследств', 'наследован', 'завещан', 'наследник', 'наследодател'],
  'Семейное право': ['семейн', 'брак', 'супруг', 'алимент', 'усыновлен', 'опек'],
  'Корпоративное право': ['корпоратив', 'акционер', 'участник', 'директор', 'совет директоров', 'общество', 'акци', 'дивиденд', 'уставн'],
  'Интеллектуальная собственность': ['интеллектуальн', 'авторск', 'патент', 'товарный знак', 'изобретен', 'торговая марка'],
  'Деликтное право': ['делик', 'вред', 'убытк', 'ответственност', 'возмещен', 'компенсац', 'моральн'],
  'Международное частное право': ['международн', 'иностранн', 'трансграничн', 'коллизионн', 'арбитраж'],
  'Банкротство': ['банкротств', 'несостоятельн', 'конкурсн', 'субординац', 'субсидиарн', 'кредитор'],
  'Процессуальное право': ['процесс', 'иск', 'суд', 'арбитражн', 'доказательств', 'обеспечительн', 'исполнительн', 'мировое соглашен'],
}

function classifyTopics(title: string, section?: string): string[] {
  const text = `${title} ${section || ''}`.toLowerCase()
  const topics: string[] = []
  
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) {
      topics.push(topic)
    }
  }
  
  return topics.length > 0 ? topics : ['Общие вопросы']
}

async function scrapeWithFirecrawl(url: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      onlyMainContent: true,
      waitFor: 2000,
    }),
  })
  
  const data = await response.json()
  if (!response.ok) {
    throw new Error(`Firecrawl error [${response.status}]: ${JSON.stringify(data)}`)
  }
  
  return data.data?.markdown || data.markdown || ''
}

// Parse Вестник гражданского права issue page
function parseMvgpIssue(markdown: string, year: number, issue: string): any[] {
  const articles: any[] = []
  const lines = markdown.split('\n')
  
  let currentSection = ''
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Detect section headers (like "Проблемы частного (гражданского) права")
    if (line.startsWith('- ') && !line.includes('mvgp.org') && !line.includes('**') && line.length > 10 && line.length < 100) {
      const sectionText = line.replace(/^-\s*/, '').trim()
      if (!sectionText.includes('Перейти') && !sectionText.includes('Подробнее') && !sectionText.includes('корзин')) {
        currentSection = sectionText
      }
    }
    
    // Detect article entries by bold title pattern
    const titleMatch = line.match(/\*\*([^*]+)\*\*/)
    if (titleMatch && !line.includes('Том ') && !line.includes('№ ')) {
      const title = titleMatch[1].trim()
      
      // Skip English titles and non-article entries
      if (/^[A-Z]/.test(title) || title.length < 10) continue
      if (title.includes('Перейти') || title.includes('корзин')) continue
      
      // Look for author in nearby lines
      const authorLines: string[] = []
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const nextLine = lines[j].trim().replace(/\\\\/g, '').trim()
        if (!nextLine) continue
        // Author pattern: initials + surname or surname + initials
        if (/^[А-ЯЁ]\.[А-ЯЁ]\.\s+[А-ЯЁ]/.test(nextLine) || /^[А-ЯЁ][а-яё]+\s+[А-ЯЁ]\.[А-ЯЁ]\./.test(nextLine)) {
          authorLines.push(nextLine)
          break
        }
        // Just a name like "Е.А. Суханов"
        if (/^[А-ЯЁ]\.[А-ЯЁ]\.\s*[А-ЯЁ][а-яё]+/.test(nextLine)) {
          authorLines.push(nextLine)
          break
        }
      }
      
      // Extract URL
      const urlMatch = line.match(/\(https:\/\/mvgp\.org\/product\/([^)]+)\)/)
      const url = urlMatch ? `https://mvgp.org/product/${urlMatch[1]}` : undefined
      
      articles.push({
        title,
        authors: authorLines.length > 0 ? authorLines : ['Автор не указан'],
        journal: 'Вестник гражданского права',
        year,
        issue,
        section: currentSection || null,
        topics: classifyTopics(title, currentSection),
        url,
        source_url: url,
      })
    }
  }
  
  return articles
}

// Parse Цивилистика issue page
function parsePrivlawIssue(markdown: string, year: number, issue: string): any[] {
  const articles: any[] = []
  const lines = markdown.split('\n')
  
  let currentSection = ''
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Section headers (## Heading)
    if (line.startsWith('## ') && !line.includes('Выпуски') && !line.includes('год')) {
      currentSection = line.replace(/^##\s*/, '').trim()
      continue
    }
    
    // Article titles (##### [Title](url))
    const articleMatch = line.match(/^#{4,5}\s*\[([^\]]+)\]\(([^)]+)\)/)
    if (articleMatch) {
      const title = articleMatch[1].replace(/,$/, '').trim()
      const url = articleMatch[2]
      
      // Look for author on next line
      const authors: string[] = []
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        const nextLine = lines[j].trim()
        const authorMatch = nextLine.match(/\*\*([^*]+)\*\*/)
        if (authorMatch) {
          authors.push(authorMatch[1].replace(/[,\s]+$/, '').trim())
          break
        }
      }
      
      articles.push({
        title,
        authors: authors.length > 0 ? authors : ['Автор не указан'],
        journal: 'Цивилистика',
        year,
        issue,
        section: currentSection || null,
        topics: classifyTopics(title, currentSection),
        url,
        source_url: url,
      })
    }
  }
  
  return articles
}

// Parse Вестник экономического правосудия issue page
function parseZakonIssue(markdown: string, year: number, month: string): any[] {
  const articles: any[] = []
  const lines = markdown.split('\n')
  
  let currentSection = ''
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Section headers (plain text sections like "Комментарии", "Свободная трибуна")
    if (!line.startsWith('#') && !line.startsWith('-') && !line.startsWith('!') && !line.startsWith('[') && !line.includes('zakon.ru') && line.length > 3 && line.length < 60 && /^[А-ЯЁ]/.test(line) && !line.includes('аннотация') && !line.includes('Купить') && !line.includes('Подпис') && !line.includes('Cookie') && !line.includes('Чтобы') && !line.includes('Если вы') && !line.includes('Пожалуйста')) {
      const potentialSection = line.trim()
      // Check if this looks like a section header
      if (/^[А-ЯЁа-яё\s,]+$/.test(potentialSection) && potentialSection.length < 50) {
        currentSection = potentialSection
        continue
      }
    }
    
    // Article entries: ![lock](...)[Author. Title](url)
    const articleMatch = line.match(/\[([^\]]+)\]\(https:\/\/zakon\.ru\/publication\/igzakon\/(\d+)\)/)
    if (articleMatch) {
      const fullText = articleMatch[1].trim()
      if (fullText === 'Содержание/Contents' || fullText.length < 10) continue
      
      // Parse "Author. Title" format
      const dotIndex = fullText.indexOf('. ')
      let authors: string[] = []
      let title = fullText
      
      if (dotIndex > 0 && dotIndex < 60) {
        const authorPart = fullText.substring(0, dotIndex).trim()
        const titlePart = fullText.substring(dotIndex + 2).trim()
        
        // Check if the part before dot looks like an author name
        if (/^[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+/.test(authorPart) || /^[А-ЯЁ][а-яё]+\s+[А-ЯЁа-яё]+\s+[А-ЯЁ][а-яё]+/.test(authorPart)) {
          authors = [authorPart]
          title = titlePart
        }
      }
      
      if (!title || title.length < 5) continue
      
      articles.push({
        title,
        authors: authors.length > 0 ? authors : ['Автор не указан'],
        journal: 'Вестник экономического правосудия',
        year,
        issue: month,
        section: currentSection || null,
        topics: classifyTopics(title, currentSection),
        url: `https://zakon.ru/publication/igzakon/${articleMatch[2]}`,
        source_url: `https://zakon.ru/publication/igzakon/${articleMatch[2]}`,
      })
    }
  }
  
  return articles
}

// Get issue URLs from the main journal pages
function extractMvgpIssueUrls(markdown: string): { url: string, year: number, issue: string }[] {
  const results: { url: string, year: number, issue: string }[] = []
  const matches = markdown.matchAll(/\(https:\/\/mvgp\.org\/product\/[^)]+\)/g)
  const seen = new Set<string>()
  
  for (const match of matches) {
    const url = match[0].slice(1, -1)
    if (seen.has(url)) continue
    if (!url.includes('zhurnala') && !url.includes('vgp-')) continue
    seen.add(url)
    
    // Extract year and issue from URL or surrounding text
    const yearMatch = url.match(/(\d{4})/)
    const issueMatch = url.match(/-(\d+)-tom-/) || url.match(/vgp-\d{4}-(\d+)/)
    
    if (yearMatch) {
      results.push({
        url,
        year: parseInt(yearMatch[1]),
        issue: issueMatch ? `№ ${issueMatch[1]}` : '',
      })
    }
  }
  
  return results
}

function extractPrivlawIssueUrls(markdown: string): { url: string, year: number, issue: string }[] {
  const results: { url: string, year: number, issue: string }[] = []
  const lines = markdown.split('\n')
  
  let currentYear = 0
  let issueNum = 0
  
  for (const line of lines) {
    const yearMatch = line.match(/^##\s*(\d{4})\s*год/)
    if (yearMatch) {
      currentYear = parseInt(yearMatch[1])
      issueNum = 0
      continue
    }
    
    const linkMatch = line.match(/\[№\s*(\d+)[^\]]*\]\((https:\/\/privlaw-journal\.com\/magazine\/[^)]+)\)/)
    if (linkMatch && currentYear) {
      results.push({
        url: linkMatch[2],
        year: currentYear,
        issue: `№ ${linkMatch[1]}`,
      })
    }
  }
  
  return results
}

function extractZakonIssueUrls(markdown: string): { url: string, year: number, month: string }[] {
  const results: { url: string, year: number, month: string }[] = []
  const lines = markdown.split('\n')
  
  let currentYear = 0
  
  for (const line of lines) {
    const yearMatch = line.match(/\*\*(\d{4})\*\*/)
    if (yearMatch) {
      currentYear = parseInt(yearMatch[1])
      continue
    }
    
    const linkMatch = line.match(/\[(Январь|Февраль|Март|Апрель|Май|Июнь|Июль|Август|Сентябрь|Октябрь|Ноябрь|Декабрь)\]\((https:\/\/zakon\.ru\/magazine\/[^)]+)\)/)
    if (linkMatch && currentYear) {
      results.push({
        url: linkMatch[2],
        year: currentYear,
        month: linkMatch[1],
      })
    }
  }
  
  return results
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { journal, limit } = await req.json()
    
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY')
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'FIRECRAWL_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    let allArticles: any[] = []
    const maxIssues = limit || 5 // default to 5 issues per call to stay within limits
    const logs: string[] = []
    
    if (journal === 'mvgp') {
      logs.push('Scraping Вестник гражданского права...')
      const mainPage = await scrapeWithFirecrawl('https://mvgp.org/product-category/zurnal/', firecrawlKey)
      const issues = extractMvgpIssueUrls(mainPage).slice(0, maxIssues)
      logs.push(`Found ${issues.length} issues to scrape`)
      
      for (const issue of issues) {
        try {
          logs.push(`Scraping issue: ${issue.url}`)
          const issuePage = await scrapeWithFirecrawl(issue.url, firecrawlKey)
          const articles = parseMvgpIssue(issuePage, issue.year, issue.issue)
          allArticles.push(...articles)
          logs.push(`Found ${articles.length} articles in ${issue.issue} ${issue.year}`)
        } catch (e) {
          logs.push(`Error scraping ${issue.url}: ${e.message}`)
        }
      }
    } else if (journal === 'privlaw') {
      logs.push('Scraping Цивилистика...')
      const mainPage = await scrapeWithFirecrawl('https://privlaw-journal.com/', firecrawlKey)
      const issues = extractPrivlawIssueUrls(mainPage).slice(0, maxIssues)
      logs.push(`Found ${issues.length} issues to scrape`)
      
      for (const issue of issues) {
        try {
          logs.push(`Scraping issue: ${issue.url}`)
          const issuePage = await scrapeWithFirecrawl(issue.url, firecrawlKey)
          const articles = parsePrivlawIssue(issuePage, issue.year, issue.issue)
          allArticles.push(...articles)
          logs.push(`Found ${articles.length} articles in ${issue.issue} ${issue.year}`)
        } catch (e) {
          logs.push(`Error scraping ${issue.url}: ${e.message}`)
        }
      }
    } else if (journal === 'zakon') {
      logs.push('Scraping Вестник экономического правосудия...')
      const mainPage = await scrapeWithFirecrawl(
        'https://zakon.ru/magazine/vestnik_ekonomicheskogo_pravosudiya_rf_ranee_vestnik_vas_rf',
        firecrawlKey
      )
      const issues = extractZakonIssueUrls(mainPage).slice(0, maxIssues)
      logs.push(`Found ${issues.length} issues to scrape`)
      
      for (const issue of issues) {
        try {
          logs.push(`Scraping issue: ${issue.url}`)
          const issuePage = await scrapeWithFirecrawl(issue.url, firecrawlKey)
          const articles = parseZakonIssue(issuePage, issue.year, issue.month)
          allArticles.push(...articles)
          logs.push(`Found ${articles.length} articles in ${issue.month} ${issue.year}`)
        } catch (e) {
          logs.push(`Error scraping ${issue.url}: ${e.message}`)
        }
      }
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid journal. Use: mvgp, privlaw, or zakon' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Insert articles into database (upsert to avoid duplicates)
    let inserted = 0
    let skipped = 0
    
    for (const article of allArticles) {
      const { error } = await supabase
        .from('articles')
        .upsert(article, { onConflict: 'title,journal,year', ignoreDuplicates: true })
      
      if (error) {
        logs.push(`Insert error for "${article.title}": ${error.message}`)
        skipped++
      } else {
        inserted++
      }
    }
    
    logs.push(`Done! Inserted: ${inserted}, Skipped/Errors: ${skipped}`)
    
    return new Response(
      JSON.stringify({
        success: true,
        total_found: allArticles.length,
        inserted,
        skipped,
        logs,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Scrape error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
