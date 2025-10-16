#!/usr/bin/env python3
"""
Advanced Features Examples for Mock-Lab

This script demonstrates:
1. Dynamic Placeholders - Generate dynamic data in responses
2. Async Callbacks - Send callbacks to external URLs with delays
3. Request Schema Validation - Validate incoming requests against JSON schemas

Prerequisites:
- Mock-Lab backend running (python -m uvicorn backend.main:app --reload)
- User account created and logged in
"""

import requests
import json
import time
from pprint import pprint

# Configuration
BASE_URL = "http://localhost:8001"
USERNAME = "arun"
PASSWORD = "a2v@123"
EMAIL = "test@example.com"

# Color output for better readability
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'


def print_section(title):
    """Print a formatted section header."""
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{title}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}\n")


def print_success(message):
    """Print success message."""
    print(f"{Colors.OKGREEN}✓ {message}{Colors.ENDC}")


def print_info(message):
    """Print info message."""
    print(f"{Colors.OKCYAN}ℹ {message}{Colors.ENDC}")


def print_error(message):
    """Print error message."""
    print(f"{Colors.FAIL}✗ {message}{Colors.ENDC}")


def register_and_login():
    """Register a new user and get auth token."""
    print_section("1. Authentication")
    
    # Try to register (might already exist)
    print_info("Attempting to register user...")
    register_data = {
        "username": USERNAME,
        "password": PASSWORD,
        "email": EMAIL
    }
    
    response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    if response.status_code == 200:
        print_success("User registered successfully")
    elif response.status_code == 400:
        print_info("User already exists, proceeding to login")
    else:
        print_error(f"Registration failed: {response.text}")
        return None
    
    # Login
    print_info("Logging in...")
    login_data = {
        "username": USERNAME,
        "password": PASSWORD
    }
    
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if response.status_code == 200:
        data = response.json()
        token = data["token"]
        print_success(f"Login successful. Token: {token[:20]}...")
        return token
    else:
        print_error(f"Login failed: {response.text}")
        return None


def create_entity(token):
    """Create a test entity."""
    print_section("2. Create Test Entity")
    
    headers = {"Authorization": f"Bearer {token}"}
    entity_data = {
        "name": "Advanced Features Test",
        "is_public": True
    }
    
    print_info("Creating entity...")
    response = requests.post(f"{BASE_URL}/admin/entities", json=entity_data, headers=headers)
    
    if response.status_code == 200:
        entity = response.json()
        print_success(f"Entity created: {entity['name']}")
        print_info(f"Base path: {entity['base_path']}")
        print_info(f"Entity ID: {entity['id']}")
        return entity
    else:
        print_error(f"Entity creation failed: {response.text}")
        return None


def demo_placeholders(token, entity_id):
    """Demonstrate dynamic placeholder replacement."""
    print_section("3. Demo: Dynamic Placeholders")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create endpoint with various placeholders
    endpoint_data = {
        "name": "Placeholder Demo",
        "method": "GET",
        "path": "/placeholder-test",
        "response_body": json.dumps({
            "id": "{{uuid}}",
            "created_at": "{{timestamp_iso}}",
            "timestamp_ms": "{{timestamp}}",
            "date": "{{date}}",
            "user": {
                "name": "{{random_name}}",
                "email": "{{random_email}}",
                "username": "{{random_username}}"
            },
            "score": "{{random_int:1:100}}",
            "price": "{{random_float:10:100}}",
            "token": "{{random_hex:16}}",
            "is_active": "{{random_bool}}"
        }),
        "response_code": 200,
        "is_active": True
    }
    
    print_info("Creating endpoint with placeholders...")
    response = requests.post(
        f"{BASE_URL}/admin/entities/{entity_id}/endpoints",
        json=endpoint_data,
        headers=headers
    )
    
    if response.status_code != 200:
        print_error(f"Failed to create endpoint: {response.text}")
        return
    
    endpoint = response.json()
    print_success("Endpoint created")
    
    # Test the endpoint multiple times to show dynamic values
    print_info("\nMaking 3 requests to demonstrate dynamic values...\n")
    
    for i in range(3):
        print(f"{Colors.BOLD}Request {i+1}:{Colors.ENDC}")
        response = requests.get(f"{BASE_URL}/api/advanced-features-test/placeholder-test")
        if response.status_code == 200:
            print(json.dumps(response.json(), indent=2))
            print()
        else:
            print_error(f"Request failed: {response.text}")
        
        time.sleep(0.5)
    
    print_success("Notice how each response has different dynamic values!")


