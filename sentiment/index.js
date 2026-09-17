const natural = require('natural')
const express = require('express')

const app = express()

app.use(express.json())

app.post('/sentiment', (req, res) => {
  try {
    const { sentence } = req.query

    const analyzer = new natural.SentimentAnalyzer(
      'English',
      natural.PorterStemmer,
      'afinn'
    )

    const tokenizer = new natural.WordTokenizer()
    const tokens = tokenizer.tokenize(sentence)

    const analysisResult = analyzer.getSentiment(tokens)

    let sentiment = 'neutral'

    if (analysisResult < 0) {
      sentiment = 'negative'
    } else if (analysisResult >= 0 && analysisResult <= 0.33) {
      sentiment = 'neutral'
    } else {
      sentiment = 'positive'
    }

    res.status(200).json({
      sentimentScore: analysisResult,
      sentiment
    })
  } catch (error) {
    res.status(500).json({
      error: error.message
    })
  }
})

const port = 5000

app.listen(port, () => {
  console.log(`Sentiment server running on port ${port}`)
})
