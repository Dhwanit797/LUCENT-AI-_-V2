import sys
sys.path.insert(0, r'C:\odooooo\ai-business-dashboard-main\ai-business-dashboard-main\backend')

from database import SessionLocal, engine, Base
from models.user import User
from core.security import get_password_hash, create_access_token

Base.metadata.create_all(bind=engine)

db = SessionLocal()
try:
    # Check if table exists and has right columns
    from sqlalchemy import inspect
    insp = inspect(engine)
    cols = [c['name'] for c in insp.get_columns('users')]
    print('columns:', cols)
    
    # Check demo user
    u = db.query(User).filter(User.email == 'demo@business.ai').first()
    print('demo user:', u.email if u else 'NOT FOUND')
    
    # Try creating a new user
    existing = db.query(User).filter(User.email == 'newuser@test.com').first()
    if existing:
        print('test user already exists, deleting...')
        db.delete(existing)
        db.commit()
    
    new_user = User(email='newuser@test.com', hashed_password=get_password_hash('password123'), full_name='Test User')
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    print('created user id:', new_user.id)
    token = create_access_token({'sub': new_user.email, 'id': new_user.id})
    print('token ok:', bool(token))
finally:
    db.close()
