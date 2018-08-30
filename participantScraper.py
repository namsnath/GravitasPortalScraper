from os import path
import json
import sys
from bs4 import BeautifulSoup
import re

file_path = path.relpath("participant.html")
file = open(file_path)

col_headings = ['srno', 'PID', 'name', 'type', 'status', 'ph_no', 'email']
soup = BeautifulSoup(file, 'html.parser')
table = soup.find_all('table')[0]
table_body = table.find('tbody')
rows = table.find_all('tr')
data = []
for row in rows: 
	row_data = []
	cols = row.findAll('td')
	cols = [ele.text.strip() for ele in cols]    
	for ele in cols:
		row_data.append(ele)
	data.append(row_data)  # Get rid of empty values
print(data)
regcount = 0
pendingcount = 0
for i in data:
	if i[4] == 'Success':
		regcount += 1
	else:
		pendingcount += 1
print('Success: ', regcount)
print('Pending: ', pendingcount)