from flask_cors import CORS, cross_origin
from flask import Flask, request, jsonify
import string
from nltk.corpus import stopwords
import nltk
import joblib
from numpy.core.defchararray import lower

nltk.download('stopwords')

app = Flask(__name__)
CORS(app)

# Load the trained model and vectorizer
trained_model = joblib.load('sentiment_model.joblib')
trained_vectorizer = joblib.load('tfidf_vectorizer.joblib')

def rule_based_sentiment(text):
    positive_keywords = ["good", "great", "excellent", "like", "love"]
    negative_keywords = ["bad", "terrible", "awful", "dislike", "sucks"]
    negation_keywords = ["but", "not", "never", "no", "ain't"]

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




def clean_text(text):
    text = text.lower()
    text = ''.join([char for char in text if char not in string.punctuation])
    words = text.split()
    stop_words = set(stopwords.words('english'))
    words = [word for word in words if word not in stop_words]
    cleaned_text = ' '.join(words)
    return cleaned_text


def analyze_sentiments(reviews):
    sentiments = {'positive': 0, 'neutral': 0, 'negative': 0}

    for review in reviews:
        cleaned_text = clean_text(review)
        text_tfidf = trained_vectorizer.transform([cleaned_text])
        machine_learning_sentiment = trained_model.predict(text_tfidf)[0]

        rule_based_sentiment_result = rule_based_sentiment(cleaned_text)

        if lower(machine_learning_sentiment) == 'positive' or lower(rule_based_sentiment_result) == 'positive':
            sentiments['positive'] += 1
        elif lower(machine_learning_sentiment) == 'neutral' or lower(rule_based_sentiment_result) == 'neutral':
            sentiments['neutral'] += 1
        else:
            sentiments['negative'] += 1

    return sentiments


@app.route('/predict_sentiments', methods=['POST'])
def predict_sentiments():
    try:
        data = request.json
        reviews = data['reviews']

        sentiment_counts = analyze_sentiments(reviews)

        return jsonify(sentiment_counts)
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(port=5000)
