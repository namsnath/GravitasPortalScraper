from selenium.webdriver import Chrome
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.select import Select
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
import json
import sys
from bs4 import BeautifulSoup
import re

print('Starting Script')
opts = Options()
opts.add_argument('log-level=3')
opts.add_argument('--no-sandbox')
opts.add_argument('--headless')
opts.add_argument('--disable-gpu') 
browser = Chrome(options=opts)
print('Browser running, getting page')


browser.get('http://info.vit.ac.in/gravitas18/gravitas/gravitas_coordinator_login.asp')
wait = WebDriverWait(browser, 10)

src = browser.page_source
print(src)

myElem = wait.until(EC.visibility_of_element_located((By.ID, 'loginid')))

loginfield = browser.find_element_by_id('loginid')
#loginfield.send_keys(USERNAME)

pwfield = browser.find_element_by_id('logpassword')
#pwfield.send_keys(PASSWORD)

soup = BeautifulSoup(src, 'html.parser')
captcha = soup.find_all("input", type='hidden')

captcha = str(captcha[0])
captcha = captcha[-9:-3]
print(captcha)

browser.quit()