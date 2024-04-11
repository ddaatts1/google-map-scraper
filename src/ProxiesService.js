const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const { promisify } = require('util');
const request = require('request')
const writeFileAsync = promisify(fs.writeFile);
const Agent = require('socks5-http-client/lib/Agent');
const SocksProxyAgent = require('socks-proxy-agent');

class ProxiesService {
    constructor(wipoUrl) {
        this.wipoUrl = 'https://www.google.com/maps';
        this.proxiesList = [];
        this.currentIndex = 0;
        this.initCount = 0;
        this.MAX_CHECKING_PROXY = 500;
        this.INITIALIZING_PROXY = false;
    }
    async initProxies() {
        this.INITIALIZING_PROXY = true;
        console.log('Initializing proxies...');

        try {
            // await this.scrappingProxies('socks5');
            await this.scrappingProxies('socks4');
            await this.scrappingProxies('http');
            // await this.scrappingProxiesFromFreeProxyWorld();
            // await this.scrapeProxiesFromApi();
            // const urlStr = `https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/socks5.txt`;
            // const fileName = `socks5.txt`;
            // await this.downloadFile(urlStr, fileName);

           await this.checkAndRemoveNonWorkingProxies()

            console.log('Proxies initialized successfully.');
        } catch (error) {
            console.error('Error initializing proxies:', error);
        }

        this.INITIALIZING_PROXY = false;
    }

    // async scrappingProxies(proxyType) {
    //     const url = `https://www.proxy-list.download/api/v2/get?l=en&t=${proxyType}`;
    //     console.log("ahihihihi")
    //
    //     try {
    //         const response = await axios.get(url);
    //         if (response.status === 200) {
    //             const responseBody = response.data;
    //             console.log("responseBody: "+ responseBody)
    //             // this.parseAndPrintProxies(responseBody, proxyType);
    //         } else {
    //             throw new Error(`Failed to fetch proxies. HTTP Status Code: ${response.status}`);
    //         }
    //     } catch (error) {
    //         console.error('Error scraping proxies:', error.message);
    //     }
    // }

