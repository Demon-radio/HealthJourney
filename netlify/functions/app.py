from flask import Flask, request, jsonify, send_from_directory
import json
from datetime import datetime

app = Flask(__name__)

# In-memory storage for user data
users_data = {}
workout_progress = {}

# Load exercise and nutrition data
def load_data():
    try:
        # Use relative paths for Netlify functions
        import os
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        
        exercises_path = os.path.join(base_dir, 'data', 'exercises.json')
        nutrition_path = os.path.join(base_dir, 'data', 'nutrition.json')
        
        with open(exercises_path, 'r') as f:
            exercises = json.load(f)
        with open(nutrition_path, 'r') as f:
            nutrition = json.load(f)
        return exercises, nutrition
    except:
        # Fallback data for Netlify
        return {
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
                        "male": ["Start in plank position", "Lower to chest", "Push up"],
                        "female": ["Modified position available", "Lower to chest", "Push up"]
                    }
                }
            ]
        }, {
            "tiers": {
                "medium": {
                    "name": "Medium Plan",
                    "meals": {
                        "breakfast": [{"name": "Healthy Breakfast", "calories": 400}],
                        "lunch": [{"name": "Balanced Lunch", "calories": 500}],
                        "dinner": [{"name": "Nutritious Dinner", "calories": 600}]
                    }
                }
            }
        }

exercises_data, nutrition_data = load_data()

@app.route('/')
def index():
    return '''<!DOCTYPE html>
<html>
<head><title>Training Club</title></head>
<body><h1>Training Club - Fitness Application</h1></body>
</html>'''

@app.route('/api/profile', methods=['POST'])
def save_profile():
    try:
        data = request.get_json()
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
        
        return jsonify({'success': True, 'user_id': user_id, 'bmi': data['bmi'], 'bmr': data['bmr']})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/workout/<user_id>', methods=['GET'])
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
        
        return jsonify({
            'success': True,
            'exercises': exercises_data.get('exercises', [])[:5],
            'current_day': 1,
            'total_exercises': 5
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/nutrition/<user_id>', methods=['GET'])
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
        
        return jsonify({
            'success': True,
            'plan': nutrition_data.get('tiers', {}).get('medium', {}),
            'daily_calories': 1700,
            'economic_level': 'medium'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

def handler(event, context):
    """Netlify function handler"""
    with app.test_request_context(event['path'], method=event['httpMethod'], data=event.get('body', '')):
        try:
            response = app.dispatch_request()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json' if event['path'].startswith('/api/') else 'text/html'},
                'body': response.get_data(as_text=True)
            }
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': str(e)})
            }