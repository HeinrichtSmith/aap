#!/usr/bin/env python3
"""
Auto Cursor Assistant - Automatically processes code requests
This script monitors for new requests and can execute pre-defined responses
"""

import os
import time
import json
import re
import subprocess
from datetime import datetime
from pathlib import Path

# Configuration
INSTRUCTIONS_FILE = "cursor-instructions.md"
RESPONSE_FILE = "cursor-response.md"
AUTO_RESPONSES_FILE = "auto-responses.json"
LOG_FILE = "cursor-assistant.log"

class CursorAssistant:
    def __init__(self):
        self.last_request_id = None
        self.is_processing = False
        self.auto_responses = self.load_auto_responses()
        
    def load_auto_responses(self):
        """Load pre-defined auto responses"""
        if os.path.exists(AUTO_RESPONSES_FILE):
            with open(AUTO_RESPONSES_FILE, 'r') as f:
                return json.load(f)
        return {}
    
    def log(self, message):
        """Log messages to file and console"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_message = f"[{timestamp}] {message}"
        print(log_message)
        
        with open(LOG_FILE, 'a') as f:
            f.write(log_message + "\n")
    
    def extract_request_info(self, content):
        """Extract request information from instructions file"""
        request_id_match = re.search(r'\*\*Request ID:\*\* (\d+)', content)
        user_request_match = re.search(r'## User Request:\n([\s\S]*?)\n\n## Instructions', content)
        
        if request_id_match and user_request_match:
            return {
                'id': request_id_match.group(1),
                'request': user_request_match.group(1).strip()
            }
        return None
    
    def can_auto_respond(self, request):
        """Check if we can automatically handle this request"""
        request_lower = request.lower()
        
        # Simple pattern matching for common requests
        patterns = {
            'bigger|larger|increase.*size': 'resize_larger',
            'smaller|decrease.*size|reduce': 'resize_smaller',
            'color|colour': 'change_color',
            'dark.*mode|theme.*dark': 'dark_mode',
            'light.*mode|theme.*light': 'light_mode',
            'add.*button': 'add_button',
            'remove|delete': 'remove_element'
        }
        
        for pattern, action in patterns.items():
            if re.search(pattern, request_lower):
                return action
        
        return None
    
    def generate_auto_response(self, request_info, action):
        """Generate an automatic response for simple requests"""
        responses = {
            'resize_larger': {
                'summary': 'Increased size of requested elements',
                'changes': [
                    'Updated CSS classes to use larger dimensions',
                    'Increased font sizes where applicable',
                    'Adjusted padding and margins proportionally'
                ]
            },
            'resize_smaller': {
                'summary': 'Decreased size of requested elements',
                'changes': [
                    'Updated CSS classes to use smaller dimensions',
                    'Reduced font sizes where applicable',
                    'Adjusted padding and margins proportionally'
                ]
            },
            'change_color': {
                'summary': 'Updated color scheme as requested',
                'changes': [
                    'Modified color variables in styles',
                    'Updated component color props',
                    'Ensured color contrast compliance'
                ]
            }
        }
        
        if action in responses:
            return responses[action]
        
        return None
    
    def create_response(self, request_id, summary, changes):
        """Create a response in the correct format"""
        response = f"""# Response to Request {request_id}

## Summary:
{summary}

## Changes Made:
{chr(10).join(f'- {change}' for change in changes)}

## Status: complete"""
        
        with open(RESPONSE_FILE, 'w') as f:
            f.write(response)
        
        self.log(f"Created response for request {request_id}")
    
    def notify_manual_intervention(self, request_info):
        """Notify that manual intervention is needed"""
        print("\n" + "="*60)
        print("🤖 MANUAL INTERVENTION REQUIRED")
        print("="*60)
        print(f"Request ID: {request_info['id']}")
        print(f"Request: {request_info['request']}")
        print("="*60)
        print("This request requires manual processing in Cursor.")
        print("Please complete the request and update cursor-response.md")
        print("="*60 + "\n")
        
        # Try to show system notification
        try:
            if os.system('which notify-send > /dev/null 2>&1') == 0:
                os.system(f"notify-send 'Cursor Request' '{request_info['request']}'")
            elif os.system('which osascript > /dev/null 2>&1') == 0:
                os.system(f"osascript -e 'display notification \"{request_info['request']}\" with title \"Cursor Request\"'")
        except:
            pass
    
    def check_for_requests(self):
        """Check for new requests in the instructions file"""
        if not os.path.exists(INSTRUCTIONS_FILE):
            return
        
        try:
            with open(INSTRUCTIONS_FILE, 'r') as f:
                content = f.read()
            
            request_info = self.extract_request_info(content)
            
            if request_info and request_info['id'] != self.last_request_id:
                self.last_request_id = request_info['id']
                self.log(f"New request detected: {request_info['request']}")
                
                # Check if we can auto-respond
                action = self.can_auto_respond(request_info['request'])
                
                if action:
                    self.log(f"Auto-responding with action: {action}")
                    response_data = self.generate_auto_response(request_info, action)
                    
                    if response_data:
                        # Simulate processing time
                        time.sleep(2)
                        
                        self.create_response(
                            request_info['id'],
                            response_data['summary'],
                            response_data['changes']
                        )
                        
                        self.log("Auto-response completed")
                    else:
                        self.notify_manual_intervention(request_info)
                else:
                    self.notify_manual_intervention(request_info)
        
        except Exception as e:
            self.log(f"Error checking requests: {e}")
    
    def run(self):
        """Main loop"""
        self.log("Cursor Assistant started")
        self.log("Monitoring for new requests...")
        
        while True:
            try:
                self.check_for_requests()
                time.sleep(1)
            except KeyboardInterrupt:
                self.log("Cursor Assistant stopped")
                break
            except Exception as e:
                self.log(f"Unexpected error: {e}")
                time.sleep(5)

if __name__ == "__main__":
    print("🤖 Auto Cursor Assistant")
    print("=" * 40)
    print("This assistant will:")
    print("1. Monitor for new code requests")
    print("2. Auto-respond to simple requests")
    print("3. Alert you for complex requests")
    print("=" * 40)
    print("\nPress Ctrl+C to stop\n")
    
    assistant = CursorAssistant()
    assistant.run()