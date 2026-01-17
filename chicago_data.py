import requests
import pandas as pd
import time

def get_all_chicago_permits():
    # The endpoint shown in your screenshot
    url = "https://data.cityofchicago.org/resource/ydr8-5enu.json"
    
    all_data = []
    limit = 5000  # Pull 5,000 rows per "page"
    offset = 0
    
    print("Connecting to Chicago Data Portal...")
    
    while True:
        # Paging parameters
        params = {
            "$limit": limit,
            "$offset": offset,
            "$order": "issue_date DESC" # Ensures you get newest data first
        }
        
        response = requests.get(url, params=params)
        data = response.json()
        
        # If the API returns an empty list, it means we reached the end
        if not data:
            break
            
        all_data.extend(data)
        offset += limit
        print(f"Downloaded {offset} rows total...")
        
        # Short pause to stay within their "fair use" limits
        time.sleep(0.1) 
        
        # Optional: stop early for testing (e.g., at 20,000 rows)
        if offset >= 20000:
            break

    # Save to a CSV file for your dashboard
    df = pd.DataFrame(all_data)
    df.to_csv("chicago_permits.csv", index=False)
    print("Success! File saved: chicago_permits.csv")

if __name__ == "__main__":
    get_all_chicago_permits()