def demo_schema_validation(token, entity_id):
    """Demonstrate request schema validation."""
    print_section("4. Demo: Request Schema Validation")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create endpoint with schema validation
    schema = {
        "type": "object",
        "required": ["email", "username", "age"],
        "properties": {
            "email": {
                "type": "string",
                "format": "email"
            },
            "username": {
                "type": "string",
                "minLength": 3,
                "maxLength": 20
            },
            "age": {
                "type": "integer",
                "minimum": 18,
                "maximum": 120
            },
            "country": {
                "type": "string",
                "enum": ["US", "UK", "CA", "AU"]
            }
        }
    }
    
    endpoint_data = {
        "name": "Schema Validation Demo",
        "method": "POST",
        "path": "/users",
        "response_body": json.dumps({
            "user_id": "{{uuid}}",
            "created": True,
            "created_at": "{{timestamp_iso}}"
        }),
        "response_code": 201,
        "is_active": True,
        "schema_validation_enabled": True,
        "request_schema": json.dumps(schema)
    }
    
    print_info("Creating endpoint with schema validation...")
    response = requests.post(
        f"{BASE_URL}/admin/entities/{entity_id}/endpoints",
        json=endpoint_data,
        headers=headers
    )
    
    if response.status_code != 200:
        print_error(f"Failed to create endpoint: {response.text}")
        return
    
    print_success("Endpoint created with schema validation")
    
    # Test with valid request
    print_info("\nTest 1: Valid request")
    valid_request = {
        "email": "john@example.com",
        "username": "johndoe",
        "age": 25,
        "country": "US"
    }
    
    print(f"Sending: {json.dumps(valid_request, indent=2)}")
    response = requests.post(
        f"{BASE_URL}/api/advanced-features-test/users",
        json=valid_request
    )
    
    if response.status_code == 201:
        print_success("Request accepted!")
        print(json.dumps(response.json(), indent=2))
    else:
        print_error(f"Request failed: {response.text}")
    
    # Test with invalid email
    print_info("\nTest 2: Invalid email format")
    invalid_email = {
        "email": "not-an-email",
        "username": "johndoe",
        "age": 25
    }
    
    print(f"Sending: {json.dumps(invalid_email, indent=2)}")
    response = requests.post(
        f"{BASE_URL}/api/advanced-features-test/users",
        json=invalid_email
    )
    
    if response.status_code == 400:
        print_success("Validation correctly rejected invalid email!")
        print(f"Error: {json.dumps(response.json(), indent=2)}")
    else:
        print_error("Expected validation error")
    
    # Test with missing required field
    print_info("\nTest 3: Missing required field")
    missing_field = {
        "email": "john@example.com",
        "username": "johndoe"
        # age is missing
    }
    
    print(f"Sending: {json.dumps(missing_field, indent=2)}")
    response = requests.post(
        f"{BASE_URL}/api/advanced-features-test/users",
        json=missing_field
    )
    
    if response.status_code == 400:
        print_success("Validation correctly rejected missing field!")
        print(f"Error: {json.dumps(response.json(), indent=2)}")
    else:
        print_error("Expected validation error")
    
    # Test with value outside range
    print_info("\nTest 4: Age outside valid range")
    invalid_age = {
        "email": "john@example.com",
        "username": "johndoe",
        "age": 15  # Below minimum of 18
    }
    
    print(f"Sending: {json.dumps(invalid_age, indent=2)}")
    response = requests.post(
        f"{BASE_URL}/api/advanced-features-test/users",
        json=invalid_age
    )
    
    if response.status_code == 400:
        print_success("Validation correctly rejected age < 18!")
        print(f"Error: {json.dumps(response.json(), indent=2)}")
    else:
        print_error("Expected validation error")


