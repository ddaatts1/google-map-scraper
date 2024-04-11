
const fs = require('fs');

// Function to read proxies from the file
function readProxiesFromFile(filename) {
    try {
        // Read the contents of the file
        const data = fs.readFileSync(filename, 'utf8');

        // Split the data into an array of lines
        const lines = data.split(/\r?\n/); // Handle both \n and \r\n line endings

        // Parse each line to extract proxy information
        const proxies = lines.map(line => {
            // Trim whitespace characters from the end of the line
            line = line.trim();
            const [host, port, username, password] = line.split(':');
            return { host, port, username, password };
        });

        return proxies;
    } catch (error) {
        console.error('Error reading proxies from file:', error);
        return [];
    }
}

module.exports = readProxiesFromFile