#!/usr/bin/env python3
"""
Check and fix test users
"""

import asyncio
import sys
import os
sys.path.append('/app/backend')

from database import get_database
from models import User, UserRole, ViewerProfile, ModelProfile
from auth import hash_password, verify_password

async def check_and_fix_users():
    """Check and fix test users"""
    db = await get_database()
    
    # Check existing users
    users = await db.users.find({}).to_list(length=None)
    print(f"Found {len(users)} users in database:")
    
    for user in users:
        print(f"- {user.get('email')} (role: {user.get('role')}, id: {user.get('_id')})")
    
    # Check model@test.com specifically
    model_user = await db.users.find_one({"email": "model@test.com"})
    if model_user:
        print(f"\nModel user found: {model_user}")
        
        # Test password verification
        test_password = "password123"
        stored_hash = model_user.get('password_hash')
        
        if verify_password(test_password, stored_hash):
            print("✅ Password verification works!")
        else:
            print("❌ Password verification failed, updating password...")
            
            # Update password
            new_hash = hash_password(test_password)
            await db.users.update_one(
                {"_id": model_user["_id"]},
                {"$set": {"password_hash": new_hash}}
            )
            print("✅ Password updated!")
            
            # Verify again
            if verify_password(test_password, new_hash):
                print("✅ New password verification works!")
            else:
                print("❌ Still not working!")
    else:
        print("❌ Model user not found!")
        
        # Create model user
        user = User(
            username="testmodel",
            email="model@test.com",
            phone="254787654321",
            password_hash=hash_password("password123"),
            role=UserRole.MODEL,
            age=23,
            country="ke"
        )
        
        result = await db.users.insert_one(user.model_dump(by_alias=True))
        user.id = result.inserted_id
        
        # Create model profile
        model_profile = ModelProfile(
            user_id=user.id,
            display_name="testmodel"
        )
        await db.model_profiles.insert_one(model_profile.model_dump(by_alias=True))
        print("✅ Created model user!")

if __name__ == "__main__":
    asyncio.run(check_and_fix_users())