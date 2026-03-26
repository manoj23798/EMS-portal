const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        
        let errorFound = false;

        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('CONSOLE ERROR:', msg.text());
                errorFound = true;
            }
        });

        page.on('pageerror', error => {
            console.log('PAGE ERROR:', error.message);
            errorFound = true;
        });

        await page.goto('http://localhost:5173/reimbursement/apply');
        
        // Wait 2 seconds to let React crash if it's going to
        await new Promise(r => setTimeout(r, 2000));
        
        if (!errorFound) {
            console.log("No React Error caught! It might be a credential redirect. Trying login...");
            
            await page.goto('http://localhost:5173/login');
            await page.waitForSelector('input[type="email"]');
            await page.type('input[type="email"]', 'hr@elintsys.com');
            await page.type('input[type="password"]', 'admin123');
            await page.click('button[type="submit"]');
            
            await new Promise(r => setTimeout(r, 2000));
            await page.goto('http://localhost:5173/reimbursement/apply');
            await new Promise(r => setTimeout(r, 3000));
        }

        await browser.close();
    } catch (e) {
        console.error("Puppeteer Script Error:", e);
    }
})();
