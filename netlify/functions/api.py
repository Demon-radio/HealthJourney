import json
import os
from datetime import datetime
import urllib.parse

# Simple in-memory storage (will reset on each deploy)
users = {}
workouts = {}

# Load exercise and nutrition data
def load_json_data():
    try:
        # Get the absolute path to the data files
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.join(current_dir, '..', '..')
        
        exercises_path = os.path.join(project_root, 'data', 'exercises.json')
        nutrition_path = os.path.join(project_root, 'data', 'nutrition.json')
        
        with open(exercises_path, 'r', encoding='utf-8') as f:
            exercises = json.load(f)
        with open(nutrition_path, 'r', encoding='utf-8') as f:
            nutrition = json.load(f)
        return exercises, nutrition
    except Exception as e:
        print(f"Error loading data: {e}")
        return {'exercises': []}, {'tiers': {}}

exercises_data, nutrition_data = load_json_data()

def handler(event, context):
    try:
        # Parse the request
        method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        body = event.get('body', '')
        
        # Remove /api prefix and leading slash
        api_path = path.replace('/.netlify/functions/api', '').lstrip('/')
        
        # Parse body if present
        data = {}
        if body:
            try:
                data = json.loads(body)
            except:
                pass
        
        # Route the request
        if method == 'POST' and api_path == 'profile':
            return create_profile(data)
        elif method == 'GET' and api_path.startswith('profile/'):
            user_id = api_path.split('/')[-1]
            return get_profile(user_id)
        elif method == 'GET' and api_path.startswith('workout/'):
            user_id = api_path.split('/')[-1]
            return get_workout(user_id)
        elif method == 'GET' and api_path.startswith('nutrition/'):
            user_id = api_path.split('/')[-1]
            return get_nutrition(user_id)
        elif method == 'POST' and api_path == 'workout/complete':
            return complete_exercise(data)
        else:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': False, 'error': 'Endpoint not found'})
            }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': False, 'error': str(e)})
        }

def create_profile(data):
    try:
        # Basic validation
        required = ['firstName', 'lastName', 'age', 'height', 'weight', 'gender']
        for field in required:
            if not data.get(field):
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'success': False, 'error': f'Missing {field}'})
                }
        
        user_id = data.get('user_id', f"user_{int(datetime.now().timestamp())}")
        
        # Calculate BMI and BMR
        height_m = float(data['height']) / 100
        weight = float(data['weight'])
        age = float(data['age'])
        
        bmi = round(weight / (height_m ** 2), 1)
        
        if data['gender'] == 'male':
            bmr = 88.362 + (13.397 * weight) + (4.799 * float(data['height'])) - (5.677 * age)
        else:
            bmr = 447.593 + (9.247 * weight) + (3.098 * float(data['height'])) - (4.330 * age)
        
        bmr = round(bmr, 0)
        
        # Store user data
        data['user_id'] = user_id
        data['bmi'] = bmi
        data['bmr'] = bmr
        data['created_at'] = datetime.now().isoformat()
        
        users[user_id] = data
        
        # Initialize workout progress
        workouts[user_id] = {
            'current_day': 1,
            'completed_days': [],
            'start_date': datetime.now().isoformat(),
            'total_calories_burned': 0,
            'streak': 0
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'user_id': user_id,
                'bmi': bmi,
                'bmr': bmr
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': False, 'error': str(e)})
        }

def get_profile(user_id):
    try:
        if user_id in users:
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True, 'data': users[user_id]})
            }
        else:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': False, 'error': 'User not found'})
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': False, 'error': str(e)})
        }

def get_workout(user_id):
    try:
        # Create demo user if not exists
        if user_id not in users:
            users[user_id] = {
                'user_id': user_id,
                'firstName': 'مستخدم',
                'lastName': 'تجريبي',
                'age': 25,
                'height': 170,
                'weight': 70,
                'gender': 'male',
                'fitnessLevel': 'beginner',
                'goal': 'health',
                'bmi': 24.2,
                'bmr': 1700
            }
            workouts[user_id] = {
                'current_day': 1,
                'completed_days': [],
                'start_date': datetime.now().isoformat(),
                'total_calories_burned': 0,
                'streak': 0
            }
        
        user = users[user_id]
        progress = workouts.get(user_id, {'current_day': 1, 'completed_days': [], 'total_calories_burned': 0, 'streak': 0})
        
        # Filter exercises based on user preferences
        filtered_exercises = []
        for exercise in exercises_data.get('exercises', []):
            if (exercise.get('level') == user.get('fitnessLevel', 'beginner') and
                exercise.get('gender') in [user.get('gender', 'male'), 'both']):
                filtered_exercises.append(exercise)
        
        # Limit to 14 exercises for day 1
        workout_exercises = filtered_exercises[:14]
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'exercises': workout_exercises,
                'current_day': progress['current_day'],
                'total_exercises': len(workout_exercises),
                'progress': progress
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': False, 'error': str(e)})
        }

def get_nutrition(user_id):
    try:
        # Create demo user if not exists
        if user_id not in users:
            users[user_id] = {
                'user_id': user_id,
                'economicLevel': 'medium',
                'goal': 'health',
                'bmr': 1700
            }
        
        user = users[user_id]
        economic_level = user.get('economicLevel', 'medium')
        goal = user.get('goal', 'health')
        bmr = user.get('bmr', 2000)
        
        # Calculate daily calories
        multipliers = {
            'weightLoss': 0.8,
            'muscleGain': 1.3,
            'endurance': 1.4,
            'toning': 1.1,
            'health': 1.2
        }
        
        daily_calories = int(bmr * multipliers.get(goal, 1.2))
        
        # Get nutrition plan
        nutrition_plan = nutrition_data.get('tiers', {}).get(economic_level, {})
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'plan': nutrition_plan,
                'daily_calories': daily_calories,
                'economic_level': economic_level
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': False, 'error': str(e)})
        }

def complete_exercise(data):
    try:
        user_id = data.get('user_id')
        exercise_id = data.get('exercise_id')
        duration = data.get('duration', 0)
        
        if user_id not in users:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': False, 'error': 'User not found'})
            }
        
        # Calculate calories (simple estimation)
        calories_burned = round(duration * 0.1, 1)
        
        # Update progress
        if user_id in workouts:
            workouts[user_id]['total_calories_burned'] += calories_burned
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'calories_burned': calories_burned,
                'total_calories': workouts.get(user_id, {}).get('total_calories_burned', 0)
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': False, 'error': str(e)})
        }