from flask_cors import CORS, cross_origin
from flask import Flask, request, jsonify
import string
from nltk.corpus import stopwords
import nltk
import joblib



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


def predict_sentiment():
    try:

        text = 'abc'
        print(f"Received text: {text}")
        cleaned_text = clean_text(text)

        # Vectorize the text data using the pre-trained vectorizer
        text_tfidf = trained_vectorizer.transform([cleaned_text])

        # Make predictions using the pre-trained model
        sentiment = trained_model.predict(text_tfidf)[0]

        print({'sentiment': sentiment})
    except Exception as e:
        return {'error': str(e)}

predict_sentiment()