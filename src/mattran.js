const puppeteer = require("puppeteer-extra");
const proxyChain = require('proxy-chain');
const proxypage = require('puppeteer-page-proxy');


class Mattran {

    async access(keyword, proxy, username, password) {
        let browser = null;

        try {
            console.log("Launching browser...");
            console.log("========> proxy: " + proxy); // Print the new anonymized proxy URL

            // Launch the browser with specified options
            browser = await puppeteer.launch({
                headless: false, // Run browser in headless mode (no UI)
                args: [
                    `--proxy-server=${proxy}`
                ]
            });

            const page = await browser.newPage();
            // Set the proxy credentials
            await page.authenticate({
                username: username,
                password: password,
            });
            console.log("Navigating to the URL: http://mattran.org.vn/hoat-dong-mat-tran-dia-phuong/");
            await page.goto("https://www.google.com/maps/search/thi%E1%BA%BFt+k%E1%BA%BF/@21.0199905,105.7908576,13z/data=!3m1!4b1?entry=ttu");

            await new Promise(resolve => setTimeout(resolve, 2000)); // Delay 4 second


        } catch (error) {
            console.error("Error occurred during login:", error);
        } finally {
            if (browser !== null) {
                await new Promise(resolve => setTimeout(resolve, 10000)); // Delay 1 second

                // await browser.close();
                console.log("Browser closed.");
            }
        }
    }

}


module.exports = Mattran