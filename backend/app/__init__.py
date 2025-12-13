from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os

# Initialize Flask app
chat_app = Flask(__name__)
CORS(chat_app)

# Configuration
chat_app.config['SECRET_KEY'] = 'your-secret-key-change-this-in-production'
chat_app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///chatbot.db'
chat_app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db = SQLAlchemy(chat_app)

# Import and register blueprints
from app.routes.upload import upload_bp
from app.routes.auth import auth_bp

chat_app.register_blueprint(upload_bp)
chat_app.register_blueprint(auth_bp)

# Create database tables
with chat_app.app_context():
    db.create_all()
