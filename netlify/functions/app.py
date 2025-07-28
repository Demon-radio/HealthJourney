import json
import os
from datetime import datetime, timedelta

# Import the main Flask app
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from app import app

def handler(event, context):
    """Netlify function handler"""
    try:
        # Extract request details from event
        path = event.get('path', '/')
        method = event.get('httpMethod', 'GET')
        headers = event.get('headers', {})
        body = event.get('body', '')
        query_params = event.get('queryStringParameters', {}) or {}
        
        # Create a mock environ for Flask
        environ = {
            'REQUEST_METHOD': method,
            'PATH_INFO': path,
            'QUERY_STRING': '&'.join([f'{k}={v}' for k, v in query_params.items()]),
            'CONTENT_TYPE': headers.get('content-type', ''),
            'CONTENT_LENGTH': str(len(body)) if body else '0',
            'SERVER_NAME': 'localhost',
            'SERVER_PORT': '5000',
            'wsgi.version': (1, 0),
            'wsgi.url_scheme': 'https',
            'wsgi.input': None,
            'wsgi.errors': sys.stderr,
            'wsgi.multithread': False,
            'wsgi.multiprocess': True,
            'wsgi.run_once': False
        }
        
        # Add headers to environ
        for key, value in headers.items():
            key = key.upper().replace('-', '_')
            if key not in ('CONTENT_TYPE', 'CONTENT_LENGTH'):
                key = f'HTTP_{key}'
            environ[key] = value
        
        # Handle the request with Flask app
        with app.test_request_context(path, method=method, data=body, query_string=environ['QUERY_STRING']):
            try:
                response = app.dispatch_request()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json' if path.startswith('/api/') else 'text/html',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
                    },
                    'body': response.get_data(as_text=True)
                }
            except Exception as e:
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': str(e)})
                }
                
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': f'Handler error: {str(e)}'})
        }