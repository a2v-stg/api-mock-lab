"""
Database migrations for Mock-Lab.
Handles schema changes automatically on startup.
"""
from sqlalchemy import text, inspect
import logging

logger = logging.getLogger(__name__)


def run_migrations(engine):
    """Run all necessary migrations to bring database schema up to date."""
    logger.info("Running database migrations...")
    
    try:
        # Migration 1: Add owner_id and is_public to entities table
        migrate_add_entity_access_control(engine)
        
        # Migration 2: Add is_admin to users table
        migrate_add_user_admin_field(engine)
        
        # Migration 3: Add callback and schema validation fields
        migrate_add_callback_and_schema_fields(engine)
        
        logger.info("All migrations completed successfully")
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        raise


def column_exists(engine, table_name, column_name):
    """Check if a column exists in a table."""
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns


def table_exists(engine, table_name):
    """Check if a table exists."""
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()


def migrate_add_entity_access_control(engine):
    """
    Migration: Add entity access control fields
    - Adds owner_id column to entities table
    - Adds is_public column to entities table
    """
    if not table_exists(engine, 'entities'):
        logger.info("Entities table doesn't exist yet, skipping migration")
        return
    
    with engine.connect() as conn:
        # Check if owner_id column exists
        if not column_exists(engine, 'entities', 'owner_id'):
            logger.info("Adding owner_id column to entities table")
            
            # Add owner_id column (nullable, as existing entities won't have an owner)
            conn.execute(text("""
                ALTER TABLE entities 
                ADD COLUMN owner_id INTEGER REFERENCES users(id)
            """))
            conn.commit()
            logger.info("✓ Added owner_id column")
        else:
            logger.info("✓ owner_id column already exists")
        
        # Check if is_public column exists
        if not column_exists(engine, 'entities', 'is_public'):
            logger.info("Adding is_public column to entities table")
            
            # Determine database type for boolean default syntax
            db_url = str(engine.url)
            
            if 'sqlite' in db_url:
                # SQLite uses 0/1 for boolean
                conn.execute(text("""
                    ALTER TABLE entities 
                    ADD COLUMN is_public INTEGER DEFAULT 0 NOT NULL
                """))
            else:
                # PostgreSQL uses TRUE/FALSE
                conn.execute(text("""
                    ALTER TABLE entities 
                    ADD COLUMN is_public BOOLEAN DEFAULT FALSE NOT NULL
                """))
            
            conn.commit()
            logger.info("✓ Added is_public column")
        else:
            logger.info("✓ is_public column already exists")


def migrate_add_user_admin_field(engine):
    """
    Migration: Add is_admin field to users table
    - Adds is_admin column to users table (defaults to False)
    """
    if not table_exists(engine, 'users'):
        logger.info("Users table doesn't exist yet, skipping migration")
        return
    
    with engine.connect() as conn:
        # Check if is_admin column exists
        if not column_exists(engine, 'users', 'is_admin'):
            logger.info("Adding is_admin column to users table")
            
            # Determine database type for boolean default syntax
            db_url = str(engine.url)
            
            if 'sqlite' in db_url:
                # SQLite uses 0/1 for boolean
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN is_admin INTEGER DEFAULT 0 NOT NULL
                """))
            else:
                # PostgreSQL uses TRUE/FALSE
                conn.execute(text("""
                    ALTER TABLE users 
                    ADD COLUMN is_admin BOOLEAN DEFAULT FALSE NOT NULL
                """))
            
            conn.commit()
            logger.info("✓ Added is_admin column")
        else:
            logger.info("✓ is_admin column already exists")


def migrate_add_callback_and_schema_fields(engine):
    """
    Migration: Add callback and schema validation fields to mock_endpoints table
    - Adds callback configuration fields
    - Adds request schema validation fields
    """
    if not table_exists(engine, 'mock_endpoints'):
        logger.info("Mock endpoints table doesn't exist yet, skipping migration")
        return
    
    with engine.connect() as conn:
        db_url = str(engine.url)
        is_sqlite = 'sqlite' in db_url
        
        # Callback fields
        callback_fields = [
            ('callback_enabled', 'INTEGER DEFAULT 0 NOT NULL' if is_sqlite else 'BOOLEAN DEFAULT FALSE NOT NULL'),
            ('callback_url', 'TEXT'),
            ('callback_method', "VARCHAR DEFAULT 'POST' NOT NULL"),
            ('callback_delay_ms', 'INTEGER DEFAULT 0 NOT NULL'),
            ('callback_extract_from_request', 'INTEGER DEFAULT 0 NOT NULL' if is_sqlite else 'BOOLEAN DEFAULT FALSE NOT NULL'),
            ('callback_extract_field', 'VARCHAR'),
            ('callback_payload', 'TEXT'),
        ]
        
        # Schema validation fields
        schema_fields = [
            ('request_schema', 'TEXT'),
            ('schema_validation_enabled', 'INTEGER DEFAULT 0 NOT NULL' if is_sqlite else 'BOOLEAN DEFAULT FALSE NOT NULL'),
        ]
        
        all_fields = callback_fields + schema_fields
        
        for field_name, field_type in all_fields:
            if not column_exists(engine, 'mock_endpoints', field_name):
                logger.info(f"Adding {field_name} column to mock_endpoints table")
                conn.execute(text(f"""
                    ALTER TABLE mock_endpoints 
                    ADD COLUMN {field_name} {field_type}
                """))
                conn.commit()
                logger.info(f"✓ Added {field_name} column")
            else:
                logger.info(f"✓ {field_name} column already exists")
