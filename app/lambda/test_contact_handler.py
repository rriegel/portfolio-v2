import json
import sys
from unittest.mock import MagicMock, patch

# Mock boto3 before importing handler
sys.modules['boto3'] = MagicMock()
sys.modules['botocore'] = MagicMock()
sys.modules['botocore.exceptions'] = MagicMock()

sys.path.insert(0, '.')
from contact_handler import is_valid_email, lambda_handler

def test_email_validation():
    """Test email validation logic."""
    # Valid emails
    assert is_valid_email('user@example.com')
    assert is_valid_email('user.name@domain.co.uk')
    assert is_valid_email('user+tag@example.org')
    
    # Invalid emails
    assert not is_valid_email('')
    assert not is_valid_email('invalid')
    assert not is_valid_email('user@')
    assert not is_valid_email('@domain.com')
    assert not is_valid_email('user@.com')
    
    print('✓ Email validation tests passed')

def test_missing_fields():
    """Test that missing required fields return errors."""
    event = {
        'httpMethod': 'POST',
        'body': json.dumps({})
    }
    
    response = lambda_handler(event, None)
    assert response['statusCode'] == 400
    body = json.loads(response['body'])
    assert 'errors' in body
    assert 'Name is required' in body['errors']
    assert 'Email is required' in body['errors']
    assert 'Message is required' in body['errors']
    
    print('✓ Missing fields validation passed')

def test_invalid_json():
    """Test that invalid JSON returns 400."""
    event = {
        'httpMethod': 'POST',
        'body': 'not json'
    }
    
    response = lambda_handler(event, None)
    assert response['statusCode'] == 400
    body = json.loads(response['body'])
    assert body['error'] == 'Invalid JSON'
    
    print('✓ Invalid JSON handling passed')

def test_options_request():
    """Test CORS preflight handling."""
    event = {
        'httpMethod': 'OPTIONS'
    }
    
    response = lambda_handler(event, None)
    assert response['statusCode'] == 200
    assert 'Access-Control-Allow-Origin' in response['headers']
    
    print('✓ OPTIONS request handling passed')

def test_message_too_long():
    """Test message length validation."""
    event = {
        'httpMethod': 'POST',
        'body': json.dumps({
            'name': 'Test User',
            'email': 'test@example.com',
            'message': 'x' * 5001
        })
    }
    
    response = lambda_handler(event, None)
    assert response['statusCode'] == 400
    body = json.loads(response['body'])
    assert 'Message too long' in body['errors'][0]
    
    print('✓ Message length validation passed')

if __name__ == '__main__':
    test_email_validation()
    test_missing_fields()
    test_invalid_json()
    test_options_request()
    test_message_too_long()
    print('\n✓ All tests passed!')
