from flask_cors import CORS, cross_origin
from flask import Flask, request, jsonify
import string
from nltk.corpus import stopwords
import nltk
import joblib

nltk.download('stopwords')

app = Flask(__name__)

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
        data = request.json
        text = data['text']
        print(f"Received text: {text}")
        cleaned_text = clean_text(text)

        # Vectorize the text data using the pre-trained vectorizer
        text_tfidf = trained_vectorizer.transform([cleaned_text])

        # Make predictions using the pre-trained model
        sentiment = trained_model.predict(text_tfidf)[0]

        return jsonify({'sentiment': sentiment})
    except Exception as e:
        return jsonify({'error': str(e)})


def get_sales_data():
    pass

def get_sentiment_data():
    pass


@app.route('/sales_and_sentiment_data', methods=['GET'])
def get_sales_and_sentiment_data():
    try:
        # Retrieve sales data from the Order Schema
        sales_data = get_sales_data()

        # Retrieve sentiment data from the Review Schema
        sentiment_data = get_sentiment_data()

        # Combine the sales and sentiment data
        combined_data = combine_data(sales_data, sentiment_data)

        return jsonify(combined_data)
    except Exception as e:
        return jsonify({'error': str(e)})


if __name__ == '__main__':
    app.run(port=5000)
