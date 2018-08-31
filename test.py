from selenium.webdriver import Chrome
from selenium.webdriver.chrome.options import Options

opts = Options()
opts.add_argument('log-level=3')
opts.add_argument('--headless')
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
print(captcha)

browser.quit()