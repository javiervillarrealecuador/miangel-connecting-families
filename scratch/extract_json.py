
import json
import re

log_path = r'C:\Users\LENOVO\搬.gemini\antigravity\brain\c46dd3a3-1ca6-4f63-818e-9ec509fd1dd6\.system_generated\logs\overview.txt'
# Fixing the path (removing the non-ascii char if it was a copy-paste error in my thought, but the user path was correct)
log_path = r'C:\Users\LENOVO\.gemini\antigravity\brain\c46dd3a3-1ca6-4f63-818e-9ec509fd1dd6\.system_generated\logs\overview.txt'

try:
    with open(log_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        last_line = lines[-1]
        data = json.loads(last_line)
        content = data['content']
        print(f"Content length: {len(content)}")
        print(f"Content start: {content[:100]}")
        print(f"Content end: {content[-100:]}")
        # Extract json block
        match = re.search(r'```json\s+(.*?)\s+```', content, re.DOTALL)
        if match:
            print(match.group(1))
        else:
            print("No JSON found")
except Exception as e:
    print(f"Error: {e}")
