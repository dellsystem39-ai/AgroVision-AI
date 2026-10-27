
import { useState } from 'react'
import './App.css'

const marketData = [
  { crop: 'Tomato', market: 'Kolar', price: 2400, change: '+8.2%' },
  { crop: 'Onion', market: 'Bengaluru', price: 1850, change: '+3.4%' },
  { crop: 'Potato', market: 'Mysuru', price: 2100, change: '-1.8%' },
  { crop: 'Maize', market: 'Davanagere', price: 2250, change: '+4.6%' },
]

function App() {
  const [crop, setCrop] = useState('Tomato')
  const [state, setState] = useState('Karnataka')
  const [district, setDistrict] = useState('Kolar')
  const [prediction, setPrediction] = useState(null)
  const [language, setLanguage] = useState('EN')
  const [showAssistant, setShowAssistant] = useState(true)

  const translations = {
    EN: {
      home: 'Home', dashboard: 'Dashboard', predict: 'Price Prediction',
      markets: 'Market Prices', weather: 'Weather',
      badge: 'SMART AGRICULTURE · BETTER DECISIONS',
      title1: 'Smarter crop prices,',
      title2: 'stronger harvests.',
      description: 'Empowering farmers with AI-powered crop price insights, market intelligence and data-driven decisions for a more profitable future.',
      start: 'Get Started →', explore: 'Explore Predictions',
      stats: 'Real insights for modern agriculture',
      stat1: 'Historical price records', stat2: 'Crops tracked',
      stat3: 'Market intelligence', stat4: 'AI-powered insights',
      features: 'Everything you need to grow',
      featuresText: 'One platform for smarter agricultural decisions.',
      f1: 'AI Price Prediction', f2: 'Live Market Intelligence', f3: 'Crop Insights',
      fd1: 'Estimate crop prices from your selected crop and market information.',
      fd2: 'Explore market prices and compare commodity values across locations.',
      fd3: 'Use historical trends to understand market movements.',
      open: 'Explore feature →', predTitle: 'Predict crop prices',
      predText: 'Select your crop and location to explore a price estimate.',
      crop: 'Crop', state: 'State', district: 'District',
      predictBtn: 'Get Price Estimate', result: 'Demo price estimate',
      marketTitle: 'Market price overview', marketText: 'Sample market data for demonstration.',
      market: 'Market', price: 'Price / quintal', change: 'Change',
      assistant: 'AgroVision Assistant',
      assistantText: 'Welcome! What would you like to explore today?',
      q1: 'Predict crop prices', q2: 'Explore market prices',
      footer: 'AI-powered insights for a more sustainable agricultural future.'
    },
    HI: {
      home: 'होम', dashboard: 'डैशबोर्ड', predict: 'मूल्य अनुमान',
      markets: 'बाज़ार भाव', weather: 'मौसम',
      badge: 'स्मार्ट कृषि · बेहतर निर्णय',
      title1: 'बेहतर फसल मूल्य,', title2: 'बेहतर भविष्य।',
      description: 'AI आधारित फसल मूल्य जानकारी और बाज़ार विश्लेषण से किसानों को बेहतर निर्णय लेने में मदद।',
      start: 'शुरू करें →', explore: 'मूल्य अनुमान देखें',
      stats: 'आधुनिक कृषि के लिए उपयोगी जानकारी',
      stat1: 'ऐतिहासिक मूल्य रिकॉर्ड', stat2: 'फसलें',
      stat3: 'बाज़ार जानकारी', stat4: 'AI जानकारी',
      features: 'बेहतर खेती के लिए सब कुछ',
      featuresText: 'कृषि निर्णयों के लिए एक मंच।',
      f1: 'AI मूल्य अनुमान', f2: 'बाज़ार जानकारी', f3: 'फसल विश्लेषण',
      fd1: 'फसल और बाज़ार के आधार पर मूल्य अनुमान देखें।',
      fd2: 'विभिन्न बाज़ारों में कीमतों की तुलना करें।',
      fd3: 'ऐतिहासिक मूल्य रुझान देखें।',
      open: 'देखें →', predTitle: 'फसल मूल्य अनुमान',
      predText: 'अनुमान देखने के लिए फसल और स्थान चुनें।',
      crop: 'फसल', state: 'राज्य', district: 'ज़िला',
      predictBtn: 'मूल्य देखें', result: 'डेमो मूल्य अनुमान',
      marketTitle: 'बाज़ार मूल्य', marketText: 'प्रदर्शन के लिए नमूना डेटा।',
      market: 'बाज़ार', price: 'मूल्य / क्विंटल', change: 'बदलाव',
      assistant: 'AgroVision सहायक',
      assistantText: 'नमस्ते! आज आप क्या देखना चाहेंगे?',
      q1: 'फसल मूल्य देखें', q2: 'बाज़ार भाव देखें',
      footer: 'बेहतर कृषि भविष्य के लिए AI जानकारी।'
    },
    KN: {
      home: 'ಮುಖಪುಟ', dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', predict: 'ಬೆಲೆ ಮುನ್ಸೂಚನೆ',
      markets: 'ಮಾರುಕಟ್ಟೆ ಬೆಲೆ', weather: 'ಹವಾಮಾನ',
      badge: 'ಸ್ಮಾರ್ಟ್ ಕೃಷಿ · ಉತ್ತಮ ನಿರ್ಧಾರಗಳು',
      title1: 'ಉತ್ತಮ ಬೆಳೆ ಬೆಲೆ,', title2: 'ಉತ್ತಮ ಭವಿಷ್ಯ.',
      description: 'AI ಆಧಾರಿತ ಬೆಳೆ ಬೆಲೆ ಮಾಹಿತಿ ಮತ್ತು ಮಾರುಕಟ್ಟೆ ವಿಶ್ಲೇಷಣೆಯ ಮೂಲಕ ರೈತರಿಗೆ ಉತ್ತಮ ನಿರ್ಧಾರಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಲು ಸಹಾಯ.',
      start: 'ಪ್ರಾರಂಭಿಸಿ →', explore: 'ಮುನ್ಸೂಚನೆ ನೋಡಿ',
      stats: 'ಆಧುನಿಕ ಕೃಷಿಗೆ ಉಪಯುಕ್ತ ಮಾಹಿತಿ',
      stat1: 'ಹಿಂದಿನ ಬೆಲೆ ದಾಖಲೆಗಳು', stat2: 'ಬೆಳೆಗಳು',
      stat3: 'ಮಾರುಕಟ್ಟೆ ಮಾಹಿತಿ', stat4: 'AI ಮಾಹಿತಿ',
      features: 'ಉತ್ತಮ ಕೃಷಿಗೆ ಬೇಕಾದ ಎಲ್ಲವೂ',
      featuresText: 'ಕೃಷಿ ನಿರ್ಧಾರಗಳಿಗೆ ಒಂದೇ ವೇದಿಕೆ.',
      f1: 'AI ಬೆಲೆ ಮುನ್ಸೂಚನೆ', f2: 'ಮಾರುಕಟ್ಟೆ ಮಾಹಿತಿ', f3: 'ಬೆಳೆ ವಿಶ್ಲೇಷಣೆ',
      fd1: 'ಬೆಳೆ ಮತ್ತು ಮಾರುಕಟ್ಟೆ ಆಧರಿಸಿ ಬೆಲೆ ಅಂದಾಜು ನೋಡಿ.',
      fd2: 'ವಿವಿಧ ಮಾರುಕಟ್ಟೆಗಳ ಬೆಲೆಗಳನ್ನು ಹೋಲಿಸಿ.',
      fd3: 'ಹಿಂದಿನ ಬೆಲೆಗಳ ಪ್ರವೃತ್ತಿ ತಿಳಿಯಿರಿ.',
      open: 'ತೆರೆಯಿರಿ →', predTitle: 'ಬೆಳೆ ಬೆಲೆ ಮುನ್ಸೂಚನೆ',
      predText: 'ಬೆಲೆ ಅಂದಾಜಿಗಾಗಿ ಬೆಳೆ ಮತ್ತು ಸ್ಥಳ ಆಯ್ಕೆಮಾಡಿ.',
      crop: 'ಬೆಳೆ', state: 'ರಾಜ್ಯ', district: 'ಜಿಲ್ಲೆ',
      predictBtn: 'ಬೆಲೆ ಅಂದಾಜು', result: 'ಡೆಮೊ ಬೆಲೆ ಅಂದಾಜು',
      marketTitle: 'ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು', marketText: 'ಪ್ರದರ್ಶನಕ್ಕಾಗಿ ಮಾದರಿ ಮಾಹಿತಿ.',
      market: 'ಮಾರುಕಟ್ಟೆ', price: 'ಬೆಲೆ / ಕ್ವಿಂಟಾಲ್', change: 'ಬದಲಾವಣೆ',
      assistant: 'AgroVision ಸಹಾಯಕ',
      assistantText: 'ನಮಸ್ಕಾರ! ಇಂದು ಏನು ನೋಡಲು ಬಯಸುತ್ತೀರಿ?',
      q1: 'ಬೆಳೆ ಬೆಲೆ ನೋಡಿ', q2: 'ಮಾರುಕಟ್ಟೆ ಬೆಲೆ ನೋಡಿ',
      footer: 'ಉತ್ತಮ ಕೃಷಿ ಭವಿಷ್ಯಕ್ಕಾಗಿ AI ಮಾಹಿತಿ.'
    }
  }

  const t = translations[language]

  
async function makeDemoPrediction() {
  try {
    setPrediction(null)

    const response = await fetch(
      'https://agrovision-ai-backend.onrender.com/predict',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          crop: crop,
          state: state,
          district: district,
          market: district,
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Prediction failed')
    }

    document.getElementById('prediction')?.scrollIntoView({
      behavior: 'smooth',
    })
  } catch (error) {
    alert('Could not get a prediction: ' + error.message)
  }
}

  return (
    <main className="app">
      <header className="navbar">
        <a className="brand" href="#home">
          <span className="brand-icon">🌱</span>
          <span>AgroVision AI</span>
        </a>

        <nav className="nav-links">
          <a href="#home">{t.home}</a>
          <a href="#dashboard">{t.dashboard}</a>
          <a href="#prediction">{t.predict}</a>
          <a href="#markets">{t.markets}</a>
          <a href="#features">{t.weather}</a>
        </nav>

        <div className="nav-actions">
          {['EN', 'HI', 'KN'].map((lang) => (
            <button
              key={lang}
              className="lang-button"
              onClick={() => setLanguage(lang)}
              style={language === lang ? { borderColor: '#8fe99c', color: '#a8f0a7' } : {}}
            >
              {lang}
            </button>
          ))}
        </div>
      </header>

      <section className="hero" id="home">
        <div className="eyebrow">✦ &nbsp; {t.badge}</div>
        <h1>
          {t.title1}<br />
          <span className="gradient-text">{t.title2}</span>
        </h1>
        <p>{t.description}</p>
        <div className="hero-buttons">
          <button className="primary-button" onClick={() => document.getElementById('prediction')?.scrollIntoView({ behavior: 'smooth' })}>
            {t.start}
          </button>
          <button className="outline-button" onClick={() => document.getElementById('markets')?.scrollIntoView({ behavior: 'smooth' })}>
            {t.explore}
          </button>
        </div>
      </section>

      <section className="stats" id="dashboard">
        {[
          ['📈', '100+', t.stat1, 'Historical data'],
          ['🌾', '14+', t.stat2, 'Crop categories'],
          ['🧭', 'Live', t.stat3, 'Market overview'],
          ['🤖', 'AI', t.stat4, 'Prediction tools'],
        ].map(([icon, value, label, note]) => (
          <article className="stat-card" key={label}>
            <div>{icon}</div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
            <div className="stat-note">{note}</div>
          </article>
        ))}
      </section>

      <section id="features">
        <div className="section-heading">
          <h2>{t.features}</h2>
          <p>{t.featuresText}</p>
        </div>
        <div className="features">
          {[
            ['🔮', t.f1, t.fd1, '#prediction'],
            ['📊', t.f2, t.fd2, '#markets'],
            ['🌦️', t.f3, t.fd3, '#dashboard'],
          ].map(([icon, title, description, link]) => (
            <article className="feature-card" key={title}>
              <div className="feature-icon">{icon}</div>
              <h3>{title}</h3>
              <p>{description}</p>
              <a className="feature-link" href={link}>{t.open}</a>
            </article>
          ))}
        </div>
      </section>

      <section className="dashboard-grid" id="prediction">
        <article className="panel" id="prediction-form">
          <h3>{t.predTitle}</h3>
          <p className="section-heading">{t.predText}</p>

          <label className="form-label">{t.crop}</label>
          <select className="form-control" value={crop} onChange={(e) => { setCrop(e.target.value); setPrediction(null) }}>
            {['Tomato', 'Onion', 'Potato', 'Maize', 'Rice', 'Ragi'].map((item) => <option key={item}>{item}</option>)}
          </select>

          <label className="form-label">{t.state}</label>
          <select className="form-control" value={state} onChange={(e) => setState(e.target.value)}>
            {['Karnataka', 'Tamil Nadu', 'Andhra Pradesh', 'Kerala', 'Maharashtra'].map((item) => <option key={item}>{item}</option>)}
          </select>

          <label className="form-label">{t.district}</label>
          <select className="form-control" value={district} onChange={(e) => setDistrict(e.target.value)}>
            {['Kolar', 'Bengaluru', 'Mysuru', 'Davanagere', 'Belagavi'].map((item) => <option key={item}>{item}</option>)}
          </select>

          <button className="primary-button" style={{ width: '100%', marginTop: 20 }} onClick={makeDemoPrediction}>
            {t.predictBtn}
          </button>

          {prediction !== null && (
            <div className="result">
              <strong>{t.result}</strong>
              <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8 }}>
        
                ₹{Number(typeof prediction === 'object'
  ? prediction.predicted_price ?? prediction.prediction ?? prediction.price
  : prediction).toLocaleString('en-IN')} / quintal
              </div>
              <div>{crop} · {district}, {state}</div>
              <small>This is a demonstration estimate, not a live model prediction.</small>
            </div>
          )}
        </article>

        <article className="panel" id="markets">
          <h3>{t.marketTitle}</h3>
          <p className="section-heading">{t.marketText}</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t.crop}</th>
                  <th>{t.market}</th>
                  <th>{t.price}</th>
                  <th>{t.change}</th>
                </tr>
              </thead>
              <tbody>
                {marketData.map((item) => (
                  <tr key={item.crop}>
                    <td>{item.crop}</td>
                    <td>{item.market}</td>
                    <td>₹{item.price.toLocaleString('en-IN')}</td>
                    <td style={{ color: item.change.startsWith('+') ? '#8fe99c' : '#ff9c87' }}>{item.change}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ color: '#90a997', fontSize: 11, marginTop: 15 }}>
            Sample values for interface demonstration only.
          </p>
        </article>
      </section>

      <footer>
        © 2026 AgroVision AI · {t.footer}
      </footer>

      {showAssistant && (
        <aside className="assistant">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="assistant-title">🌿 {t.assistant}</div>
            <button aria-label="Close assistant" onClick={() => setShowAssistant(false)}>✕</button>
          </div>
          <p>{t.assistantText}</p>
          <button onClick={() => document.getElementById('prediction')?.scrollIntoView({ behavior: 'smooth' })}>{t.q1}</button>
          <button onClick={() => document.getElementById('markets')?.scrollIntoView({ behavior: 'smooth' })}>{t.q2}</button>
        </aside>
      )}
    </main>
  )
}

export default App
