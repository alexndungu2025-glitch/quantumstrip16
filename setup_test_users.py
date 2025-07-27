#!/usr/bin/env python3
"""
Setup test users for QuantumStrip testing
"""

import asyncio
import sys
import os
sys.path.append('/app/backend')

from database import get_database
from models import User, UserRole, ViewerProfile, ModelProfile
from auth import hash_password
import uuid

async def setup_test_users():
    """Create test users for testing"""
    db = await get_database()
    
    # Test users data
    test_users = [
        {
            "username": "testviewer",
            "email": "viewer@test.com",
            "phone": "254712345678",
            "password": "password123",
            "role": UserRole.VIEWER,
            "age": 25,
            "country": "ke"
        },
        {
            "username": "testmodel",
            "email": "model@test.com",
            "phone": "254787654321",
            "password": "password123",
            "role": UserRole.MODEL,
            "age": 23,
            "country": "ke"
        },
        {
            "username": "testadmin",
            "email": "admin@test.com",
            "phone": "254712345679",
            "password": "password123",
            "role": UserRole.ADMIN,
            "age": 30,
            "country": "ke"
        }
    ]
    
    for user_data in test_users:
        # Check if user already exists
        existing_user = await db.users.find_one({"email": user_data["email"]})
        if existing_user:
            print(f"User {user_data['email']} already exists, skipping...")
            continue
        
        # Create user
        user = User(
            username=user_data["username"],
            email=user_data["email"],
            phone=user_data["phone"],
            password_hash=hash_password(user_data["password"]),
            role=user_data["role"],
            age=user_data["age"],
            country=user_data["country"]
        )
        
        # Insert user
        result = await db.users.insert_one(user.model_dump(by_alias=True))
        user.id = result.inserted_id
        
        # Create role-specific profile
        if user_data["role"] == UserRole.VIEWER:
            viewer_profile = ViewerProfile(user_id=user.id)
            await db.viewer_profiles.insert_one(viewer_profile.model_dump(by_alias=True))
            print(f"Created viewer: {user_data['email']}")
            
        elif user_data["role"] == UserRole.MODEL:
            model_profile = ModelProfile(
                user_id=user.id,
                display_name=user_data["username"]
            )
            await db.model_profiles.insert_one(model_profile.model_dump(by_alias=True))
            print(f"Created model: {user_data['email']}")
            
        else:  # ADMIN
            print(f"Created admin: {user_data['email']}")
    
    print("Test users setup completed!")

if __name__ == "__main__":
    asyncio.run(setup_test_users())