import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import Auth from './Auth'
import AgricultureHub from './AgricultureHub'

const API_BASE = "https://agrovision-ai-backend.onrender.com";
const API_URL = `${API_BASE}/predict`;
const enamMandiCounts = {
  "Andhra Pradesh": 33,
  "Assam": 3,
  "Bihar": 20,
  "Chhattisgarh": 21,
  "Goa": 7,
  "Gujarat": 144,
  "Haryana": 114,
  "Himachal Pradesh": 38,
  "Jharkhand": 19,
  "Karnataka": 5,
  "Kerala": 6,
  "Madhya Pradesh": 139,
  "Maharashtra": 181,
  "Manipur": null,
  "Meghalaya": null,
  "Mizoram": null,
  "Nagaland": 19,
  "Odisha": 66,
  "Punjab": 156,
  "Rajasthan": 173,
  "Sikkim": null,
  "Tamil Nadu": 213,
  "Telangana": 57,
  "Tripura": 19,
  "Uttar Pradesh": 162,
  "Uttarakhand": 20,
  "West Bengal": 18,
  "Arunachal Pradesh": null,
}
const cropList = ['Tomato', 'Onion', 'Potato', 'Maize', 'Rice', 'Wheat', 'Groundnut', 'Cotton']
const calendarMonths = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const calendarCrops = [
  { name: 'Rice', season: 'Kharif', sowing: [5,6,7], harvest: [9,10,11,0], note: 'Maintain suitable water levels and monitor pests.' },
  { name: 'Wheat', season: 'Rabi', sowing: [10,11], harvest: [2,3], note: 'Prepare well-drained soil and monitor irrigation.' },
  { name: 'Maize', season: 'Kharif', sowing: [5,6,7], harvest: [8,9,10], note: 'Ensure good drainage and timely weed control.' },
  { name: 'Tomato', season: 'All seasons', sowing: [5,6,9,10], harvest: [7,8,11,0,1], note: 'Avoid waterlogging and monitor pests regularly.' },
  { name: 'Groundnut', season: 'Kharif', sowing: [5,6,7], harvest: [8,9,10], note: 'Use well-drained soil and suitable seed varieties.' },
  { name: 'Cotton', season: 'Kharif', sowing: [5,6,7], harvest: [9,10,11,0], note: 'Monitor crop growth and protect against bollworms.' },
  { name: 'Ragi', season: 'Kharif', sowing: [5,6,7], harvest: [9,10], note: 'Suitable varieties and rainfall affect crop timing.' },
  { name: 'Onion', season: 'All seasons', sowing: [5,6,9,10], harvest: [8,9,0,1], note: 'Avoid excess moisture near maturity.' },
  { name: 'Potato', season: 'Rabi', sowing: [9,10,11], harvest: [0,1,2], note: 'Use healthy seed tubers and monitor soil moisture.' },
  { name: 'Chickpea', season: 'Rabi', sowing: [9,10,11], harvest: [1,2,3], note: 'Avoid excess irrigation during flowering.' },
  { name: 'Sugarcane', season: 'All seasons', sowing: [1,2,3,6,7], harvest: [10,11,0], note: 'Requires a long growing period and adequate water.' },
  { name: 'Pigeon Pea', season: 'Kharif', sowing: [5,6], harvest: [10,11,0], note: 'Ensure proper spacing and monitor pod pests.' },
  { name: 'Green Gram', season: 'Zaid', sowing: [2,3,4], harvest: [4,5,6], note: 'Short-duration crop; avoid water stress.' },
  { name: 'Black Gram', season: 'Kharif', sowing: [5,6,7], harvest: [8,9,10], note: 'Use suitable varieties and manage drainage.' }
]
const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar',
  'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh',
  'Lakshadweep', 'Puducherry'
]
function PriceTrendChart({ currentPrice, predictedPrice, historicalPrices = [] }) {
  const [selectedPoint, setSelectedPoint] = useState(null)

  const current = Number(currentPrice)
  const predicted = Number(predictedPrice)
  const valid = Number.isFinite(current) && current > 0 &&
                Number.isFinite(predicted) && predicted > 0

  const formatPrice = value => Number.isFinite(value)
    ? `Ã¢â€šÂ¹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
    : 'Unavailable'

  const records = (Array.isArray(historicalPrices) ? historicalPrices : [])
    .map(item => ({
      date: String(item.date || ''),
      price: Number(item.price)
    }))
    .filter(item => item.date && Number.isFinite(item.price) && item.price > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const visibleRecords = records
  const values = visibleRecords.map(item => item.price)
  const minValue = values.length ? Math.min(...values) : 0
  const maxValue = values.length ? Math.max(...values) : 0
  const average = values.length
    ? values.reduce((a, b) => a + b, 0) / values.length
    : 0

  const width = 760
  const height = 260
  const left = 58
  const right = 18
  const top = 22
  const bottom = 42
  const plotWidth = width - left - right
  const plotHeight = height - top - bottom

  const scaleMin = values.length
    ? Math.min(minValue, valid ? predicted : minValue) * .94 : 0
  const scaleMax = values.length
    ? Math.max(maxValue, valid ? predicted : maxValue) * 1.06 : 1
  const scaleRange = Math.max(1, scaleMax - scaleMin)

  const pointX = index => visibleRecords.length <= 1
    ? left + plotWidth / 2
    : left + index / (visibleRecords.length - 1) * plotWidth

  const pointY = value => top + (scaleMax - value) / scaleRange * plotHeight

  const plotted = visibleRecords.map((item, index) => ({
    ...item,
    x: pointX(index),
    y: pointY(item.price)
  }))

  const linePoints = plotted.map(p => `${p.x},${p.y}`).join(' ')
  const selectedItem = selectedPoint === null ? null : plotted[selectedPoint]

  const ticks = Array.from({ length: 5 }, (_, i) =>
    scaleMax - (scaleRange * i / 4)
  )

  return (
    <section className="agro-premium-chart agro-gauge-card">
      <div className="agro-chart-heading">
        <div>
          <span className="agro-chart-eyebrow">FARMER MARKET INSIGHTS</span>
          <h4>Historical Market Price Trend</h4>
          <p className="agro-history-subtitle">
            Explore all recorded prices and compare them with the AI estimate
          </p>
        </div>
        <span className="agro-chart-unit">Ã¢â€šÂ¹ / quintal</span>
      </div>

      <div className="agro-history-toolbar">
        <span>Historical price movement - All available records</span>
      </div>

      {visibleRecords.length >= 2 ? (
        <>
          <div className="agro-history-chart-wrap">
            <svg className="agro-history-svg" viewBox={`0 0 ${width} ${height}`}
              role="group" aria-label="All available historical market prices chart">

              {ticks.map((tick, i) => {
                const y = top + i / 4 * plotHeight
                return (
                  <g key={i}>
                    <line x1={left} x2={width - right} y1={y} y2={y}
                      className="agro-history-gridline" />
                    <text x={left - 9} y={y + 4} textAnchor="end"
                      className="agro-history-axis-label">
                      {Math.round(tick).toLocaleString('en-IN')}
                    </text>
                  </g>
                )
              })}

              <line x1={left} x2={left} y1={top} y2={height - bottom}
                className="agro-history-axis" />

              {valid && (
                <>
                  <line x1={left} x2={width - right}
                    y1={pointY(predicted)} y2={pointY(predicted)}
                    className="agro-history-prediction-line" />
                  <text x={width - right - 3}
                    y={Math.max(13, pointY(predicted) - 8)}
                    textAnchor="end" className="agro-history-prediction-label">
                    AI estimate {formatPrice(predicted)}
                  </text>
                </>
              )}

              <polyline points={linePoints} className="agro-history-line" />

              {plotted.map((point, index) => (
                <g key={`${point.date}-${index}`}>
                  <circle cx={point.x} cy={point.y} r="12"
                    className="agro-history-hit"
                    onClick={() => setSelectedPoint(index)}
                    onMouseEnter={() => setSelectedPoint(index)}
                    role="button" tabIndex="0"
                    aria-label={`${point.date}: ${formatPrice(point.price)}`}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ')
                        setSelectedPoint(index)
                    }} />
                  <circle cx={point.x} cy={point.y}
                    r={selectedPoint === index ? 7 : 4.5}
                    className={selectedPoint === index
                      ? 'agro-history-dot selected' : 'agro-history-dot'}
                    pointerEvents="none" />
                </g>
              ))}
            </svg>
          </div>

          <div className="agro-history-stats">
            <div><small>HIGHEST RECORDED</small><strong>{formatPrice(maxValue)}</strong></div>
            <div><small>AVERAGE RECORDED</small><strong>{formatPrice(average)}</strong></div>
            <div><small>LOWEST RECORDED</small><strong>{formatPrice(minValue)}</strong></div>
          </div>

          <div className="agro-history-legend">
            <span><i className="agro-history-line-key" /> Recorded market price</span>
            <span><i className="agro-history-dash-key" /> AI predicted price</span>
          </div>
        </>
      ) : (
        <div className="agro-history-empty">
          <strong>
            {visibleRecords.length === 1
              ? 'Only one historical price record is available'
              : 'No historical price records are available'}
          </strong>
          <span>
            Latest available dataset record: {records.length
              ? records[records.length - 1].date
              : 'No date available'}.
          </span>
        </div>
      )}
    </section>
  )
}
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem('agrovision_token') || sessionStorage.getItem('agrovision_token'))
  )
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('agrovision_user') || sessionStorage.getItem('agrovision_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [profileOpen, setProfileOpen] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [activePage, setActivePage] = useState('home')
  const [selectedCalendarMonth, setSelectedCalendarMonth] = useState(new Date().getMonth())
  const [selectedCalendarSeason, setSelectedCalendarSeason] = useState('All')

  const handleAuthenticated = (userData) => {
    setCurrentUser(userData)
    setIsAuthenticated(true)
    setShowLogin(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('agrovision_token')
    sessionStorage.removeItem('agrovision_token')
    localStorage.removeItem('agrovision_user')
    sessionStorage.removeItem('agrovision_user')
    setCurrentUser(null)
    setProfileOpen(false)
    setIsAuthenticated(false)
    setActivePage('home')
    setShowLogin(true)
  }
  const [options, setOptions] = useState({ states: [], crops: [], districts: [], markets: [], coverage: null })
  const states = options.states
  const crops = options.crops

  const [crop, setCrop] = useState('')
  const [stateName, setStateName] = useState('Karnataka')
  const [district, setDistrict] = useState('')
  const [market, setMarket] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [gps, setGps] = useState(null)
  const [weather, setWeather] = useState(null)
  const [weatherError, setWeatherError] = useState('')
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [selectedForecastDay, setSelectedForecastDay] = useState(0)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantTab, setAssistantTab] = useState('chat')
  const [assistantHistory, setAssistantHistory] = useState([])

  const [question, setQuestion] = useState('')
  const [reply, setReply] = useState('Hello! Ask me about crop prices, weather, market selection, or seasonal crop planning.')
  const [assistantLanguage, setAssistantLanguage] = useState('en-IN')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const recognitionRef = useRef(null)

  const districts = options.districts
  const markets = options.markets

  // Never leave a previous crop's prediction visible after the selection changes.
  const clearForecast = () => {
    setPrediction(null)
    setError('')
  }

  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams()

    if (stateName) params.set('state', stateName)
    if (district) params.set('district', district)
    if (market) params.set('market', market)

    fetch(`${API_BASE}/options?${params.toString()}`)
      .then(response => {
        if (!response.ok) throw new Error('Could not load crop and location options')
        return response.json()
      })
      .then(data => {
        if (!cancelled) {
          setOptions(data)
          setCrop(currentCrop =>
            data.crops?.includes(currentCrop) ? currentCrop : ''
          )
          setPrediction(null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOptions({ states: [], crops: [], districts: [], markets: [], coverage: null })
          setPrediction(null)
          setError('Could not load crop/location options. Check that the backend is running, then refresh this page.')
        }
      })

    return () => { cancelled = true }
  }, [stateName, district, market])

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Your browser does not support GPS location.')
      return
    }
    setWeatherLoading(true)
    setWeatherError('')
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      setGps({ lat: coords.latitude, lon: coords.longitude })
      setError('')
      try {
        const params = new URLSearchParams({
          latitude: coords.latitude,
          longitude: coords.longitude,
          current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code',
          daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset',
          timezone: 'auto',
          forecast_days: '5'
        })
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
        if (!response.ok) throw new Error('Weather service unavailable')
        setWeather(await response.json())
        setSelectedForecastDay(0)
        setWeatherError('')
      } catch {
        setWeatherError('Could not load weather. Please check your internet connection and try again.')
      } finally {
        setWeatherLoading(false)
      }
    }, () => {
      setWeatherLoading(false)
      setError('Location permission was not granted. Please allow location access and try again.')
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 })
  }

  const getPrediction = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setPrediction(null)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crop, state: stateName, district, market, date }),
        signal: AbortSignal.timeout(90000)
      })

      const data = await response.json()
      if (!response.ok || data.status === 'error') {
        throw new Error(data.message || data.error || 'The model could not predict this location.')
      }

      setPrediction(data)
    } catch (err) {
      setError(
        err.name === 'TimeoutError'
          ? 'The prediction server is taking too long. Please try again.'
          : (err.message || 'Could not connect to the prediction service.')
      )
    } finally {
      setLoading(false)
    }
  }
  const getAssistantReply = (text) => {
    const q = text.toLowerCase()

    if (q.includes('weather') || q.includes('rain') || q.includes('temperature')) {
      return weather
        ? `Current temperature is ${weather.current.temperature_2m} degrees Celsius, humidity is ${weather.current.relative_humidity_2m} percent, and wind speed is ${weather.current.wind_speed_10m} kilometres per hour. Check the local forecast before making field decisions.`
        : 'Please open Weather and GPS and select Detect my location to load your local weather forecast.'
    }

    if (q.includes('price') || q.includes('tomato') || q.includes('onion') || q.includes('market') || q.includes('crop')) {
      return 'To estimate a crop price, open Price Analysis, select your crop, state, district and market, then choose Generate AI Forecast. The result depends on the historical data available for that selection.'
    }

    if (q.includes('calendar') || q.includes('plant') || q.includes('season') || q.includes('sowing') || q.includes('harvest')) {
      return 'Open Crop Calendar to view general sowing and harvest guidance. Timing varies by district, rainfall and crop variety, so confirm the final plan with your local agriculture office.'
    }

    if (q.includes('location') || q.includes('gps')) {
      return 'Open Weather and GPS, then select Detect my location. Allow location permission in your browser to view your coordinates and local weather.'
    }

    if (q.includes('hello') || q.includes('hi ') || q === 'hi') {
      return 'Hello! Welcome to AgroVision AI. I can help you use crop price prediction, weather and GPS, and the crop calendar. What would you like to know?'
    }

    return 'I can help with crop price forecasts, weather, GPS location, crop selection, sowing seasons and harvest planning. Please ask me about one of these topics.'
  }

  const speakAssistantReply = (text) => {
    if (!('speechSynthesis' in window)) {
      setReply(text + ' Your browser does not support spoken responses.')
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = assistantLanguage
    utterance.rate = 0.95
    utterance.pitch = 1
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const stopAssistantVoice = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }

  const startAssistantListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setReply('Voice recognition is not available in this browser. Please use the latest Chrome or Edge browser, or type your question.')
      return
    }

    if (recognitionRef.current) {
      recognitionRef.current.abort()
    }

    const recognition = new SpeechRecognition()
    recognition.lang = assistantLanguage
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setReply('I am listening. Please speak your question clearly.')
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim()
      setQuestion(transcript)
      const answer = getAssistantReply(transcript)
      setReply(answer)
      setAssistantHistory(previous => [
        { question: transcript, reply: answer, time: new Date().toLocaleTimeString() },
        ...previous
      ].slice(0, 20))
      speakAssistantReply(answer)
    }

    recognition.onerror = (event) => {
      setIsListening(false)
      if (event.error === 'not-allowed') {
        setReply('Microphone access was blocked. Allow microphone permission in your browser settings and try again.')
      } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
        setReply('I could not recognise that clearly. Please try speaking again or type your question.')
      }
    }

    recognition.onend = () => setIsListening(false)
    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch {
      setIsListening(false)
      setReply('The microphone could not start. Please try again.')
    }
  }

  const runAssistantPrompt = (text) => {
    const cleanText = text.trim()
    if (!cleanText) return
    const answer = getAssistantReply(cleanText)
    setQuestion(cleanText)
    setReply(answer)
    setAssistantHistory(previous => [
      { question: cleanText, reply: answer, time: new Date().toLocaleTimeString() },
      ...previous
    ].slice(0, 20))
    speakAssistantReply(answer)
    setAssistantTab('chat')
  }

  const answerAssistant = (e) => {
    e.preventDefault()
    runAssistantPrompt(question)
  }

  const trend = useMemo(() => [42, 48, 45, 56, 52, 65, 61, 72, 68, 79, 75, 86], [])
  const points = trend.map((v, i) => `${i * 40},${120 - v}`).join(' ')

  // Require authentication before showing any application page.
  if (!isAuthenticated) {
    return (
      <div className="agro-auth-overlay">
        <div className="agro-auth-content">
          <Auth onAuthenticated={handleAuthenticated} />
        </div>
      </div>
    )
  }
  return <div className="app-shell" onClick={(e) => {
    if (!e.target.closest('.topbar-account')) setProfileOpen(false)
  }}>
    <header className="topbar clean-topbar account-only-header">
      <div className="topbar-account">
        <button type="button" className="topbar-login"
          onClick={() => { if (!isAuthenticated) { setShowLogin(true); setProfileOpen(false) } else { setProfileOpen(v => !v) } }} aria-expanded={profileOpen}>
          {isAuthenticated
            ? (currentUser?.email || 'My Account')
            : 'Login'}
          <span aria-hidden="true"> &#9662;</span>
        </button>
        {profileOpen && (
          <div className="topbar-account-menu">
            {isAuthenticated
              ? <button type="button" onClick={handleLogout}>Logout</button>
              : <span>You are not logged in.</span>}
          </div>
        )}
      </div>
    </header>
    {showLogin && (
      <div className="agro-auth-overlay" onClick={() => setShowLogin(false)}>
        <button
          type="button"
          className="agro-auth-close"
          onClick={() => setShowLogin(false)}
          aria-label="Close login"
        >&times;</button>
        <div className="agro-auth-content" onClick={(e) => e.stopPropagation()}>
          <Auth onAuthenticated={handleAuthenticated} />
        </div>
      </div>
    )}
    <main>
      {activePage === 'home' && <section className="home-hero">
        <div className="home-content">
          <span className="eyebrow">SMART AGRICULTURE | AI POWERED</span>
          <h1 className="hero-marquee-heading">
  <span className="hero-marquee-track">
    <span>Welcome to <span>AgroVision AI</span></span>
    <span aria-hidden="true">Welcome to <span>AgroVision AI</span></span>
  </span>
</h1>
          <h2>Smarter Crop Prices. Stronger Harvests.</h2>
          <p>Explore smarter farming with intelligent agricultural tools, local weather insights and AI-powered crop price forecasts.</p>
          <div className="home-navigation">
            <button onClick={() => setActivePage('agriculture')} className="home-feature-card">
              <span className="feature-icon">&#127793;</span><strong>Explore Agriculture</strong><small>Discover crops and farming</small>
            </button>
            <button onClick={() => setActivePage('weather')} className="home-feature-card">
              <span className="feature-icon">&#127780;&#65039;</span><strong>Weather & GPS</strong><small>Local weather conditions</small>
            </button>
            <button onClick={() => setActivePage('calendar')} className="home-feature-card">
              <span className="feature-icon">&#128197;</span><strong>Crop Calendar</strong><small>Plan seasonal cultivation</small>
            </button>
            <button onClick={() => setActivePage('prices')} className="home-feature-card">
              <span className="feature-icon">&#128200;</span><strong>Price Analysis</strong><small>AI-powered price forecasts</small>
            </button>
          </div>
        </div>
      </section>}
    {activePage === 'agriculture' && <div className="feature-page"><AgricultureHub /></div>}
   {activePage === 'weather' && <div className="feature-page"><section id="weather" className="section">
  <div className="section-heading">
    <div>
      <span className="eyebrow">LOCAL CONDITIONS</span>
      <h2>Weather & GPS</h2>
      <p className="weather-subtitle">Live local weather and farming insights</p>
    </div>
    <button className="primary-button weather-refresh" onClick={detectLocation} disabled={weatherLoading}>
      {weatherLoading ? 'Loading weather...' : (gps ? 'Refresh weather' : 'Detect my location')}
    </button>
  </div>
  {error && <p className="notice error">{error}</p>}
  {weatherError && <p className="notice error">{weatherError}</p>}

  <div className="weather-grid">
    <article className="weather-card weather-current">
      <div className="weather-icon">&#127782;&#65039;</div>
      <h3>Current Weather</h3>
      {weather ? <>
        <strong className="temperature">{weather.current.temperature_2m}&deg;C</strong>
        <p>{({0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',48:'Depositing rime fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',71:'Light snow',73:'Snow',75:'Heavy snow',80:'Rain showers',81:'Rain showers',82:'Heavy rain showers',95:'Thunderstorm'}[weather.current.weather_code] || 'Variable conditions')}</p>
        <div className="weather-stats">
          <div><span>Feels like</span><strong>{weather.current.apparent_temperature}&deg;C</strong></div>
          <div><span>Humidity</span><strong>{weather.current.relative_humidity_2m}%</strong></div>
          <div><span>Wind</span><strong>{weather.current.wind_speed_10m} km/h</strong></div>
        </div>
      </> : <p>{weatherLoading ? 'Fetching your local weather...' : 'Detect your location to fetch live weather.'}</p>}
    </article>

    <article className="weather-card forecast-card">
      <h3>5-Day Forecast</h3>
      <p className="forecast-hint">Select a day to explore its forecast</p>
      {weather ? weather.daily.time.map((day, i) =>
        <button type="button" className={`forecast-row forecast-button ${selectedForecastDay === i ? 'active' : ''}`} key={day} onClick={() => setSelectedForecastDay(i)}>
          <span>{new Date(`${day}T12:00:00`).toLocaleDateString('en-IN',{weekday:'short',day:'numeric'})}</span>
          <span>{weather.daily.temperature_2m_min[i]}&deg; - {weather.daily.temperature_2m_max[i]}&deg;C</span>
          <span>Rain chance: {weather.daily.precipitation_probability_max[i]}%</span>
        </button>
      ) : <p>{weatherLoading ? 'Loading forecast...' : 'Your 5-day forecast will appear here.'}</p>}
    </article>
  </div>
</section></div>}{activePage === 'calendar' && <div className="feature-page"><section id="calendar" className="section crop-calendar-page">
  <div className="section-heading">
    <div><h2>Crop Calendar</h2></div>

  </div>
<h1 className="crop-calendar-title">Crop Calendar</h1>
  <div className="calendar-month-grid">
    {calendarMonths.map((month, index) =>
      <button key={month} type="button"
        className={selectedCalendarMonth === index ? 'calendar-month active' : 'calendar-month'}
        onClick={() => setSelectedCalendarMonth(index)}>
        <span>{month.slice(0,3)}</span>
        <small>{calendarCrops.filter(item =>

          (item.sowing.includes(index) || item.harvest.includes(index))
        ).length} activities</small>
      </button>
    )}
  </div>

  <div className="calendar-activity-heading">
    <div><span className="eyebrow">MONTHLY FARMING ACTIVITIES</span><h3>{calendarMonths[selectedCalendarMonth]}</h3></div>
    <span>{calendarCrops.filter(item =>

      (item.sowing.includes(selectedCalendarMonth) || item.harvest.includes(selectedCalendarMonth))
    ).length} crop activities</span>
  </div>

  <div className="calendar-crop-grid">
    {calendarCrops.filter(item =>

      (item.sowing.includes(selectedCalendarMonth) || item.harvest.includes(selectedCalendarMonth))
    ).map(item => <article className="calendar-crop-card" key={item.name}>
      <div className="calendar-crop-card-top"><h4>{item.name}</h4><span>{item.season}</span></div>
      <div className="calendar-activity-tags">
        {item.sowing.includes(selectedCalendarMonth) && <span className="calendar-sowing">Sowing</span>}
        {item.harvest.includes(selectedCalendarMonth) && <span className="calendar-harvest">Harvesting</span>}
      </div>
      <p>{item.note}</p>
      <small>Typical timing - Verify local conditions</small>
    </article>)}
    {calendarCrops.filter(item =>

      (item.sowing.includes(selectedCalendarMonth) || item.harvest.includes(selectedCalendarMonth))
    ).length === 0 && <p className="calendar-no-results">No listed activities for this month and season. Try another filter.</p>}
  </div>

  <div className="calendar-legend">
    <span><i className="legend-sowing"></i> Sowing</span>
    <span><i className="legend-harvest"></i> Harvesting</span>
  </div>
  <p className="fine-print">General Indian crop guidance only. Actual sowing and harvest dates vary by state, district, rainfall, irrigation and crop variety. Confirm with your local agriculture department.</p>
</section></div>}{activePage === 'prices' && <div className="feature-page"><section id="prices" className="section price-section">
  <div className="section-heading">
    <div>
      <span className="eyebrow">AI-POWERED FORECAST</span>
      <h2>Crop Price Prediction</h2>
    </div>
    <p>Choose your crop and location to view the estimated price.</p>
  </div>
  <div className="prediction-layout">
    <form className="prediction-form" onSubmit={getPrediction}>
      <label>State
        <select value={stateName} onChange={e => { setStateName(e.target.value); setDistrict(''); setMarket(''); setCrop(''); clearForecast() }} disabled={!states.length} required>
          <option value="">Select state</option>
          {states.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label>District
        <select value={district} onChange={e => { setDistrict(e.target.value); setMarket(''); setCrop(''); clearForecast() }} disabled={!districts.length} required>
          <option value="">{districts.length ? 'Select district' : 'No matching districts'}</option>
          {districts.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
        {crop && stateName && districts.length === 0 && <small className="fine-print">No district data was found for this crop and state. Try another crop or state.</small>}
      </label>
      <label>Market
        <select value={market} onChange={e => { setMarket(e.target.value); setCrop(''); clearForecast() }} disabled={!markets.length} required>
          <option value="">{markets.length ? 'Select market' : 'No matching markets'}</option>
          {markets.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
        {district && markets.length === 0 && <small className="fine-print">No market data was found for this selection. Choose another district.</small>}
      </label>
      <label>Crop
        <select value={crop} onChange={e => { setCrop(e.target.value); clearForecast() }} disabled={!crops.length} required>
          <option value="">Select crop</option>
          {crops.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <button className="primary-button" type="submit" disabled={loading || !crop || !stateName || !district || !market}>
        {loading ? "Generating forecast..." : "Generate AI Forecast"}
      </button>
    </form>
    <div className="prediction-result">
      {!prediction && !loading && <div className="forecast-empty"><span>AI PRICE FORECAST</span><h3>Your forecast will appear here</h3><p>Select your location and crop to view the estimated market price.</p></div>}
      {loading && <p>Generating your forecast...</p>}
      {prediction && (() => {
        const predictedPrice = Number(prediction.predicted_modal_price)
        const currentPrice = Number(prediction.previous_price)
        const hasCurrentPrice = Number.isFinite(currentPrice) && currentPrice > 0
        const hasPredictedPrice = Number.isFinite(predictedPrice) && predictedPrice > 0
        const trendPercent = hasCurrentPrice && hasPredictedPrice ? ((predictedPrice - currentPrice) / currentPrice) * 100 : null
        const recommendation = trendPercent === null || Math.abs(trendPercent) < 0.01 ? "COMPARE" : trendPercent < 0 ? "SELL" : "HOLD"
        const recommendationClass = recommendation === "SELL" ? "action-sell" : recommendation === "HOLD" ? "action-hold" : "action-neutral"
        const advice = recommendation === "SELL" ? "Sell now before prices fall" : recommendation === "HOLD" ? "Hold for better market prices" : "Compare local prices before deciding"
        return <>
          <button
  type="button"
  className="export-forecast-pdf"
  onClick={async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    const money = value => "Rs. " + Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 });

    doc.setFontSize(20);
    doc.text("AgroVision AI - Crop Price Forecast", 18, 22);
    doc.setFontSize(11);
    doc.text("Generated: " + new Date().toLocaleString("en-IN"), 18, 34);
    doc.line(18, 40, 192, 40);

    const lines = [
      "State: " + stateName,
      "District: " + district,
      "Market: " + market,
      "Crop: " + crop,
      "",
      "Current Market Price (latest recorded): " + (hasCurrentPrice ? money(currentPrice) + " per quintal" : "Unavailable"),
      "Price Source: Historical dataset (latest recorded)",
      "AI Predicted Price: " + (hasPredictedPrice ? money(predictedPrice) + " per quintal" : "Unavailable"),
      "Expected Price Change: " + (trendPercent === null ? "Unavailable" : trendPercent.toFixed(1) + "%"),
      "",
      "AI Recommendation: " + recommendation,
      "Market Advice: " + advice,
      "",
      "Note: This is an AI-generated estimate, not a guaranteed market price."
    ];

    doc.text(lines, 18, 52, { maxWidth: 174, lineHeightFactor: 1.7 });
    doc.save("AgroVision-AI-Crop-Forecast.pdf");
  }}
>
  Export PDF
</button>
          <div className="price-result-heading"><span>&#128200;</span><h3>Price Forecast & Trading Advice</h3></div>
          <div className="price-result-grid">
                        <article className={`market-price-card current-market-price ${recommendationClass}`}>
              <span>Current Market Price</span>
              <strong className="market-price-value">{hasCurrentPrice ? `\u20B9${currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}` : 'Unavailable'}</strong>
              {hasCurrentPrice && <small>Per quintal - &#8377;{(currentPrice / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })} per kg</small>}
              <small>Latest recorded market rate (historical dataset)</small>
            </article>
            <article className={`market-price-card predicted-market-price ${recommendationClass}`}>
              <span>AI Predicted Price</span>
              <strong className="market-price-value">{hasPredictedPrice ? `\u20B9${predictedPrice.toLocaleString("en-IN",{maximumFractionDigits:2})}` : "Unavailable"}</strong>
              {hasPredictedPrice && <small>Per quintal - &#8377;{(predictedPrice / 100).toLocaleString("en-IN",{maximumFractionDigits:2})} per kg</small>}
              <small>AI estimated price</small>
            </article>
          </div>
          <div className={`forecast-action-block ${recommendationClass}`}>
            <span>AI Market Advice</span>
            <strong className={`action-pill ${recommendationClass}`}>{recommendation}</strong>
            <p>{advice}</p>
            {trendPercent !== null && <small>Expected change: {trendPercent > 0 ? "+" : ""}{trendPercent.toFixed(1)}%</small>}
          </div>
        </>
      })()}
    </div>
  </div>
  {prediction && (
    <div className="prediction-bottom-chart">
      <PriceTrendChart
        currentPrice={Number(prediction.previous_price)}
        predictedPrice={Number(prediction.predicted_modal_price)}
        historicalPrices={prediction.historical_prices || []}
      />
    </div>
  )}
  {error && <p className="notice error">{error}</p>}
</section></div>}</main>
    <footer>AgroVision AI | Practical insights for informed agricultural decisions</footer>
    {activePage !== 'home' && (
  <button
    type="button"
    className="section-home-button"
    onClick={() => setActivePage('home')}
  >
    &#8592; Back to Home
  </button>
)}
<button className="assistant-fab" onClick={() => setAssistantOpen(v => !v)} aria-label="Open AgroVision Assistant">Assistant</button>

    {assistantOpen && <aside className="assistant-panel assistant-compact">
      <header className="compact-assistant-header">
        <div>
          <div className="assistant-marquee">
  <strong>AGROVISION AI ASSISTANT</strong>
</div>
          {isListening && <small>Listening</small>}
        </div>
        <button type="button" className="compact-close"
          onClick={() => { stopAssistantVoice(); recognitionRef.current?.abort(); setIsListening(false); setAssistantOpen(false) }}>
          &times;
        </button>
      </header>
    {showLogin && (
      <div className="agro-auth-overlay" onClick={() => setShowLogin(false)}>
        <button
          type="button"
          className="agro-auth-close"
          onClick={() => setShowLogin(false)}
          aria-label="Close login"
        >&times;</button>
        <div className="agro-auth-content" onClick={(e) => e.stopPropagation()}>
          <Auth onAuthenticated={handleAuthenticated} />
        </div>
      </div>
    )}

      <div className="compact-chat-messages" aria-live="polite">
        <div className="compact-bot-message">
          Hello! I can help with crop prices, weather, crop recommendations, crop health and farming guidance.
        </div>
        {question && <div className="compact-user-message"><span>{question}</span></div>}
        <div className="compact-bot-message">
          {reply}
          <button type="button" className="compact-listen" onClick={() => speakAssistantReply(reply)}>
            Listen to answer
          </button>
        </div>
        {isListening && <div className="compact-status">Listening to your question...</div>}
      </div>

      <div className="compact-language">
        <label htmlFor="compact-assistant-language">Language</label>
        <select id="compact-assistant-language" value={assistantLanguage}
          onChange={e=>setAssistantLanguage(e.target.value)}>
          <option value="en-IN">English</option>
          <option value="kn-IN">Kannada</option>
          <option value="hi-IN">Hindi</option>
        </select>
      </div>

      <form className="compact-compose" onSubmit={answerAssistant}>
        <button type="button" className="compact-mic" onClick={startAssistantListening}
          disabled={isListening} aria-label="Speak your question">
          {isListening ? 'Listening' : 'Mic'}
        </button>
        <input value={question} onChange={e=>setQuestion(e.target.value)}
          placeholder="Type or speak your question..." />
        <button type="submit" className="compact-send">Send</button>
      </form>

      <div className="compact-assistant-bottom">
        <span>Voice-enabled farming help</span>
        <button type="button" onClick={stopAssistantVoice} disabled={!isSpeaking}>Stop voice</button>
      </div>
    </aside>}


  </div>
}
export default App
