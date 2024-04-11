const proxyChain = require("proxy-chain");
const puppeteer = require("puppeteer-extra");
const fs = require("fs");
const {proxiesList} = require("./ProxiesService");


module.exports = async (keyword, proxy, username, password, lat_long) => {

    let browser = null
    console.log(".................")
    try {

        let launchOptions = {
            headless: false, // Run browser in headless mode (no UI)
        };

        if (proxy) {
            const newProxyUrl = proxy;
            console.log("========> proxy: " + newProxyUrl);
            launchOptions.args = [`--proxy-server=${newProxyUrl}`];
        }

        // Launch the browser with specified options
        browser = await puppeteer.launch(launchOptions);

        // Create a new page in the browser
        const page = await browser.newPage();
        if (proxy) {
            await page.authenticate({
                username: username,
                password: password,
            });
        }
        let url = `https://www.google.com/maps/search/${keyword}/`

        if (lat_long != null) {
            url = `https://www.google.com/maps/search/${keyword}/@${lat_long.lat},${lat_long.long},14z?entry=ttu`
        }

        // Navigate to Google Maps and search for the keyword
        // await page.goto(`https://www.google.com/maps/search/${keyword}/@21.031569,105.789468,14z?entry=ttu`);
        await page.goto(url);

        // Try to find and click the accept cookies button, if it appears
        try {
            const acceptCookiesSelector = "form:nth-child(2)";
            await page.waitForSelector(acceptCookiesSelector, {timeout: 5000});
            await page.click(acceptCookiesSelector);
        } catch (error) {
            // If the selector is not found or times out, catch the error and continue
        }

        // Scroll through the search results on Google Maps to load all items
        await page.evaluate(async () => {
            const searchResultsSelector = 'div[role="feed"]';
            const wrapper = document.querySelector(searchResultsSelector);

            await new Promise((resolve, reject) => {
                var totalHeight = 0;
                var distance = 1000; // How much to scroll each time
                var scrollDelay = 3000; // Wait time between scrolls

                var timer = setInterval(async () => {
                    var scrollHeightBefore = wrapper.scrollHeight;
                    wrapper.scrollBy(0, distance);
                    totalHeight += distance;

                    // If we've scrolled to the bottom, wait, then check if more content loaded
                    if (totalHeight >= scrollHeightBefore) {
                        totalHeight = 0;
                        await new Promise((resolve) => setTimeout(resolve, scrollDelay));

                        var scrollHeightAfter = wrapper.scrollHeight;

                        // If no new content, stop scrolling and finish
                        if (scrollHeightAfter > scrollHeightBefore) {
                            return;
                        } else {
                            clearInterval(timer);
                            resolve();
                        }
                    }
                }, 200); // Interval time between each scroll
            });
        });

        // Extract data from the loaded search results
        const results = await page.evaluate(() => {
            const items = Array.from(
                document.querySelectorAll('div[role="feed"] > div > div[jsaction]')
            );

            return items.map((item) => {
                let data = {};

                // Extract the title, link, and website from each search result, handling errors gracefully
                try {
                    data.title = item.querySelector(".fontHeadlineSmall").textContent;
                } catch (error) {
                }

                try {
                    data.link = item.querySelector("a").getAttribute("href");
                } catch (error) {
                }

                try {
                    data.website = item
                        .querySelector('[data-value="Website"]')
                        .getAttribute("href");
                } catch (error) {
                }

                // Extract the rating and number of reviews
                try {
                    const ratingText = item
                        .querySelector('.fontBodyMedium > span[role="img"]')
                        .getAttribute("aria-label")
                        .split(" ")
                        .map((x) => x.replace(",", "."))
                        .map(parseFloat)
                        .filter((x) => !isNaN(x));

                    data.stars = ratingText[0];
                    data.reviews = ratingText[1];
                } catch (error) {
                }

                // Extract phone numbers from the text, using regex to match formats
                try {
                    const textContent = item.innerText;
                    const phoneRegex =
                        /((\+?\d{1,2}[ -]?)?(\(?\d{3}\)?[ -]?\d{3,4}[ -]?\d{4}|\(?\d{2,3}\)?[ -]?\d{2,3}[ -]?\d{2,3}[ -]?\d{2,3}))/g;

                    const matches = [...textContent.matchAll(phoneRegex)];
                    let phoneNumbers = matches
                        .map((match) => match[0])
                        .filter((phone) => (phone.match(/\d/g) || []).length >= 10);

                    let phoneNumber = phoneNumbers.length > 0 ? phoneNumbers[0] : null;
                    if (phoneNumber) {
                        phoneNumber = phoneNumber.replace(/[ -]/g, "");
                    }

                    data.phone = phoneNumber;
                } catch (error) {
                }

                return data; // Return the extracted data for each item
            });
        });

        // Filter out results without titles and write them to a file
        const filteredResults = results.filter((result) => result.title);
        // Generate a timestamp for the filename
        const timestamp = new Date().toISOString().replace(/:/g, '-'); // Use ISO format without colons

        // Create the filename with the timestamp
        const filename = `results_${timestamp}.json`;
        fs.writeFileSync(filename, JSON.stringify(filteredResults, null, 2)); // Save the results to a JSON file

        console.log("Completed"); // Log completion message

        await browser.close(); // Close the browser
    } catch (e) {
        console.error("=============> Error:" + e.message); // Log the error message
        await browser.close(); // Close the browser

        throw e
    }

    console.log("end")

};
