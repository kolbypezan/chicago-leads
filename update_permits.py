import pandas as pd
from sodapy import Socrata

# Connect to Chicago Data Portal
client = Socrata("data.cityofchicago.org", None)

# Fetch only the most recent 20,000 permits to keep the site fast
results = client.get("ydr8-5enu", limit=20000, order="issue_date DESC")

# Convert to DataFrame
df = pd.DataFrame.from_records(results)

# Save directly into the public folder
df.to_csv("public/chicago_permits.csv", index=False)
print("Data Updated Successfully.")