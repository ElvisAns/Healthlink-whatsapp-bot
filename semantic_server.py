#!/usr/bin/env python3
"""
Persistent HTTP Server for Semantic Search
Runs continuously and handles requests via HTTP
Production-ready version with logging and error handling
"""

import sys
import json
import re
import os
import signal
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Global variables for graceful shutdown
server = None
shutdown_requested = False

def signal_handler(signum, frame):
    """Handle shutdown signals gracefully"""
    global shutdown_requested
    logger.info(f"Received signal {signum}, shutting down gracefully...")
    shutdown_requested = True
    if server:
        server.shutdown()

# Register signal handlers
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# Load Q/A pairs ONCE at startup
def load_qa_pairs(file_path='qa_knowledge.json'):
    """Load questions and answers from JSON"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            qa_pairs = json.load(f)
        logger.info(f"Successfully loaded {len(qa_pairs)} Q/A pairs from {file_path}")
        return qa_pairs
    except FileNotFoundError:
        logger.error(f"Q/A file not found: {file_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in {file_path}: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Error loading Q/A pairs: {e}")
        sys.exit(1)

qa_pairs = load_qa_pairs()
questions = [item['question'] for item in qa_pairs]
answers = [item['answer'] for item in qa_pairs]

# Create TF-IDF vectorizer ONCE at startup with improved settings
vectorizer = TfidfVectorizer(
    lowercase=True,
    ngram_range=(1, 3),  # Include trigrams for better matching
    max_features=2000,   # More features for better accuracy
    min_df=1,            # Include all terms
    analyzer='word'      # Word-level analysis
)

# Pre-compute vectors for all questions ONCE
try:
    all_texts = questions + answers
    vectorizer.fit(all_texts)
    question_vectors = vectorizer.transform(questions)
    logger.info(f"Successfully created TF-IDF vectors for {len(questions)} questions")
except Exception as e:
    logger.error(f"Error creating TF-IDF vectors: {e}")
    sys.exit(1)

logger.info("Semantic search server ready!")

class SearchHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle GET requests with query parameter"""
        parsed_path = urlparse(self.path)
        query_params = parse_qs(parsed_path.query)
        
        query = query_params.get('q', [''])[0]
        
        if not query:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {'error': 'No query parameter provided'}
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return
        
        # Perform search
        try:
            result = self.search_query(query)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))
            
        except Exception as e:
            logger.error(f"Error processing request: {e}")
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {'error': str(e)}
            self.wfile.write(json.dumps(response).encode('utf-8'))
    
    def search_query(self, query):
        """Find most relevant answer for a query using pre-computed vectors"""
        # Normalize query (lowercase, strip)
        normalized_query = query.lower().strip()
        
        # Vectorize the query
        query_vector = vectorizer.transform([normalized_query])
        
        # Calculate similarity using pre-computed vectors
        similarities = cosine_similarity(query_vector, question_vectors)[0]
        
        # Get the best match
        best_idx = np.argmax(similarities)
        best_score = similarities[best_idx]
        
        # Get top 3 matches for debugging
        top_indices = np.argsort(similarities)[-3:][::-1]
        top_matches = [
            {'question': questions[i], 'score': float(similarities[i])}
            for i in top_indices
        ]
        
        # Return top match if it's reasonable
        # If score > 0.3, definitely return
        # If score > 0.2 and it's significantly better than second place, return
        # If score > 0.15 and query is short (1-2 words), return
        
        threshold = 0.15
        
        if len(normalized_query.split()) <= 2:
            threshold = 0.12  # More lenient for very short queries
        
        # Check if best match is significantly better than second best
        second_best_score = similarities[top_indices[1]] if len(top_indices) > 1 else 0
        score_gap = best_score - second_best_score
        
        # Return if: good score OR excellent score gap
        if best_score > threshold or (score_gap > 0.3 and best_score > 0.12):
            return {
                'answer': answers[best_idx],
                'score': float(best_score),
                'matched_question': questions[best_idx],
                'top_matches': top_matches  # Debug info
            }
        
        return {
            'answer': None, 
            'score': float(best_score),
            'top_matches': top_matches  # Debug info
        }
    
    def log_message(self, format, *args):
        """Override to reduce logging noise"""
        logger.debug(f"HTTP {format % args}")

def run_server(port=8000):
    global server
    server_address = ('127.0.0.1', port)
    server = HTTPServer(server_address, SearchHandler)
    logger.info(f"Semantic Search Server running on http://127.0.0.1:{port}")
    logger.info(f"Example: http://127.0.0.1:{port}/?q=Qu'est-ce%20que%20HealthLink%3F")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Received KeyboardInterrupt, shutting down...")
    finally:
        server.server_close()
        logger.info("Server closed")

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    try:
        run_server(port)
    except Exception as e:
        logger.error(f"Server error: {e}")
        sys.exit(1)

