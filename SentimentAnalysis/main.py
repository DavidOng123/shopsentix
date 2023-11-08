import pandas as pd
import re
import string
from nltk.corpus import stopwords
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
from imblearn.over_sampling import RandomOverSampler

ros = RandomOverSampler(random_state=42)


nltk.download('vader_lexicon')
nltk.download('stopwords')
import matplotlib.pyplot as plt
import joblib
import seaborn as sns
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import GridSearchCV, train_test_split


def assign_sentiment(review):
    sentiment_scores = sentiment.polarity_scores(str(review))
    if sentiment_scores['compound'] >= 0.05:
        return 'Positive'
    elif sentiment_scores['compound'] <= -0.05:
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

def cleaning_numbers(data):
    return re.sub('[0-9]+', '', data)

def cleaning_URLs(data):
    return re.sub('((www.[^s]+)|([^s]+.com)|(https?://[^s]+))', '', data)



train_df = pd.read_csv("/fyp/Sentiment data/twitter_training.csv", header=None)
train_df2 = pd.read_csv("/fyp/Sentiment data/amazon_reviews.csv")
columns_to_keep = ['overall', 'reviewText']
train_df2 = train_df2[columns_to_keep]
test_df = pd.read_csv("/fyp/Sentiment data/twitter_validation.csv", header=None)
train_df.columns = ['Id', 'Entity', 'Sentiment', 'Sentence']
test_df.columns = ['Id', 'Entity', 'Sentiment', 'Sentence']
train_df = train_df.drop(['Id', 'Entity'], axis=1)
test_df = test_df.drop(['Id', 'Entity'], axis=1)

train_df['Sentiment'] = train_df['Sentiment'].replace('Irrelevant', 'Neutral')
test_df['Sentiment'] = test_df['Sentiment'].replace('Irrelevant', 'Neutral')
sentiment = SentimentIntensityAnalyzer()
train_df2['Sentiment'] = train_df2['overall'].apply(assign_sentiment)
train_df2 = train_df2.drop(columns=['overall'])
train_df2 = train_df2.rename(columns={'reviewText': 'Sentence'})
train_df = train_df[['Sentence', 'Sentiment']]
combined_df = pd.concat([train_df, train_df2], ignore_index=True)
train_df = combined_df
train_df['Sentiment'] = train_df['Sentiment'].replace('neutral', 'Neutral')

sentiment_counts = train_df['Sentiment'].value_counts()

oversampler = RandomOverSampler(random_state=42)

print(train_df.isnull().sum())
train_df = train_df.dropna()
test_df = test_df.dropna()

train_df['Sentence'] = train_df['Sentence'].apply(cleaning_numbers)
train_df['Sentence'] = train_df['Sentence'].apply(clean_text)
train_df['Sentence'] = train_df['Sentence'].apply(cleaning_URLs)
pattern_to_remove = r'\S+@\S+'
train_df['Sentence'] = train_df['Sentence'].str.replace(pattern_to_remove, '', regex=True)

def rule_based_sentiment(text):
    positive_keywords = ["good", "great", "excellent", "like", "love"]
    negative_keywords = ["bad", "terrible", "awful", "dislike", "sucks"]
    negation_keywords = ["but", "not", "never", "no", "ain't"]

    # Split the text into words
    words = text.split()

    num_positive_keywords = 0
    num_negative_keywords = 0

    # Initialize a flag to track negation
    negate = False

    for word in words:
        if word in negation_keywords:
            negate = not negate  # Toggle the negation flag
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


def apply_rule_based_sentiment_to_neutral(row):
    if row['Sentiment'] == 'Neutral':
        return rule_based_sentiment(row['Sentence'])
    else:
        return row['Sentiment']


train_df['Sentiment'] = train_df.apply(apply_rule_based_sentiment_to_neutral, axis=1)

# Data Statistics
print("Dataset Shape:", train_df.shape)
print(train_df.info())
print("Missing Values:\n", train_df.isnull().sum())

# Class Distribution
sentiment_counts = train_df['Sentiment'].value_counts()
print("Sentiment Class Distribution:\n", sentiment_counts)

# Text Length
train_df['Text Length'] = train_df['Sentence'].apply(lambda x: len(x.split()))
train_df['Text Length'].plot(kind='hist', bins=50, title='Text Length Distribution')

# Word Frequency
from wordcloud import WordCloud
wordcloud = WordCloud(width=800, height=400).generate(' '.join(train_df['Sentence']))
plt.figure(figsize=(10, 5))
plt.imshow(wordcloud, interpolation='bilinear')
plt.axis('off')
plt.show()

# Sentiment Distribution
sentiment_counts.plot(kind='bar', title='Sentiment Distribution')

plt.show()


tfidf_vectorizer = TfidfVectorizer(stop_words="english", max_features=100000)

X_train, X_test, y_train, y_test = train_test_split(train_df['Sentence'], train_df['Sentiment'], test_size=0.2, random_state=42)


X_train_resampled, y_train_resampled = oversampler.fit_resample(X_train.values.reshape(-1, 1), y_train)
X_train_resampled = X_train_resampled.flatten()


X_train_tfidf = tfidf_vectorizer.fit_transform(X_train_resampled)
X_test_tfidf = tfidf_vectorizer.transform(X_test)

param_grid = {
    'alpha': [0.1, 0.5, 1.0],
}

naive_bayes_classifier = MultinomialNB()
grid_search = GridSearchCV(naive_bayes_classifier, param_grid, cv=5, scoring='accuracy')
grid_search.fit(X_train_tfidf, y_train_resampled)

best_params = grid_search.best_params_
best_estimator = grid_search.best_estimator_

best_estimator.fit(X_train_tfidf, y_train_resampled)

y_pred = best_estimator.predict(X_test_tfidf)

accuracy = accuracy_score(y_test, y_pred)
classification_rep = classification_report(y_test, y_pred)

print("Best Parameters:", best_params)
print("Accuracy:", accuracy)
print("Classification Report:\n", classification_rep)

joblib.dump(best_estimator, 'sentiment_model.joblib')
joblib.dump(tfidf_vectorizer, 'tfidf_vectorizer.joblib')

new_data = ["the product is fit my size, like it", "the product is sucks"]
new_data_tfidf = tfidf_vectorizer.transform(new_data)

print(best_estimator.predict(new_data_tfidf))