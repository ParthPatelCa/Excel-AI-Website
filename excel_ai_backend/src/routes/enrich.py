from flask import Blueprint, request, jsonify
from models.user import db
from models.visualization import DataEnrichment
import pandas as pd
import re
import os
from openai import OpenAI
from dotenv import load_dotenv
from datetime import datetime
import json

load_dotenv()

enrich_bp = Blueprint('enrich', __name__)

# Initialize OpenAI client
api_key = os.getenv('OPENAI_API_KEY')
client = OpenAI(api_key=api_key) if api_key and api_key != 'sk-test-key-replace-with-real-key' else None

@enrich_bp.route('/api/v1/enrich/sentiment', methods=['POST'])
def analyze_sentiment():
    """Perform sentiment analysis on text data"""
    try:
        data = request.get_json()
        text_data = data.get('text', '')
        text_column = data.get('text_column', '')
        batch_data = data.get('data', [])
        
        results = []
        
        if text_data:
            # Single text analysis
            sentiment = get_sentiment_analysis(text_data)
            results.append({
                'text': text_data[:100] + '...' if len(text_data) > 100 else text_data,
                'sentiment': sentiment['sentiment'],
                'confidence': sentiment['confidence'],
                'emotions': sentiment.get('emotions', {})
            })
        elif batch_data and text_column:
            # Batch analysis
            df = pd.DataFrame(batch_data)
            if text_column in df.columns:
                for idx, text in df[text_column].items():
                    if pd.notna(text) and str(text).strip():
                        sentiment = get_sentiment_analysis(str(text))
                        results.append({
                            'index': idx,
                            'text': str(text)[:100] + '...' if len(str(text)) > 100 else str(text),
                            'sentiment': sentiment['sentiment'],
                            'confidence': sentiment['confidence'],
                            'emotions': sentiment.get('emotions', {})
                        })
        else:
            return jsonify({'error': 'No text data provided'}), 400
        
        # Save to database
        user_id = data.get('user_id', 1)  # TODO: Get from auth
        enrichment = DataEnrichment(
            user_id=user_id,
            title=data.get('title', f'Sentiment Analysis - {datetime.now().strftime("%Y-%m-%d %H:%M")}'),
            enrichment_type='sentiment',
            input_text=text_data if text_data else None,
            input_data=batch_data[:10] if batch_data else None,  # Store sample
            output_data=results,
            ai_model='gpt-4'
        )
        
        db.session.add(enrichment)
        db.session.commit()
        
        # Generate summary
        sentiments = [r['sentiment'] for r in results]
        summary = {
            'total_analyzed': len(results),
            'positive': sentiments.count('positive'),
            'negative': sentiments.count('negative'),
            'neutral': sentiments.count('neutral'),
            'average_confidence': sum(r['confidence'] for r in results) / len(results) if results else 0
        }
        
        return jsonify({
            'success': True,
            'data': {
                'id': enrichment.id,
                'results': results,
                'summary': summary
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to analyze sentiment: {str(e)}'}), 500

@enrich_bp.route('/api/v1/enrich/keywords', methods=['POST'])
def extract_keywords():
    """Extract keywords from text data"""
    try:
        data = request.get_json()
        text_data = data.get('text', '')
        text_column = data.get('text_column', '')
        batch_data = data.get('data', [])
        max_keywords = data.get('max_keywords', 10)
        
        results = []
        
        if text_data:
            # Single text analysis
            keywords = get_keyword_extraction(text_data, max_keywords)
            results.append({
                'text': text_data[:100] + '...' if len(text_data) > 100 else text_data,
                'keywords': keywords
            })
        elif batch_data and text_column:
            # Batch analysis
            df = pd.DataFrame(batch_data)
            if text_column in df.columns:
                for idx, text in df[text_column].items():
                    if pd.notna(text) and str(text).strip():
                        keywords = get_keyword_extraction(str(text), max_keywords)
                        results.append({
                            'index': idx,
                            'text': str(text)[:100] + '...' if len(str(text)) > 100 else str(text),
                            'keywords': keywords
                        })
        else:
            return jsonify({'error': 'No text data provided'}), 400
        
        # Save to database
        user_id = data.get('user_id', 1)  # TODO: Get from auth
        enrichment = DataEnrichment(
            user_id=user_id,
            title=data.get('title', f'Keyword Extraction - {datetime.now().strftime("%Y-%m-%d %H:%M")}'),
            enrichment_type='keywords',
            input_text=text_data if text_data else None,
            input_data=batch_data[:10] if batch_data else None,  # Store sample
            output_data=results,
            ai_model='gpt-4'
        )
        
        db.session.add(enrichment)
        db.session.commit()
        
        # Aggregate all keywords for summary
        all_keywords = []
        for result in results:
            all_keywords.extend([kw['keyword'] for kw in result['keywords']])
        
        keyword_frequency = {}
        for keyword in all_keywords:
            keyword_frequency[keyword] = keyword_frequency.get(keyword, 0) + 1
        
        top_keywords = sorted(keyword_frequency.items(), key=lambda x: x[1], reverse=True)[:10]
        
        summary = {
            'total_texts_analyzed': len(results),
            'unique_keywords': len(keyword_frequency),
            'top_keywords': [{'keyword': kw, 'frequency': freq} for kw, freq in top_keywords]
        }
        
        return jsonify({
            'success': True,
            'data': {
                'id': enrichment.id,
                'results': results,
                'summary': summary
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to extract keywords: {str(e)}'}), 500

@enrich_bp.route('/api/v1/enrich/classify', methods=['POST'])
def classify_text():
    """Classify text into categories"""
    try:
        data = request.get_json()
        text_data = data.get('text', '')
        text_column = data.get('text_column', '')
        batch_data = data.get('data', [])
        categories = data.get('categories', [])
        custom_prompt = data.get('custom_prompt', '')
        
        if not categories and not custom_prompt:
            # Default categories
            categories = ['positive', 'negative', 'neutral', 'complaint', 'inquiry', 'compliment']
        
        results = []
        
        if text_data:
            # Single text analysis
            classification = get_text_classification(text_data, categories, custom_prompt)
            results.append({
                'text': text_data[:100] + '...' if len(text_data) > 100 else text_data,
                'classification': classification
            })
        elif batch_data and text_column:
            # Batch analysis
            df = pd.DataFrame(batch_data)
            if text_column in df.columns:
                for idx, text in df[text_column].items():
                    if pd.notna(text) and str(text).strip():
                        classification = get_text_classification(str(text), categories, custom_prompt)
                        results.append({
                            'index': idx,
                            'text': str(text)[:100] + '...' if len(str(text)) > 100 else str(text),
                            'classification': classification
                        })
        else:
            return jsonify({'error': 'No text data provided'}), 400
        
        # Save to database
        user_id = data.get('user_id', 1)  # TODO: Get from auth
        enrichment = DataEnrichment(
            user_id=user_id,
            title=data.get('title', f'Text Classification - {datetime.now().strftime("%Y-%m-%d %H:%M")}'),
            enrichment_type='classification',
            input_text=text_data if text_data else None,
            input_data=batch_data[:10] if batch_data else None,  # Store sample
            output_data=results,
            ai_model='gpt-4'
        )
        
        db.session.add(enrichment)
        db.session.commit()
        
        # Generate summary
        classifications = [r['classification']['category'] for r in results]
        category_counts = {}
        for cat in classifications:
            category_counts[cat] = category_counts.get(cat, 0) + 1
        
        summary = {
            'total_classified': len(results),
            'categories_used': list(category_counts.keys()),
            'category_distribution': category_counts,
            'average_confidence': sum(r['classification']['confidence'] for r in results) / len(results) if results else 0
        }
        
        return jsonify({
            'success': True,
            'data': {
                'id': enrichment.id,
                'results': results,
                'summary': summary
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to classify text: {str(e)}'}), 500

@enrich_bp.route('/api/v1/enrich/summarize', methods=['POST'])
def summarize_text():
    """Summarize text data"""
    try:
        data = request.get_json()
        text_data = data.get('text', '')
        text_column = data.get('text_column', '')
        batch_data = data.get('data', [])
        summary_length = data.get('summary_length', 'medium')  # short, medium, long
        
        results = []
        
        if text_data:
            # Single text analysis
            summary = get_text_summary(text_data, summary_length)
            results.append({
                'original_text': text_data[:200] + '...' if len(text_data) > 200 else text_data,
                'summary': summary['summary'],
                'key_points': summary.get('key_points', []),
                'original_length': len(text_data),
                'summary_length': len(summary['summary'])
            })
        elif batch_data and text_column:
            # Batch analysis
            df = pd.DataFrame(batch_data)
            if text_column in df.columns:
                for idx, text in df[text_column].items():
                    if pd.notna(text) and str(text).strip():
                        summary = get_text_summary(str(text), summary_length)
                        results.append({
                            'index': idx,
                            'original_text': str(text)[:200] + '...' if len(str(text)) > 200 else str(text),
                            'summary': summary['summary'],
                            'key_points': summary.get('key_points', []),
                            'original_length': len(str(text)),
                            'summary_length': len(summary['summary'])
                        })
        else:
            return jsonify({'error': 'No text data provided'}), 400
        
        # Save to database
        user_id = data.get('user_id', 1)  # TODO: Get from auth
        enrichment = DataEnrichment(
            user_id=user_id,
            title=data.get('title', f'Text Summarization - {datetime.now().strftime("%Y-%m-%d %H:%M")}'),
            enrichment_type='summarize',
            input_text=text_data if text_data else None,
            input_data=batch_data[:10] if batch_data else None,  # Store sample
            output_data=results,
            ai_model='gpt-4'
        )
        
        db.session.add(enrichment)
        db.session.commit()
        
        # Generate summary
        total_original_length = sum(r['original_length'] for r in results)
        total_summary_length = sum(r['summary_length'] for r in results)
        compression_ratio = (total_summary_length / total_original_length) * 100 if total_original_length > 0 else 0
        
        summary_stats = {
            'texts_summarized': len(results),
            'total_original_characters': total_original_length,
            'total_summary_characters': total_summary_length,
            'compression_ratio': compression_ratio,
            'average_compression': compression_ratio
        }
        
        return jsonify({
            'success': True,
            'data': {
                'id': enrichment.id,
                'results': results,
                'summary': summary_stats
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to summarize text: {str(e)}'}), 500

@enrich_bp.route('/api/v1/enrich/custom', methods=['POST'])
def custom_enrichment():
    """Custom AI enrichment with user-defined prompt"""
    try:
        data = request.get_json()
        text_data = data.get('text', '')
        text_column = data.get('text_column', '')
        batch_data = data.get('data', [])
        custom_prompt = data.get('prompt', '')
        
        if not custom_prompt:
            return jsonify({'error': 'Custom prompt required'}), 400
        
        results = []
        
        if text_data:
            # Single text analysis
            result = get_custom_enrichment(text_data, custom_prompt)
            results.append({
                'text': text_data[:100] + '...' if len(text_data) > 100 else text_data,
                'result': result
            })
        elif batch_data and text_column:
            # Batch analysis
            df = pd.DataFrame(batch_data)
            if text_column in df.columns:
                for idx, text in df[text_column].items():
                    if pd.notna(text) and str(text).strip():
                        result = get_custom_enrichment(str(text), custom_prompt)
                        results.append({
                            'index': idx,
                            'text': str(text)[:100] + '...' if len(str(text)) > 100 else str(text),
                            'result': result
                        })
        else:
            return jsonify({'error': 'No text data provided'}), 400
        
        # Save to database
        user_id = data.get('user_id', 1)  # TODO: Get from auth
        enrichment = DataEnrichment(
            user_id=user_id,
            title=data.get('title', f'Custom Enrichment - {datetime.now().strftime("%Y-%m-%d %H:%M")}'),
            enrichment_type='custom',
            input_text=text_data if text_data else None,
            input_data=batch_data[:10] if batch_data else None,  # Store sample
            output_data=results,
            ai_model='gpt-4'
        )
        
        db.session.add(enrichment)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'id': enrichment.id,
                'results': results,
                'prompt_used': custom_prompt
            }
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to perform custom enrichment: {str(e)}'}), 500

def get_sentiment_analysis(text):
    """Get sentiment analysis using OpenAI"""
    if not client:
        # Fallback: simple rule-based sentiment
        positive_words = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'happy']
        negative_words = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'sad', 'angry', 'disappointed']
        
        text_lower = text.lower()
        positive_count = sum(1 for word in positive_words if word in text_lower)
        negative_count = sum(1 for word in negative_words if word in text_lower)
        
        if positive_count > negative_count:
            return {'sentiment': 'positive', 'confidence': 0.7}
        elif negative_count > positive_count:
            return {'sentiment': 'negative', 'confidence': 0.7}
        else:
            return {'sentiment': 'neutral', 'confidence': 0.6}
    
    try:
        prompt = f"""
        Analyze the sentiment of this text and provide emotions:
        "{text}"
        
        Return JSON format:
        {{
            "sentiment": "positive/negative/neutral",
            "confidence": 0.0-1.0,
            "emotions": {{
                "joy": 0.0-1.0,
                "anger": 0.0-1.0,
                "sadness": 0.0-1.0,
                "fear": 0.0-1.0,
                "surprise": 0.0-1.0
            }}
        }}
        """
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )
        
        return json.loads(response.choices[0].message.content)
        
    except Exception as e:
        return {'sentiment': 'neutral', 'confidence': 0.5, 'emotions': {}}

def get_keyword_extraction(text, max_keywords=10):
    """Extract keywords using OpenAI"""
    if not client:
        # Fallback: simple word frequency
        words = re.findall(r'\b\w+\b', text.lower())
        word_freq = {}
        for word in words:
            if len(word) > 3:  # Skip short words
                word_freq[word] = word_freq.get(word, 0) + 1
        
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        return [{'keyword': word, 'relevance': min(freq/10, 1.0)} for word, freq in sorted_words[:max_keywords]]
    
    try:
        prompt = f"""
        Extract the top {max_keywords} most important keywords from this text:
        "{text}"
        
        Return JSON format:
        [
            {{"keyword": "example", "relevance": 0.0-1.0}},
            ...
        ]
        """
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )
        
        return json.loads(response.choices[0].message.content)
        
    except Exception as e:
        return []

def get_text_classification(text, categories, custom_prompt=''):
    """Classify text using OpenAI"""
    if not client:
        # Fallback: simple classification
        return {'category': categories[0] if categories else 'unknown', 'confidence': 0.5}
    
    try:
        if custom_prompt:
            prompt = f"{custom_prompt}\n\nText to classify: \"{text}\""
        else:
            prompt = f"""
            Classify this text into one of these categories: {', '.join(categories)}
            
            Text: "{text}"
            
            Return JSON format:
            {{
                "category": "selected_category",
                "confidence": 0.0-1.0,
                "reasoning": "brief explanation"
            }}
            """
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )
        
        return json.loads(response.choices[0].message.content)
        
    except Exception as e:
        return {'category': 'unknown', 'confidence': 0.5}

def get_text_summary(text, length='medium'):
    """Summarize text using OpenAI"""
    if not client:
        # Fallback: simple truncation
        max_chars = {'short': 100, 'medium': 200, 'long': 400}
        return {
            'summary': text[:max_chars.get(length, 200)] + '...',
            'key_points': []
        }
    
    try:
        length_instructions = {
            'short': 'in 1-2 sentences',
            'medium': 'in 2-4 sentences', 
            'long': 'in 1-2 paragraphs'
        }
        
        prompt = f"""
        Summarize this text {length_instructions.get(length, 'in 2-4 sentences')} and extract key points:
        
        "{text}"
        
        Return JSON format:
        {{
            "summary": "your summary here",
            "key_points": ["point 1", "point 2", ...]
        }}
        """
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )
        
        return json.loads(response.choices[0].message.content)
        
    except Exception as e:
        return {'summary': text[:200] + '...', 'key_points': []}

def get_custom_enrichment(text, prompt):
    """Perform custom enrichment using OpenAI"""
    if not client:
        return f"Processed: {text[:100]}..."
    
    try:
        full_prompt = f"{prompt}\n\nText: \"{text}\""
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": full_prompt}],
            temperature=0.3
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        return f"Error processing: {str(e)}"
