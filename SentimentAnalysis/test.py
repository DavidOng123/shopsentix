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

def rule_based_sentiment(text):
    positive_keywords = ["good", "great", "excellent", "like", "love", "wonderful", "amazing", "fantastic",
                         "outstanding", "perfect"]
    negative_keywords = ["bad", "terrible", "awful", "dislike", "sucks", "horrible", "dreadful", "atrocious", "abysmal",
                         "disastrous"]
    negation_keywords = ["but", "not", "never", "no", "ain't", "however", "yet", "although", "despite", "though"]

    # Split the text into words
    words = text.split()

    # Initialize counters for positive and negative keywords
    num_positive_keywords = 0
    num_negative_keywords = 0

    # Initialize a flag to track negation
    negate = False

    for word in words:
        if word in negation_keywords:
            negate = not negate
        elif word in positive_keywords:
            if negate:
                num_negative_keywords += 1
            else:
                num_positive_keywords += 1
        elif word in negative_keywords:
            if negate:
                num_positive_keywords += 1
            else:
                num_negative_keywords += 1

    if num_positive_keywords > num_negative_keywords:
        return 'Positive'
    elif num_negative_keywords > num_positive_keywords:
        return 'Negative'
    else:
        return 'Neutral'


def predict_sentiment():
    try:

        text = 'this item is on my mind, but it is too expensive'

        print(f"Received text: {text}")
        cleaned_text = clean_text(text)

        text_tfidf = trained_vectorizer.transform([cleaned_text])

        sentiment = trained_model.predict(text_tfidf)[0]
        if(sentiment=='Neutral'):
            sentiment=rule_based_sentiment(cleaned_text)
        print({'sentiment': sentiment})
    except Exception as e:
        return {'error': str(e)}

predict_sentiment()