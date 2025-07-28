import json
from datetime import datetime

# In-memory storage for user data
users_data = {}
workout_progress = {}

# Embedded exercise and nutrition data for Netlify
exercises_data = {
    "exercises": [
        {
            "id": 1,
            "name": "Push-ups",
            "level": "beginner",
            "gender": "both",
            "goal": "general",
            "duration": 120,
            "met_value": 8.0,
            "instructions": {
                "male": ["Start in plank position", "Lower body to chest", "Push back up"],
                "female": ["Modified position available", "Lower to chest", "Push up"]
            },
            "tips": "Keep body straight",
            "video_description": "Push-up demonstration"
        },
        {
            "id": 2,
            "name": "Squats",
            "level": "beginner",
            "gender": "both",
            "goal": "general",
            "duration": 180,
            "met_value": 6.0,
            "instructions": {
                "male": ["Stand with feet apart", "Lower down like sitting", "Stand back up"],
                "female": ["Hip-width stance", "Keep chest up", "Push through heels"]
            },
            "tips": "Keep knees behind toes",
            "video_description": "Perfect squat form"
        },
        {
            "id": 3,
            "name": "Plank",
            "level": "beginner",
            "gender": "both",
            "goal": "general",
            "duration": 60,
            "met_value": 4.0,
            "instructions": {
                "male": ["Hold plank position", "Keep body straight", "Breathe normally"],
                "female": ["Forearm plank", "Engage core", "Hold steady"]
            },
            "tips": "Don't let hips sag",
            "video_description": "Static plank hold"
        }
    ]
}

nutrition_data = {
    "tiers": {
        "basic": {
            "name": "Basic Plan",
            "budget": "$5-8/day",
            "meals": {
                "breakfast": [{"name": "Oatmeal with Banana", "calories": 350}],
                "lunch": [{"name": "Chicken Rice Bowl", "calories": 450}],
                "dinner": [{"name": "Fish & Vegetables", "calories": 400}]
            }
        },
        "medium": {
            "name": "Medium Plan",
            "budget": "$10-15/day", 
            "meals": {
                "breakfast": [{"name": "Avocado Toast with Eggs", "calories": 420}],
                "lunch": [{"name": "Quinoa Buddha Bowl", "calories": 520}],
                "dinner": [{"name": "Salmon & Sweet Potato", "calories": 550}]
            }
        },
        "premium": {
            "name": "Premium Plan",
            "budget": "$18-25/day",
            "meals": {
                "breakfast": [{"name": "Organic Acai Bowl", "calories": 480}],
                "lunch": [{"name": "Grass-fed Steak Salad", "calories": 580}],
                "dinner": [{"name": "Lobster & Quinoa", "calories": 620}]
            }
        }
    }
}

def save_profile(event_body):
    try:
        data = json.loads(event_body)
        user_id = data.get('user_id', 'default_user')
        
        # Calculate BMI and BMR
        height_m = data['height'] / 100
        bmi = data['weight'] / (height_m ** 2)
        data['bmi'] = round(bmi, 1)
        
        if data['gender'] == 'male':
            bmr = 88.362 + (13.397 * data['weight']) + (4.799 * data['height']) - (5.677 * data['age'])
        else:
            bmr = 447.593 + (9.247 * data['weight']) + (3.098 * data['height']) - (4.330 * data['age'])
        
        data['bmr'] = round(bmr, 0)
        users_data[user_id] = data
        
        workout_progress[user_id] = {
            'current_day': 1,
            'completed_days': [],
            'start_date': datetime.now().isoformat(),
            'preferred_time': data.get('preferred_time', '07:00'),
            'total_calories_burned': 0,
            'streak': 0
        }
        
        return {'success': True, 'user_id': user_id, 'bmi': data['bmi'], 'bmr': data['bmr']}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def get_workout_plan(user_id):
    try:
        if user_id not in users_data:
            # Create demo profile
            demo_profile = {
                'user_id': user_id,
                'goal': 'weightLoss',
                'fitnessLevel': 'beginner',
                'gender': 'male'
            }
            users_data[user_id] = demo_profile
            workout_progress[user_id] = {'current_day': 1, 'completed_days': []}
        
        return {
            'success': True,
            'exercises': exercises_data.get('exercises', [])[:3],
            'current_day': 1,
            'total_exercises': 3
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}

def get_nutrition_plan(user_id):
    try:
        if user_id not in users_data:
            demo_profile = {
                'user_id': user_id,
                'economicLevel': 'medium',
                'goal': 'weightLoss',
                'bmr': 1700
            }
            users_data[user_id] = demo_profile
        
        return {
            'success': True,
            'plan': nutrition_data.get('tiers', {}).get('medium', {}),
            'daily_calories': 1700,
            'economic_level': 'medium'
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}

def handler(event, context):
    """Netlify function handler"""
    try:
        path = event.get('path', '/')
        method = event.get('httpMethod', 'GET')
        body = event.get('body', '')
        
        headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization'
        }
        
        if method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': ''
            }
        
        if path == '/':
            return {
                'statusCode': 200,
                'headers': {**headers, 'Content-Type': 'text/html'},
                'body': '''<!DOCTYPE html>
<html>
<head>
    <title>Training Club</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <h1>Training Club - Fitness Application</h1>
    <p>Welcome to your personalized fitness journey!</p>
</body>
</html>'''
            }
        
        elif path == '/api/profile' and method == 'POST':
            result = save_profile(body)
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(result)
            }
        
        elif path.startswith('/api/workout/'):
            user_id = path.split('/')[-1]
            result = get_workout_plan(user_id)
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(result)
            }
        
        elif path.startswith('/api/nutrition/'):
            user_id = path.split('/')[-1]
            result = get_nutrition_plan(user_id)
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(result)
            }
        
        else:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': 'Not found'})
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }