import json
import os
import re
import boto3
from botocore.exceptions import ClientError

ses_client = boto3.client('ses')

SENDER_EMAIL = os.environ.get('SENDER_EMAIL')
RECIPIENT_EMAIL = os.environ.get('RECIPIENT_EMAIL')

def lambda_handler(event, context):
    """Handle contact form submissions via API Gateway."""
    
    # CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    }
    
    # Handle preflight OPTIONS request
    if event.get('httpMethod') == 'OPTIONS' or event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    # Only accept POST
    method = event.get('httpMethod') or event.get('requestContext', {}).get('http', {}).get('method')
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Invalid JSON'})
        }
    
    # Extract and validate fields
    name = (body.get('name') or '').strip()
    email = (body.get('email') or '').strip()
    message = (body.get('message') or '').strip()
    
    errors = []
    if not name:
        errors.append('Name is required')
    if not email:
        errors.append('Email is required')
    elif not is_valid_email(email):
        errors.append('Invalid email format')
    if not message:
        errors.append('Message is required')
    elif len(message) > 5000:
        errors.append('Message too long (max 5000 characters)')
    
    if errors:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'errors': errors})
        }
    
    # Send email via SES
    try:
        ses_client.send_email(
            Source=SENDER_EMAIL,
            Destination={'ToAddresses': [RECIPIENT_EMAIL]},
            Message={
                'Subject': {'Data': f'Portfolio Contact: {name}', 'Charset': 'UTF-8'},
                'Body': {
                    'Text': {
                        'Data': f'Name: {name}\nEmail: {email}\n\nMessage:\n{message}',
                        'Charset': 'UTF-8'
                    },
                    'Html': {
                        'Data': f'''
                        <h2>New Contact Form Submission</h2>
                        <p><strong>Name:</strong> {name}</p>
                        <p><strong>Email:</strong> {email}</p>
                        <p><strong>Message:</strong></p>
                        <p>{message.replace(chr(10), '<br>')}</p>
                        ''',
                        'Charset': 'UTF-8'
                    }
                }
            }
        )
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'message': 'Message sent successfully'})
        }
        
    except ClientError as e:
        print(f'SES error: {e}')
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'Failed to send message'})
        }
    except Exception as e:
        print(f'Unexpected error: {e}')
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'Internal server error'})
        }

def is_valid_email(email):
    """Basic email validation."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None
