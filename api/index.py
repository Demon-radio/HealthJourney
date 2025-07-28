from http.server import BaseHTTPRequestHandler
import json
import urllib.parse
from datetime import datetime

# In-memory storage for user data
users_data = {}
workout_progress = {}

# Simple exercise data
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
                "male": ["Start in plank position", "Lower to chest", "Push up"],
                "female": ["Modified position available", "Lower to chest", "Push up"]
            }
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
                "male": ["Stand with feet apart", "Lower down", "Stand up"],
                "female": ["Hip-width stance", "Keep chest up", "Push through heels"]
            }
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
            }
        }
    ]
}

nutrition_data = {
    "tiers": {
        "basic": {
            "name": "Basic Plan",
            "meals": {
                "breakfast": [{"name": "Oatmeal", "calories": 350}],
                "lunch": [{"name": "Chicken Rice", "calories": 450}],
                "dinner": [{"name": "Fish & Vegetables", "calories": 400}]
            }
        },
        "medium": {
            "name": "Medium Plan", 
            "meals": {
                "breakfast": [{"name": "Avocado Toast", "calories": 420}],
                "lunch": [{"name": "Quinoa Bowl", "calories": 520}],
                "dinner": [{"name": "Salmon & Potato", "calories": 550}]
            }
        },
        "premium": {
            "name": "Premium Plan",
            "meals": {
                "breakfast": [{"name": "Acai Bowl", "calories": 480}],
                "lunch": [{"name": "Steak Salad", "calories": 580}],
                "dinner": [{"name": "Lobster & Quinoa", "calories": 620}]
            }
        }
    }
}

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        path = self.path
        
        if path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            html = '''<!DOCTYPE html>
<html>
<head>
    <title>Training Club</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <h1>Training Club - Fitness Application</h1>
    <p>Welcome to your personalized fitness journey!</p>
    <div>
        <a href="/profile.html">Create Profile</a> |
        <a href="/plan.html">View Plan</a>
    </div>
</body>
</html>'''
            self.wfile.write(html.encode())
            return
            
        elif path.startswith('/api/workout/'):
            user_id = path.split('/')[-1]
            
            if user_id not in users_data:
                demo_profile = {
                    'user_id': user_id,
                    'goal': 'weightLoss',
                    'fitnessLevel': 'beginner',
                    'gender': 'male'
                }
                users_data[user_id] = demo_profile
                workout_progress[user_id] = {'current_day': 1, 'completed_days': []}
            
            response = {
                'success': True,
                'exercises': exercises_data['exercises'][:3],
                'current_day': 1,
                'total_exercises': 3
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            return
            
        elif path.startswith('/api/nutrition/'):
            user_id = path.split('/')[-1]
            
            if user_id not in users_data:
                demo_profile = {
                    'user_id': user_id,
                    'economicLevel': 'medium',
                    'goal': 'weightLoss',
                    'bmr': 1700
                }
                users_data[user_id] = demo_profile
            
            response = {
                'success': True,
                'plan': nutrition_data['tiers']['medium'],
                'daily_calories': 1700,
                'economic_level': 'medium'
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            return
        
        # Serve static files
        elif path.endswith('.html') or path.endswith('.css') or path.endswith('.js'):
            try:
                file_path = path.lstrip('/')
                with open(file_path, 'rb') as f:
                    content = f.read()
                
                if path.endswith('.css'):
                    content_type = 'text/css'
                elif path.endswith('.js'):
                    content_type = 'application/javascript'
                else:
                    content_type = 'text/html'
                
                self.send_response(200)
                self.send_header('Content-type', content_type)
                self.end_headers()
                self.wfile.write(content)
                return
            except:
                pass
        
        # 404 for everything else
        self.send_response(404)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(b'Not Found')
    
    def do_POST(self):
        if self.path == '/api/profile':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode())
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
                
                response = {'success': True, 'user_id': user_id, 'bmi': data['bmi'], 'bmr': data['bmr']}
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(response).encode())
                
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()