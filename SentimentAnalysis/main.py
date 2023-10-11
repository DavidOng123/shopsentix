import pandas as pd
import re
import string
from nltk.corpus import stopwords
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
nltk.download('vader_lexicon')
nltk.download('stopwords')
import matplotlib.pyplot as plt
import joblib
# Converts text data into numerical features using TF-IDF vectorization.
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.naive_bayes import MultinomialNB
#Used for model evaluation.
from sklearn.metrics import accuracy_score, classification_report

def assign_sentiment(review):
    sentiment_scores = sentiment.polarity_scores(str(review))  # Convert to string
    if sentiment_scores['compound'] >= 0.05:
        return 'positive'
    elif sentiment_scores['compound'] <= -0.05:
        return 'negative'
    else:
        return 'neutral'

def clean_text(text):
    # Convert text to lowercase
    text = text.lower()

    # Remove punctuation
    text = ''.join([char for char in text if char not in string.punctuation])

    # Tokenize the text
    words = text.split()

    # Remove stopwords
    stop_words = set(stopwords.words('english'))
    words = [word for word in words if word not in stop_words]

    # Join the words back into a cleaned text
    cleaned_text = ' '.join(words)

    return cleaned_text

def cleaning_numbers(data):
    return re.sub('[0-9]+', '', data)

def cleaning_URLs(data):
    return re.sub('((www.[^s]+)|([^s]+.com)|(https?://[^s]+))','',data)

#Importing the file
train_df = pd.read_csv("/fyp/Sentiment data/twitter_training.csv", header=None)
train_df2 = pd.read_csv("/fyp/Sentiment data/amazon_reviews.csv")
columns_to_keep = ['overall', 'reviewText']
train_df2 = train_df2[columns_to_keep]
test_df = pd.read_csv("/fyp/Sentiment data/twitter_validation.csv", header=None)
train_df.columns =['Id', 'Entity', 'Sentiment', 'Sentence']
test_df.columns =['Id', 'Entity', 'Sentiment', 'Sentence']
train_df = train_df.drop(['Id', 'Entity'], axis=1)
test_df = test_df.drop(['Id', 'Entity'], axis=1)

#replace the irrelevant to Neutral
train_df['Sentiment'] = train_df['Sentiment'].replace('Irrelevant', 'Neutral')
test_df['Sentiment'] = test_df['Sentiment'].replace('Irrelevant', 'Neutral')
sentiment = SentimentIntensityAnalyzer()
train_df2['Sentiment'] = train_df2['overall'].apply(assign_sentiment)
train_df2 = train_df2.drop(columns=['overall'])
train_df2 = train_df2.rename(columns={'reviewText': 'Sentence'})
train_df=train_df[['Sentence','Sentiment']]
combined_df = pd.concat([train_df, train_df2], ignore_index=True)
print(combined_df)
train_df=combined_df

#Check if the dataset contains null value
print(train_df.isnull().sum())

train_df=train_df.dropna()
test_df=test_df.dropna()

print(train_df.isnull().sum())

train_df['Sentence'] = train_df['Sentence'].apply(cleaning_numbers)
train_df['Sentence'] = train_df['Sentence'].apply(clean_text)
train_df['Sentence'] = train_df['Sentence'].apply(cleaning_URLs)
pattern_to_remove = r'\S+@\S+'
train_df['Sentence'] = train_df['Sentence'].str.replace(pattern_to_remove, '', regex=True)
test_df['Sentence'] = test_df['Sentence'].apply(cleaning_numbers)
test_df['Sentence'] = test_df['Sentence'].apply(clean_text)
test_df['Sentence'] = test_df['Sentence'].apply(cleaning_URLs)
pattern_to_remove = r'\S+@\S+'
test_df['Sentence'] = test_df['Sentence'].str.replace(pattern_to_remove, '', regex=True)
print(train_df)

# category_counts = train_df['Sentiment'].value_counts()
# plt.figure(figsize=(6, 8))
# plt.pie(category_counts, labels=category_counts.index, autopct='%1.1f%%', startangle=140)
# plt.axis('equal')
#
# plt.title('Distribution of Categories')
# plt.show()


# Vectorize the text data using TF-IDF

tfidf_vectorizer = TfidfVectorizer(stop_words="english",max_features=8000)  # You can adjust the number of features as needed
X_train_tfidf = tfidf_vectorizer.fit_transform(train_df['Sentence'])
y_train = train_df['Sentiment']

# Initialize and train the Naive Bayes classifier
naive_bayes_classifier = MultinomialNB()
naive_bayes_classifier.fit(X_train_tfidf, y_train)

X_test_tfidf = tfidf_vectorizer.transform(test_df['Sentence'])
y_test = test_df['Sentiment']

# Make predictions on the test set
y_pred = naive_bayes_classifier.predict(X_test_tfidf)

# Evaluate the classifier
accuracy = accuracy_score(y_pred, y_test)
classification_rep = classification_report(y_test, y_pred)

print("Accuracy:", accuracy)
print("Classification Report:\n", classification_rep)

trained_model = naive_bayes_classifier
trained_vectorizer = tfidf_vectorizer

# Save the trained model and vectorizer to disk
joblib.dump(trained_model, 'sentiment_model.joblib')
joblib.dump(trained_vectorizer, 'tfidf_vectorizer.joblib')

new_data = ["the product is fit my size, like it", "the product is sucks"]

new_data_tfidf = tfidf_vectorizer.transform(new_data)

print(naive_bayes_classifier.predict(new_data_tfidf))