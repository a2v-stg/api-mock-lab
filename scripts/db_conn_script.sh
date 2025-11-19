import os
from sqlalchemy import create_engine, text
# Get DATABASE_URL from environment
db_url='postgresql://mocklab:asngte4sie#6VA9kz@dev-cluster.cluster-cvik42ey46i5.us-east-2.rds.amazonaws.com:5432'
#db_url = os.getenv("DATABASE_URL")
print(f"Connecting to: {db_url}")
# Create a FRESH engine (don't reuse imports!)
engine = create_engine(db_url)
conn = engine.connect()
result = conn.execute(text("SELECT id, email, username, is_admin FROM users"))
for row in result:
    print(f"  {row[2]} ({row[1]}) - Admin: {row[3]}")

with engine.connect() as conn:
    # List all users
    result = conn.execute(text("SELECT id, email, username, is_admin FROM users"))
    print("\nUsers:")
    for row in result:
        print(f"  {row[2]} ({row[1]}) - Admin: {row[3]}")
    
    # Find your user and update
    your_email = input("\nEnter your email: ").strip()
    
    result = conn.execute(
        text("SELECT id, username, is_admin FROM users WHERE email = :e"), 
        {"e": your_email}
    )
    user = result.fetchone()
    
    if user and not user[2]:
        conn.execute(text("UPDATE users SET is_admin = TRUE WHERE id = :id"), {"id": user[0]})
        conn.commit()
        print(f"\n✓ Made {user[1]} an admin!")
    elif user:
        print(f"\n✓ Already admin")
    else:
        print(f"\n✗ Not found")