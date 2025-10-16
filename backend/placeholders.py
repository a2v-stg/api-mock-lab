"""
Dynamic placeholder replacement engine for response bodies.
Supports placeholders like {{uuid}}, {{timestamp}}, {{random_name}}, etc.
"""
import re
import uuid
import random
import string
from datetime import datetime, timezone
from typing import Dict, Any, List, Callable


class PlaceholderEngine:
    """Engine for replacing placeholders in response bodies with dynamic values."""
    
    # Common first names for random name generation
    FIRST_NAMES = [
        "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
        "William", "Barbara", "David", "Elizabeth", "Richard", "Susan", "Joseph", "Jessica",
        "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa",
        "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
        "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle"
    ]
    
    LAST_NAMES = [
        "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
        "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
        "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
        "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
        "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores"
    ]
    
    EMAIL_DOMAINS = [
        "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "example.com",
        "test.com", "demo.com", "mail.com", "email.com", "domain.com"
    ]
    
    def __init__(self):
        """Initialize the placeholder engine with registered handlers."""
        self.handlers: Dict[str, Callable] = {
            # UUID placeholders
            "uuid": self._generate_uuid,
            "uuid4": self._generate_uuid,
            "guid": self._generate_uuid,
            
            # Timestamp placeholders
            "timestamp": self._generate_timestamp,
            "timestamp_iso": self._generate_timestamp_iso,
            "timestamp_unix": self._generate_timestamp_unix,
            "date": self._generate_date,
            "datetime": self._generate_datetime,
            "time": self._generate_time,
            
            # Random number placeholders
            "random": self._generate_random_number,
            "random_int": self._generate_random_int,
            "random_float": self._generate_random_float,
            
            # Random string placeholders
            "random_string": self._generate_random_string,
            "random_hex": self._generate_random_hex,
            "random_alphanumeric": self._generate_random_alphanumeric,
            
            # Random personal data placeholders
            "random_name": self._generate_random_name,
            "random_first_name": self._generate_random_first_name,
            "random_last_name": self._generate_random_last_name,
            "random_email": self._generate_random_email,
            "random_username": self._generate_random_username,
            
            # Random boolean
            "random_bool": self._generate_random_bool,
            "random_boolean": self._generate_random_bool,
        }
    
    def replace_placeholders(self, text: str) -> str:
        """
        Replace all placeholders in the given text with dynamic values.
        
        Supports both simple placeholders: {{uuid}}
        And parameterized placeholders: {{random_int:1:100}}
        
        Args:
            text: String containing placeholders to replace
            
        Returns:
            String with all placeholders replaced with dynamic values
        """
        # Pattern to match {{placeholder}} or {{placeholder:arg1:arg2}}
        pattern = r'\{\{([a-zA-Z_][a-zA-Z0-9_]*(?::[^}]*)?)\}\}'
        
        def replacer(match):
            full_placeholder = match.group(1)
            parts = full_placeholder.split(':')
            placeholder_name = parts[0]
            args = parts[1:] if len(parts) > 1 else []
            
            handler = self.handlers.get(placeholder_name)
            if handler:
                try:
                    return str(handler(*args))
                except Exception as e:
                    # If handler fails, return the original placeholder
                    return match.group(0)
            else:
                # Unknown placeholder, leave it as is
                return match.group(0)
        
        return re.sub(pattern, replacer, text)
    
    # UUID Generators
    def _generate_uuid(self, *args) -> str:
        """Generate a UUID v4."""
        return str(uuid.uuid4())
    
    # Timestamp Generators
    def _generate_timestamp(self, *args) -> int:
        """Generate current Unix timestamp in milliseconds."""
        return int(datetime.now(timezone.utc).timestamp() * 1000)
    
    def _generate_timestamp_iso(self, *args) -> str:
        """Generate current timestamp in ISO 8601 format."""
        return datetime.now(timezone.utc).isoformat()
    
    def _generate_timestamp_unix(self, *args) -> int:
        """Generate current Unix timestamp in seconds."""
        return int(datetime.now(timezone.utc).timestamp())
    
    def _generate_date(self, *args) -> str:
        """Generate current date (YYYY-MM-DD)."""
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    def _generate_datetime(self, *args) -> str:
        """Generate current datetime (YYYY-MM-DD HH:MM:SS)."""
        return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    
    def _generate_time(self, *args) -> str:
        """Generate current time (HH:MM:SS)."""
        return datetime.now(timezone.utc).strftime("%H:%M:%S")
    
    # Random Number Generators
    def _generate_random_number(self, *args) -> int:
        """Generate a random number between 0 and 1000 (or custom range)."""
        if len(args) >= 2:
            min_val = int(args[0])
            max_val = int(args[1])
            return random.randint(min_val, max_val)
        elif len(args) == 1:
            max_val = int(args[0])
            return random.randint(0, max_val)
        return random.randint(0, 1000)
    
    def _generate_random_int(self, *args) -> int:
        """Generate a random integer. Usage: {{random_int:min:max}}"""
        return self._generate_random_number(*args)
    
    def _generate_random_float(self, *args) -> float:
        """Generate a random float. Usage: {{random_float:min:max}}"""
        if len(args) >= 2:
            min_val = float(args[0])
            max_val = float(args[1])
            return round(random.uniform(min_val, max_val), 2)
        elif len(args) == 1:
            max_val = float(args[0])
            return round(random.uniform(0, max_val), 2)
        return round(random.uniform(0, 100), 2)
    
    # Random String Generators
    def _generate_random_string(self, *args) -> str:
        """Generate a random string. Usage: {{random_string:length}}"""
        length = int(args[0]) if args else 10
        return ''.join(random.choices(string.ascii_letters, k=length))
    
    def _generate_random_hex(self, *args) -> str:
        """Generate a random hex string. Usage: {{random_hex:length}}"""
        length = int(args[0]) if args else 16
        return ''.join(random.choices(string.hexdigits.lower(), k=length))
    
    def _generate_random_alphanumeric(self, *args) -> str:
        """Generate a random alphanumeric string. Usage: {{random_alphanumeric:length}}"""
        length = int(args[0]) if args else 10
        return ''.join(random.choices(string.ascii_letters + string.digits, k=length))
    
    # Random Personal Data Generators
    def _generate_random_name(self, *args) -> str:
        """Generate a random full name."""
        first = random.choice(self.FIRST_NAMES)
        last = random.choice(self.LAST_NAMES)
        return f"{first} {last}"
    
    def _generate_random_first_name(self, *args) -> str:
        """Generate a random first name."""
        return random.choice(self.FIRST_NAMES)
    
    def _generate_random_last_name(self, *args) -> str:
        """Generate a random last name."""
        return random.choice(self.LAST_NAMES)
    
    def _generate_random_email(self, *args) -> str:
        """Generate a random email address."""
        username = ''.join(random.choices(string.ascii_lowercase, k=8))
        domain = random.choice(self.EMAIL_DOMAINS)
        return f"{username}@{domain}"
    
    def _generate_random_username(self, *args) -> str:
        """Generate a random username."""
        return ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
    
    # Random Boolean Generator
    def _generate_random_bool(self, *args) -> bool:
        """Generate a random boolean value."""
        return random.choice([True, False])


# Global instance
placeholder_engine = PlaceholderEngine()


def replace_placeholders(text: str) -> str:
    """
    Convenience function to replace placeholders in text.
    
    Example:
        >>> replace_placeholders('{"id": "{{uuid}}", "timestamp": {{timestamp}}}')
        '{"id": "123e4567-e89b-12d3-a456-426614174000", "timestamp": 1634567890123}'
    """
    return placeholder_engine.replace_placeholders(text)
