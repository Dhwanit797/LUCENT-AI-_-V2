import sys
sys.path.insert(0, r'C:\odooooo\ai-business-dashboard-main\ai-business-dashboard-main\backend')

# Simulate exactly what the route handler does
from database import SessionLocal, engine, Base
from models.user import User
from core.security import get_password_hash, create_access_token

Base.metadata.create_all(bind=engine)

db = SessionLocal()
try:
    email = 'brand_new@test.com'
    full_name = 'Test User'
    password = 'password123'

    print('step 1: checking existing...')
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        print('  -> already exists, removing for test')
        db.delete(existing)
        db.commit()

    print('step 2: hashing password...')
    hashed = get_password_hash(password)
    print('  -> hashed ok')

    print('step 3: creating user...')
    user = User(
        email=email.lower().strip(),
        hashed_password=hashed,
        full_name=full_name.strip(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f'  -> user id={user.id}')

    print('step 4: creating token...')
    token = create_access_token({'sub': user.email, 'id': user.id})
    print('  -> token ok:', token[:40])

    print('ALL STEPS PASSED')
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