def demo_callbacks(token, entity_id):
    """Demonstrate async callbacks."""
    print_section("5. Demo: Async Callbacks")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print_info("For callback demo, we'll use a static callback URL")
    print_info("In production, you'd use a real webhook endpoint\n")
    
    # Create endpoint with callback configuration
    endpoint_data = {
        "name": "Callback Demo",
        "method": "POST",
        "path": "/process-order",
        "response_body": json.dumps({
            "order_id": "{{uuid}}",
            "status": "processing",
            "message": "Your order is being processed. You will receive a callback shortly."
        }),
        "response_code": 202,
        "is_active": True,
        "callback_enabled": True,
        "callback_url": "https://webhook.site/unique-url-here",  # Replace with real URL to see callbacks
        "callback_method": "POST",
        "callback_delay_ms": 5000  # 5 second delay
    }
    
    print_info("Creating endpoint with callback (5 second delay)...")
    response = requests.post(
        f"{BASE_URL}/admin/entities/{entity_id}/endpoints",
        json=endpoint_data,
        headers=headers
    )
    
    if response.status_code != 200:
        print_error(f"Failed to create endpoint: {response.text}")
        return
    
    print_success("Endpoint created with callback configuration")
    
    # Test the endpoint
    print_info("\nSending request to endpoint...")
    order_request = {
        "product_id": "PROD123",
        "quantity": 2,
        "total": 49.99
    }
    
    response = requests.post(
        f"{BASE_URL}/api/advanced-features-test/process-order",
        json=order_request
    )
    
    if response.status_code == 202:
        print_success("Request accepted!")
        print(json.dumps(response.json(), indent=2))
        print_info("\n⏱️  Callback will be sent to configured URL in 5 seconds...")
        print_info("Check your webhook URL to see the callback payload")
    else:
        print_error(f"Request failed: {response.text}")
    
    # Demo with callback URL extraction
    print_info("\nCreating endpoint with callback URL extraction...")
    endpoint_data_extract = {
        "name": "Callback Extraction Demo",
        "method": "POST",
        "path": "/payment",
        "response_body": json.dumps({
            "payment_id": "{{uuid}}",
            "status": "pending",
            "amount": "{{random_float:10:500}}"
        }),
        "response_code": 202,
        "is_active": True,
        "callback_enabled": True,
        "callback_extract_from_request": True,
        "callback_extract_field": "webhook_url",  # Extract from request body
        "callback_method": "POST",
        "callback_delay_ms": 3000  # 3 second delay
    }
    
    response = requests.post(
        f"{BASE_URL}/admin/entities/{entity_id}/endpoints",
        json=endpoint_data_extract,
        headers=headers
    )
    
    if response.status_code != 200:
        print_error(f"Failed to create endpoint: {response.text}")
        return
    
    print_success("Endpoint created with callback URL extraction")
    
    # Test with custom callback URL
    print_info("\nSending request with custom callback URL...")
    payment_request = {
        "amount": 99.99,
        "currency": "USD",
        "webhook_url": "https://webhook.site/your-unique-url"  # Replace with real URL
    }
    
    response = requests.post(
        f"{BASE_URL}/api/advanced-features-test/payment",
        json=payment_request
    )
    
    if response.status_code == 202:
        print_success("Request accepted!")
        print(json.dumps(response.json(), indent=2))
        print_info("\n⏱️  Callback will be sent to your custom URL in 3 seconds...")
    else:
        print_error(f"Request failed: {response.text}")


