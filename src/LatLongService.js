const proxyChain = require("proxy-chain");
require('dotenv').config();
const puppeteer = require("puppeteer-extra");
const fs = require("fs");
const {proxiesList} = require("./ProxiesService");




class LatLongService {


    async getLongLat(keyword,proxy) {
        let browser = null;
        let latValue
        let longValue
        // result: [{long: ?,lat: ?},{}]
        let result =[]


        try {
            console.log("Launching browser...");


            // Launch the browser with specified options
            browser = await puppeteer.launch({
                headless: false, // Run browser in headless mode (no UI)
                // args: [`--proxy-server=${newProxyUrl}`], // Use the anonymized proxy
            });

            const page = await browser.newPage();
            console.log("Navigating to the URL: https://www.latlong.net/user/login");
            await page.goto("https://www.latlong.net/user/login");

            // Wait for the login form to be available
            await page.waitForSelector('#frmPlace');
            await new Promise(resolve => setTimeout(resolve, 1000)); // Delay 1 second

            // Fill in the email and password fields
            await page.type('#email', process.env.email);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Delay 1 second

            await page.type('#password1', process.env.password);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Delay 1 second

            // Click the login button
            await page.click('button[title="Login"]');

            console.log("Logged in successfully.");
            //redirect to main page
            await page.click('a[title="Lat Long Finder"].logolink'); // Click on the <a> tag to redirect to the home page
            // await page.waitForNavigation(); // Wait for navigation to complete after clicking the link

            await new Promise(resolve => setTimeout(resolve, 9000)); // Delay 1 second


            //
            for (let k in keyword){
                // Wait for the form and input field to be available
                await page.waitForSelector('#frmPlace');
                await page.waitForSelector('#place');

                // Fill out the input field
                await page.type('#place', `${keyword[k]}`);

                // Click the submit button
                await page.click('#btnfind');

                // Wait for the results
                await page.waitForSelector('#loading', {hidden: true});

                // Read the value from the "lat" input field
                 latValue = await page.$eval('#lat', input => input.value);
                console.log("Latitude coordinate:", latValue);
                 longValue = await page.$eval('#lng', input => input.value);
                console.log("Longitude coordinate:", longValue);
                // Clear the input field
                await page.$eval('#place', input => input.value = '');

                result=[...result,{lat:latValue,long:longValue}]
                await new Promise(resolve => setTimeout(resolve, 4000)); // Delay 4 second

            }


        } catch (error) {
            console.error("Error occurred during login:", error);
        } finally {
            if (browser !== null) {
                // await new Promise(resolve => setTimeout(resolve, 3000)); // Delay 1 second

                await browser.close();
                console.log("Browser closed.");
            }
        }

        return result
    }



}

module.exports= LatLongService