// Import the necessary libraries
const fs = require("fs"); // File system, for writing files
const proxyChain = require("proxy-chain"); // For anonymizing the proxy
const puppeteer = require("puppeteer-extra"); // Enhanced version of Puppeteer for additional functionality
const proxies_service = require("./src/ProxiesService");
const GoogleMapScraper = require("./src/GoogleMapScraper");
const LatLongService = require("./src/LatLongService")
// Import and use stealth plugin to prevent detection of the browser automation
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const SocksProxyAgent = require("socks-proxy-agent");
const MatTran = require("./src/mattran")
const ReadProxiesFromFile = require("./src/ImportProxies")
puppeteer.use(StealthPlugin());

// Define the search keyword
const keyword = "thiết+kế";

// Create an instance of the proxy service
const proxiesService = new proxies_service();


const getLatLong = async ()=>{
    const latLongService = new LatLongService()
    const keyword=["ha noi","bac ninh","hai duong","bac giang"]
   const result =await latLongService.getLongLat(keyword)

    console.log("result: "+ JSON.stringify(result))
    console.log("lat  : "+ result[0].lat)
    console.log("long : "+ result[0].long)
}




  const scrapeWithNextProxy = async () => {

      const mattran = new MatTran()
      const keyword=["ha noi","bac ninh","hai duong","bac giang"]
    while (true){
      let proxy = proxiesService.getNextProxy();
      if (!proxy) {
        console.log("No more proxies available.");
        return;
      }
      let proxyUrl;

      if (proxy.proxyType === 'http') {
        proxyUrl = `http://${proxy.ip}:${proxy.port}`;
        // proxyUrl = `${proxy.ip}:${proxy.port}`;
      } else if (proxy.proxyType === 'socks4' || proxy.proxyType === 'socks5') {
        proxyUrl = `socks://${proxy.ip}:${proxy.port}`;
        // proxyUrl = `${proxy.ip}:${proxy.port}`;
      } else {
        throw new Error(`Unsupported proxy type: ${proxy.proxyType}`);
      }

      try {
        // Move your asynchronous code here, for example:
          await mattran.access(keyword,proxyUrl)
        console.log("ahihihi");
        // If any error occurs during GoogleMapScraper function, it will be caught here
      } catch (e) {
        console.log("Error occurred:", e);
        console.log("Retrying with next proxy in 2 seconds...");
          await new Promise(resolve => setTimeout(resolve, 2000)); // Delay 1 second

          // Handle error or retry logic here
      }

    }
  };


const mattran = new MatTran()


const filename = "C:\\Users\\Admin\\Desktop\\Webshare 10 proxies.txt"; // Replace it with your actual proxies file
const proxies = ReadProxiesFromFile(filename);
const index=1
const proxyUrl = `http://${proxies[index].host}:${proxies[index].port}`;
const username = proxies[index].username
const password = proxies[index].password

console.log('Proxies:', proxies);
const ScapeGoogleMap = async ()=>{
    const latLongService = new LatLongService()
    // const keyword=["ha noi","bac ninh","hai duong","bac giang"]
    const keyword=["bac ninh"]
    const result =await latLongService.getLongLat(keyword)

    console.log("result: "+ JSON.stringify(result))
    console.log("lat  : "+ result[0].lat)
    console.log("long : "+ result[0].long)

    GoogleMapScraper("thiet+ke",null,username,password,null)
    // GoogleMapScraper("thiet+ke",proxyUrl,username,password,result[0])
    // GoogleMapScraper("thiet+ke",proxyUrl,username,password,null)

}

ScapeGoogleMap()







