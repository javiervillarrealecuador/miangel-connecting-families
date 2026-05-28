
import json
import re

log_path = r'C:\Users\LENOVO\.gemini\antigravity\brain\c46dd3a3-1ca6-4f63-818e-9ec509fd1dd6\.system_generated\logs\overview.txt'

try:
    with open(log_path, 'r', encoding='utf-8') as f:
        # Read the file line by line to find the last step 108
        target_content = None
        for line in f:
            try:
                data = json.loads(line)
                if data.get('step_index') == 108:
                    target_content = data.get('content')
            except:
                continue
        
        if target_content:
            # Look for the JSON block
            # The JSON might be split across multiple ``` blocks if it was very long, but usually it's one.
            match = re.search(r'```json\n(.*?)\n```', target_content, re.DOTALL)
            if match:
                with open('scratch/n8n_flow.json', 'w', encoding='utf-8') as out:
                    out.write(match.group(1))
                print("JSON extracted to scratch/n8n_flow.json")
            else:
                # If it's truncated in the log too...
                if "<truncated" in target_content:
                    print("ERROR: The log itself is truncated.")
                else:
                    print("No JSON block found in content.")
        else:
            print("Step 108 not found.")
except Exception as e:
    print(f"Error: {e}")
