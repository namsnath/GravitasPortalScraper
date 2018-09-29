from selenium.webdriver import Chrome
#from selenium.webdriver import Firefox
from selenium.webdriver.chrome.options import Options
#from selenium.webdriver.firefox.options import Options
from selenium.webdriver.support.select import Select
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
import json
import sys
from bs4 import BeautifulSoup
import re

def read():
	lines = sys.stdin.readlines()
	return json.loads(lines[0])

def scrapeRegs(src, EVENT):
	col_headings = ['srno', 'pid', 'name', 'type', 'status', 'phno', 'email', 'event']
	soup = BeautifulSoup(src, 'html.parser')
	table = soup.find_all('table')[0]
	table_body = table.find('tbody')
	rows = table.find_all('tr')
	data = []

	rcount = 0
	for row in rows:
		rcount += 1
		if rcount == 1:
			continue;
			 
		#row_data = []
		row_data = {}
		cols = row.findAll('td')
		cols = [ele.text.strip() for ele in cols]
		
		for i in range(1, len(cols)):
			row_data[col_headings[i]] = cols[i]

		#for ele in cols:
			#row_data.append(ele)
		#row_data.append(EVENT)
		row_data['event'] = EVENT
		data.append(row_data)  
	#print(data)
	regcount = 0
	pendingcount = 0
	for i in data:
		#if i[4] == 'Success':
		if i['status'] == 'Success':
			regcount += 1
		else:
			pendingcount += 1
	#print('Success: ', regcount)
	#print('Pending: ', pendingcount)

	print({'data': data, 'success': regcount, 'pending': pendingcount})


def main():
	lines = read()
	USERNAME = lines[0]
	PASSWORD = lines[1]
	EVENT = lines[2]

	opts = Options()
	#opts.add_argument('--no-sandbox')
	#opts.add_argument('--disable-dev-shm-usage')
	opts.add_argument('--log-level=3')
	#opts.add_argument('--headless')
	opts.add_argument('--disable-gpu')
	
	browser = Chrome(options=opts)
	browser.get('http://info.vit.ac.in/gravitas18/gravitas/gravitas_coordinator_login.asp')
	wait = WebDriverWait(browser, 100)

	src = browser.page_source

	myElem = wait.until(EC.visibility_of_element_located((By.ID, 'loginid')))

	loginfield = browser.find_element_by_id('loginid')
	loginfield.send_keys(USERNAME)

	pwfield = browser.find_element_by_id('logpassword')
	pwfield.send_keys(PASSWORD)

	soup = BeautifulSoup(src, 'html.parser')
	captcha = soup.find_all("input", type='hidden')

	captcha = str(captcha[0])
	captcha = captcha[-9:-3]
	#print(captcha)

	cfield = browser.find_element_by_id('captchacode')
	cfield.send_keys(captcha)

	loginbtn = browser.find_element_by_name('frmSubmit')
	loginbtn.click()

	#print("waiting for page load")
	#myElem = wait.until(EC.presence_of_element_located((By.CLASS_NAME, 'glyphicon glyphicon-menu-down')))
	browser.get('http://info.vit.ac.in/gravitas18/gravitas/coord_event_participants.asp')
	#http://info.vit.ac.in/gravitas18/gravitas/coord_event_participants.asp
	#http://info.vit.ac.in/gravitas18/gravitas/coord_event_participant_list.asp
	myElem = wait.until(EC.visibility_of_element_located((By.NAME, 'form1')))

	viewbtn = browser.find_element_by_name('form1')
	viewbtn.click()

	src = browser.page_source

	scrapeRegs(src, EVENT)
	browser.quit()

if __name__ == '__main__':
	main()