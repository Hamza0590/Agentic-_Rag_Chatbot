from flask import Blueprint, request, jsonify, session
from app import db
from app.models import User
import uuid
from app.routes.upload import pc
auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing email or password'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    if not user or user.password != data['password']:
        return jsonify({'error': 'Invalid email or password'}), 400
    
    session['user_id'] = user.id
    session['email'] = user.email
    return jsonify({'message': 'Login successful',
                    'user_id': user.id}),200



@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing username, email, or password'}), 400
    existing_user = User.query.filter_by(email=data['email']).first()
    if existing_user:
        return jsonify({'error': 'User already exists'}), 400
    
    user = User(username=data['username'], email=data['email'], password=data['password'])
    db.session.add(user)
    db.session.commit()
    session['user_id'] = user.id
    return jsonify({'message': 'Register successful',
                    'user_id': user.id}), 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    user_email = request.get_json().get('email')
    print('logout called', user_email)
    if user_email:
        try:
            print('\n Deleting user vectors')
            index = pc.Index("books-index")
            index.delete(filter={"session_id": user_email})
        except Exception as e:
            print(f"Error deleting user vectors: {e}")
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200