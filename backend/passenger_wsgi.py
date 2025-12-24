import os
import sys

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(__file__))

# Import the Flask app
from app import app

# Expose the application object for Passenger
application = app