    async scrappingProxiesFromFreeProxyWorld() {
        const url = 'https://free-proxy-list.net/';

        try {
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);
            const proxyRows = $('tbody tr');

            proxyRows.each((index, element) => {
                const ipAddress = $(element).find('td').eq(0).text();
                const port = $(element).find('td').eq(1).text();
                this.proxiesList.push({ ip: ipAddress, port: parseInt(port), proxyType: 'HTTP' });
                this.proxiesList.push({ ip: ipAddress, port: parseInt(port), proxyType: 'SOCKS5' });
            });
        } catch (error) {
            console.error('Error scraping proxies from FreeProxyWorld:', error.message);
        }
    }


    async downloadFile(urlStr, fileName) {
        try {
            const response = await axios.get(urlStr, { responseType: 'stream' });
            const filePath = `${__dirname}/${fileName}`;
            response.data.pipe(fs.createWriteStream(filePath));
            console.log('File downloaded successfully.');
            return filePath;
        } catch (error) {
            console.error('Error downloading file:', error.message);
        }
    }

    async parseAndPrintProxies(responseBody, proxyType) {
        try {
            const proxyArray = responseBody.LISTA; // Assuming the response body is in JSON format with a key "LISTA" containing an array of proxies

            for (const proxyObject of proxyArray) {
                const ip = proxyObject.IP;
                const port = parseInt(proxyObject.PORT);
                // Print or process the extracted proxy information as needed
                this.proxiesList.push({ ip: ip, port: port, proxyType: proxyType });

                console.log(`IP: ${ip}, Port: ${port}, Proxy Type: ${proxyType}`);

            }
        } catch (error) {
            console.error('Error parsing and printing proxies:', error.message);
        }
    }

    async parseAndPrintProxiesAPI(responseBody) {
        try {
            const proxyArray = responseBody.data; // Assuming the response body is in JSON format with a key "data" containing an array of proxies

            for (const proxyObject of proxyArray) {
                const ip = proxyObject.ip;
                const port = parseInt(proxyObject.port);
                const types = proxyObject.protocols;

                for (const type of types) {
                    const proxyType = (type === 'socks5') ? 'SOCKS5' : (type === 'socks4') ? 'SOCKS4' : 'HTTP';
                    this.proxiesList.push({ ip: ip, port: port, proxyType: proxyType });
                    // Print or process the extracted proxy information as needed
                    console.log(`IP: ${ip}, Port: ${port}, Proxy Type: ${proxyType}`);
                }
            }
        } catch (error) {
            console.error('Error parsing and printing proxies from API:', error.message);
        }
    }



    getNextProxy() {

        if (this.proxiesList.length === 0) {
            console.log('Proxies list is empty.');
            return null;
        }

        const size = this.proxiesList.length;
        if(this.currentIndex === size-1){
            return false
        }

        while (true) {
            const nextProxy = this.proxiesList[this.currentIndex % size];

            if (!nextProxy.isInUsed) {
                nextProxy.isInUsed = true;
                this.currentIndex++;
                console.log(`Proxy: ${nextProxy.ip}:${nextProxy.port} | Index: ${this.currentIndex}`);
                return nextProxy;
            }

            this.currentIndex++;
        }
    }

    releaseProxy(proxyInfo) {
        if (!proxyInfo || !this.proxiesList.includes(proxyInfo)) {
            console.warn('Invalid proxy provided or proxy not found in the list.');
            return;
        }

        proxyInfo.isInUsed = false;
        this.proxiesList[this.proxiesList.indexOf(proxyInfo)] = proxyInfo;
        console.log('Proxy released:', proxyInfo);
    }

    releaseAllProxies() {
        for (const proxyInfo of this.proxiesList) {
            proxyInfo.isInUsed = false;
            console.log('Proxy released:', proxyInfo);
        }
        this.currentIndex = 0;
    }

    // async checkAndRemoveNonWorkingProxies() {
    //     console.log('Checking and removing non-working proxies...');
    //     const workingProxies = [];
    //
    //     for (const proxyInfo of this.proxiesList) {
    //         try {
    //             const response = await axios.get(this.wipoUrl, {
    //                 proxy: {
    //                     host: proxyInfo.ip,
    //                     port: proxyInfo.port,
    //                 },
    //                 timeout: 5000, // 5 seconds
    //             });
    //             console.log(`Proxy ${proxyInfo.ip}:${proxyInfo.port} is working.`);
    //             workingProxies.push(proxyInfo);
    //         } catch (error) {
    //             console.log(`Proxy ${proxyInfo.ip}:${proxyInfo.port} is not working. Error: ${error.message}`);
    //         }
    //     }
    //
    //     this.proxiesList = workingProxies;
    //     console.log('Finished checking proxies. Updated list size:', this.proxiesList.length);
    // }

    async checkAndRemoveNonWorkingProxies() {
        console.log('Checking and removing non-working proxies...');
        const promises = [];

        for (const proxyInfo of this.proxiesList) {
            const promise = this.checkProxy(proxyInfo);
            promises.push(promise);
        }

        try {
            const responses = await Promise.all(promises);
            const workingProxies = responses.filter(response => response.success).map(response => response.proxyInfo);
            this.proxiesList = workingProxies;
            console.log('Finished checking proxies. Updated list size:', this.proxiesList.length);
        } catch (error) {
            console.error('Error occurred while checking proxies:', error);
        }
    }

    // async  checkProxy(proxyInfo) {
    //     try {
    //         let proxyConfig;
    //         if (proxyInfo.proxyType === 'http') {
    //             proxyConfig = {
    //                 proxy: `http://${proxyInfo.ip}:${proxyInfo.port}`,
    //                 // Add other proxy options if needed (e.g., proxy authentication)
    //             };
    //         } else if (proxyInfo.proxyType === 'socks4' || proxyInfo.proxyType === 'socks5') {
    //             console.log("==========> s4")
    //             const SocksProxyAgent = require('socks-proxy-agent');
    //             proxyConfig = {
    //                 agentClass: SocksProxyAgent,
    //                 agentOptions: {
    //                     socksVersion: proxyInfo.proxyType === 'socks4' ? 4 : 5, // Specify SOCKS version
    //                     socksHost: proxyInfo.ip,
    //                     socksPort: proxyInfo.port,
    //                 },
    //             };
    //
    //             // this.checkProxyS5('some_id', proxyInfo.ip, proxyInfo.port, 'https://www.example.com', (id, ip, port, success, statusCode, err) => {
    //             //     if (success) {
    //             //         return { success: true, proxyInfo };
    //             //     } else {
    //             //         return { success: false, proxyInfo };
    //             //     }
    //             // });
    //
    //
    //
    //         } else {
    //             throw new Error(`Unsupported proxy type: ${proxyInfo.proxyType}`);
    //         }
    //
    //        await request.get('https://www.google.com', {
    //             ...proxyConfig,
    //             timeout: 15000,
    //         },()=>{
    //             console.log("========> check")
    //            return { success: true, proxyInfo };
    //        });
    //         console.log(`Proxy ${proxyInfo.ip}:${proxyInfo.port} is working.`);
    //         return { success: true, proxyInfo };
    //     } catch (error) {
    //         console.log(`Proxy ${proxyInfo.ip}:${proxyInfo.port} is not working. Error: ${error.message}`);
    //         return { success: false, proxyInfo };
    //     }
    // }


    async checkProxy(proxyInfo) {
        try {
            let proxyConfig;
            if (proxyInfo.proxyType === 'http') {
                proxyConfig = {
                    proxy: `http://${proxyInfo.ip}:${proxyInfo.port}`,
                    // Add other proxy options if needed (e.g., proxy authentication)
                };
            } else if (proxyInfo.proxyType === 'socks4' || proxyInfo.proxyType === 'socks5') {
                // proxyConfig = {
                //     agentClass: SocksProxyAgent,
                //     agentOptions: {
                //         socksVersion: proxyInfo.proxyType === 'socks4' ? 4 : 5, // Specify SOCKS version
                //         socksHost: proxyInfo.ip,
                //         socksPort: proxyInfo.port,
                //     },
                // };

                proxyConfig = {
                    proxy: `socks5://${proxyInfo.ip}:${proxyInfo.port}`,
                    // Add other proxy options if needed (e.g., proxy authentication)
                };
            } else {
                throw new Error(`Unsupported proxy type: ${proxyInfo.proxyType}`);
            }

           const response = await request.get('https://www.whatismyip.com/', {
                ...proxyConfig,
                timeout: 15000,
            },()=>{

           });
            console.log("response: "+ response.data)

            console.log(`Proxy ${proxyInfo.ip}:${proxyInfo.port} is working.`);
            return { success: true, proxyInfo };
        } catch (error) {
            console.log(`Proxy ${proxyInfo.ip}:${proxyInfo.port} is not working. Error: ${error.message}`);
            return { success: false, proxyInfo };
        }
    }

     checkProxyS5 = function(id, ip, port, url, callback) {
        const proxy_url = `socks5://${ip}:${port}`;

        const proxyRequest = request.defaults({
            agentClass: Agent,
            agentOptions: {
                socksHost: ip,
                socksPort: port,
            },
        });

        proxyRequest({ url: url, timeout: 120000 }, function(err, res) {
            if (err) {
                callback(id, ip, port, false, -1, err);
            } else if (res.statusCode !== 200) {
                callback(id, ip, port, false, res.statusCode, err);
            } else if (!res.body) {
                callback(id, ip, port, false, res.statusCode, 'regex problem');
            } else {
                callback(id, ip, port, true, res.statusCode);
            }
        });
    };

    async writeProxiesToFile() {
        const fileName = 'working_proxies.txt';

        try {
            const content = this.proxiesList.map(proxy => `${proxy.ip}:${proxy.port}`).join('\n');
            await writeFileAsync(fileName, content);
            console.log(`Working proxies written to: ${fileName}`);
        } catch (error) {
            console.error('Error writing proxies to file:', error.message);
        }
    }


    async scrappingProxies(proxyType) {
        const url = `https://www.proxy-list.download/api/v2/get?l=en&t=${proxyType}`;
        try {
            const response = await axios.get(url, {
                headers: {
                    'sec-ch-ua': 'Not_A Brand;v=8, Chromium;v=120, Opera GX;v=106',
                    'Referer': 'https://www.proxy-list.download/SOCKS5',
                    'sec-ch-ua-mobile': '?0',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0',
                    'sec-ch-ua-platform': 'Windows',
                },
            });

            if (response.status === 200) {
                this.parseAndPrintProxies(response.data, proxyType);
            } else {
                console.error('Failed to fetch proxies. HTTP Status Code:', response.status);
            }
        } catch (error) {
            console.error('Error scraping proxies:', error.message);
        }
    }

    async scrappingProxiesFromFreeProxyWorld() {
        const url = 'https://free-proxy-list.net/';
        try {
            const response = await axios.get(url);
            const proxyRows = response.data.match(/<tr>[\s\S]*?<\/tr>/g) || [];

            for (const row of proxyRows) {
                const columns = row.match(/<td>(.*?)<\/td>/g) || [];

                if (columns.length >= 2) {
                    const ipAddress = columns[0].replace(/<\/?td>/g, '');
                    const port = columns[1].replace(/<\/?td>/g, '');
                    console.log('IP:Port', `${ipAddress}:${port}`);

                    this.proxiesList.push({ ip: ipAddress, port: port, proxyType: 'HTTP' });
                    this.proxiesList.push({ ip: ipAddress, port: port, proxyType: 'SOCKS5' });
                }
            }
        } catch (error) {
            console.error('Error scraping proxies from FreeProxyWorld:', error.message);
        }
    }

    async scrapeProxiesFromFile(filePath) {
        const FILE_PATH = filePath;
        try {
            const content = await fs.promises.readFile(FILE_PATH, 'utf-8');
            const lines = content.split('\n');

            for (const line of lines) {
                const [ipAddress, port] = line.split(':');
                console.log('Read proxy from file:', `${ipAddress}:${port}`);
                this.proxiesList.push({ ip: ipAddress, port: port, proxyType: 'SOCKS5' });
            }

            console.log('Proxy reading from file completed. Total proxies read:', this.proxiesList.length);
        } catch (error) {
            console.error('Error reading proxies from file:', error.message);
        }
    }

    async isProxyWorking(proxyInfo) {
        try {
            const proxyUrl = `http://${proxyInfo.ip}:${proxyInfo.port}`;
            const response = await axios.get(this.wipoUrl, {
                proxy: {
                    host: proxyInfo.ip,
                    port: proxyInfo.port,
                    protocol: proxyInfo.proxyType.toLowerCase()
                },
                timeout: 5000 // 5 seconds timeout
            });

            if (response.status === 200) {
                console.log(`Proxy ${proxyInfo.ip}:${proxyInfo.port} is working.`);
                return true;
            } else {
                console.error(`Proxy ${proxyInfo.ip}:${proxyInfo.port} responded with status ${response.status}.`);
                return false;
            }
        } catch (error) {
            console.error(`Error checking proxy ${proxyInfo.ip}:${proxyInfo.port}:`, error.message);
            return false;
        }
    }



}

module.exports = ProxiesService;
