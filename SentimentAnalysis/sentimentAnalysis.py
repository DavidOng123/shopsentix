from flask import Flask, request, jsonify
import re
import string
from nltk.corpus import stopwords
import nltk
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
import joblib

app = Flask(__name)

nltk.download('stopwords')

# Load the trained model and vectorizer
trained_model = joblib.load('sentiment_model.joblib')
trained_vectorizer = joblib.load('tfidf_vectorizer.joblib')

def clean_text(text):
    text = text.lower()
    text = ''.join([char for char in text if char not in string.punctuation])
    words = text.split()
    stop_words = set(stopwords.words('english'))
    words = [word for word in words if word not in stop_words]
    cleaned_text = ' '.join(words)
    return cleaned_text

@app.route('/predict_sentiment', methods=['POST'])
def predict_sentiment():
    try:
        data = request.json
        text = data['text']
        cleaned_text = clean_text(text)

        # Vectorize the text data using the pre-trained vectorizer
        text_tfidf = trained_vectorizer.transform([cleaned_text])

        # Make predictions using the pre-trained model
        sentiment = trained_model.predict(text_tfidf)[0]

        return jsonify({'sentiment': sentiment})
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main':
    app.run(host='localhost', port=5000)
