"""
JSON Schema validation module for request validation.
Validates incoming requests against configured JSON schemas.
"""
import json
from typing import Optional, Dict, Any, Tuple
import jsonschema
from jsonschema import validate, ValidationError, Draft7Validator


class SchemaValidator:
    """Validator for JSON Schema validation of requests."""
    
    def __init__(self):
        """Initialize the schema validator."""
        pass
    
    def validate_request(
        self, 
        schema_str: str, 
        request_data: Any
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate request data against a JSON schema.
        
        Args:
            schema_str: JSON schema as a string
            request_data: The data to validate (usually a dict from parsed JSON)
            
        Returns:
            Tuple of (is_valid, error_message)
            - is_valid: True if validation passes, False otherwise
            - error_message: None if valid, error description if invalid
        """
        try:
            # Parse schema
            schema = json.loads(schema_str)
        except json.JSONDecodeError as e:
            return False, f"Invalid schema JSON: {str(e)}"
        
        try:
            # Validate using Draft7Validator
            validator = Draft7Validator(schema)
            validator.validate(request_data)
            return True, None
        except ValidationError as e:
            # Format validation error message
            error_msg = self._format_validation_error(e)
            return False, error_msg
        except Exception as e:
            return False, f"Validation error: {str(e)}"
    
    def _format_validation_error(self, error: ValidationError) -> str:
        """
        Format a validation error into a readable message.
        
        Args:
            error: The ValidationError from jsonschema
            
        Returns:
            Formatted error message
        """
        # Build path to the error
        path = " -> ".join(str(p) for p in error.absolute_path) if error.absolute_path else "root"
        
        # Get the error message
        message = error.message
        
        # Include the failed value if it's not too large
        failed_value = error.instance
        if isinstance(failed_value, (str, int, float, bool)) or failed_value is None:
            return f"Validation failed at '{path}': {message}. Value: {failed_value}"
        elif isinstance(failed_value, (dict, list)):
            # For complex types, don't show the full value
            return f"Validation failed at '{path}': {message}"
        else:
            return f"Validation failed at '{path}': {message}"
    
    def is_valid_schema(self, schema_str: str) -> Tuple[bool, Optional[str]]:
        """
        Check if a schema string is a valid JSON Schema.
        
        Args:
            schema_str: JSON schema as a string
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            schema = json.loads(schema_str)
        except json.JSONDecodeError as e:
            return False, f"Invalid JSON: {str(e)}"
        
        try:
            # Try to create a validator to check schema validity
            Draft7Validator.check_schema(schema)
            return True, None
        except jsonschema.SchemaError as e:
            return False, f"Invalid schema: {str(e)}"
        except Exception as e:
            return False, f"Schema validation error: {str(e)}"


# Global instance
schema_validator = SchemaValidator()


def validate_request(schema_str: str, request_data: Any) -> Tuple[bool, Optional[str]]:
    """
    Convenience function to validate request data against a schema.
    
    Args:
        schema_str: JSON schema as a string
        request_data: The data to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    return schema_validator.validate_request(schema_str, request_data)


def is_valid_schema(schema_str: str) -> Tuple[bool, Optional[str]]:
    """
    Convenience function to check if a schema is valid.
    
    Args:
        schema_str: JSON schema as a string
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    return schema_validator.is_valid_schema(schema_str)