def demo_combined_features(token, entity_id):
    """Demonstrate all features working together."""
    print_section("6. Demo: All Features Combined")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print_info("Creating endpoint with ALL features enabled...\n")
    
    # Schema for order validation
    schema = {
        "type": "object",
        "required": ["items", "customer_email", "callback_url"],
        "properties": {
            "items": {
                "type": "array",
                "minItems": 1,
                "items": {
                    "type": "object",
                    "required": ["product_id", "quantity"],
                    "properties": {
                        "product_id": {"type": "string"},
                        "quantity": {"type": "integer", "minimum": 1}
                    }
                }
            },
            "customer_email": {
                "type": "string",
                "format": "email"
            },
            "callback_url": {
                "type": "string",
                "format": "uri"
            }
        }
    }
    
    endpoint_data = {
        "name": "Complete Order API",
        "method": "POST",
        "path": "/complete-order",
        "response_body": json.dumps({
            "order_id": "{{uuid}}",
            "order_number": "ORD-{{random_int:10000:99999}}",
            "status": "processing",
            "created_at": "{{timestamp_iso}}",
            "customer": {
                "id": "{{uuid}}",
                "username": "{{random_username}}"
            },
            "estimated_delivery": "{{date}}",
            "total_amount": "{{random_float:50:500}}"
        }),
        "response_code": 202,
        "is_active": True,
        # Schema validation
        "schema_validation_enabled": True,
        "request_schema": json.dumps(schema),
        # Callback configuration
        "callback_enabled": True,
        "callback_extract_from_request": True,
        "callback_extract_field": "callback_url",
        "callback_method": "POST",
        "callback_delay_ms": 7000  # 7 second delay
    }
    
    response = requests.post(
        f"{BASE_URL}/admin/entities/{entity_id}/endpoints",
        json=endpoint_data,
        headers=headers
    )
    
    if response.status_code != 200:
        print_error(f"Failed to create endpoint: {response.text}")
        return
    
    print_success("Endpoint created with:")
    print_info("  ✓ Dynamic placeholders (UUID, timestamps, random data)")
    print_info("  ✓ Request schema validation")
    print_info("  ✓ Async callback with URL extraction")
    
    # Test with valid request
    print_info("\nTest: Sending valid order...")
    order_request = {
        "items": [
            {"product_id": "PROD-123", "quantity": 2},
            {"product_id": "PROD-456", "quantity": 1}
        ],
        "customer_email": "customer@example.com",
        "callback_url": "https://webhook.site/your-unique-url"
    }
    
    print(f"Request: {json.dumps(order_request, indent=2)}\n")
    
    response = requests.post(
        f"{BASE_URL}/api/advanced-features-test/complete-order",
        json=order_request
    )
    
    if response.status_code == 202:
        print_success("Order accepted! (Schema validated)")
        print_success("Response with dynamic values:")
        print(json.dumps(response.json(), indent=2))
        print_info("\n⏱️  Callback will be sent in 7 seconds to the URL from request")
        print_info("\nThis demonstrates:")
        print_info("  1. Schema validated the incoming request")
        print_info("  2. Response contains dynamically generated values")
        print_info("  3. Callback will be sent to the extracted URL")
    else:
        print_error(f"Request failed: {response.text}")
    
    # Test with invalid request (missing required field)
    print_info("\nTest: Sending invalid order (missing callback_url)...")
    invalid_order = {
        "items": [{"product_id": "PROD-123", "quantity": 2}],
        "customer_email": "customer@example.com"
        # missing callback_url
    }
    
    response = requests.post(
        f"{BASE_URL}/api/advanced-features-test/complete-order",
        json=invalid_order
    )
    
    if response.status_code == 400:
        print_success("Schema validation correctly rejected invalid request!")
        print(f"Error: {json.dumps(response.json(), indent=2)}")
    else:
        print_error("Expected validation error")


def main():
    """Run all demos."""
    print(f"\n{Colors.BOLD}{Colors.HEADER}")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║       Mock-Lab Advanced Features Demo                      ║")
    print("║                                                             ║")
    print("║  1. Dynamic Placeholders                                   ║")
    print("║  2. Request Schema Validation                              ║")
    print("║  3. Async Callbacks                                        ║")
    print("║  4. All Features Combined                                  ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print(f"{Colors.ENDC}\n")
    
    print_info(f"Connecting to Mock-Lab at {BASE_URL}")
    print_info("Make sure the backend is running!\n")
    
    try:
        # Step 1: Authenticate
        token = register_and_login()
        if not token:
            print_error("Authentication failed. Exiting.")
            return
        
        # Step 2: Create entity
        entity = create_entity(token)
        if not entity:
            print_error("Entity creation failed. Exiting.")
            return
        
        entity_id = entity["id"]
        
        # Step 3: Run demos
        demo_placeholders(token, entity_id)
        demo_schema_validation(token, entity_id)
        demo_callbacks(token, entity_id)
        demo_combined_features(token, entity_id)
        
        # Success
        print_section("🎉 Demo Complete!")
        print_success("All advanced features demonstrated successfully!")
        print_info("\nNext steps:")
        print_info("  - Open http://localhost:8000/docs to explore the API")
        print_info("  - Check the web UI to see logs and manage endpoints")
        print_info("  - Read documentation/ADVANCED_FEATURES.md for more details")
        
    except requests.exceptions.ConnectionError:
        print_error("\nError: Could not connect to Mock-Lab backend")
        print_info("Make sure the backend is running:")
        print_info("  python -m uvicorn backend.main:app --reload")
    except Exception as e:
        print_error(f"\nUnexpected error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
