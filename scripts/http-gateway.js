// This is a simple HTTP-to-HTTPS gateway script that can be run on a server
// to receive data from ESP32 devices with SIM800L modules and forward it to
// the HTTPS API endpoint.

const http = require("http")
const https = require("https")
const url = require("url")

// Configuration
const HTTP_PORT = 8080
const HTTPS_ENDPOINT = "https://vercel.com/kenzyrabea04-cueduegs-projects/v0-esp32-water-level-dashboard/api/readings"

// Create HTTP server
const server = http.createServer((req, res) => {
  // Only handle POST requests to /api/readings
  if (req.method === "POST" && req.url === "/api/readings") {
    let body = ""

    req.on("data", (chunk) => {
      body += chunk.toString()
    })

    req.on("end", () => {
      console.log("Received data:", body)

      try {
        // Parse the JSON data
        const data = JSON.parse(body)

        // Forward the data to the HTTPS endpoint
        forwardToHttps(data, (success, response) => {
          if (success) {
            res.writeHead(200, { "Content-Type": "application/json" })
            res.end(JSON.stringify({ success: true, message: "Data forwarded successfully" }))
          } else {
            res.writeHead(500, { "Content-Type": "application/json" })
            res.end(JSON.stringify({ success: false, error: response }))
          }
        })
      } catch (error) {
        console.error("Error parsing JSON:", error)
        res.writeHead(400, { "Content-Type": "application/json" })
        res.end(JSON.stringify({ success: false, error: "Invalid JSON data" }))
      }
    })
  } else {
    // Handle other requests
    res.writeHead(404, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ success: false, error: "Not found" }))
  }
})

// Function to forward data to HTTPS endpoint
function forwardToHttps(data, callback) {
  // Parse the URL
  const parsedUrl = url.parse(HTTPS_ENDPOINT)

  // Prepare the request options
  const options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  }

  // Create the request
  const req = https.request(options, (res) => {
    let responseData = ""

    res.on("data", (chunk) => {
      responseData += chunk
    })

    res.on("end", () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log("Data forwarded successfully")
        callback(true, responseData)
      } else {
        console.error("Error forwarding data:", responseData)
        callback(false, responseData)
      }
    })
  })

  req.on("error", (error) => {
    console.error("Error forwarding data:", error)
    callback(false, error.message)
  })

  // Send the data
  req.write(JSON.stringify(data))
  req.end()
}

// Start the server
server.listen(HTTP_PORT, () => {
  console.log(`HTTP-to-HTTPS gateway running on port ${HTTP_PORT}`)
  console.log(`Forwarding to ${HTTPS_ENDPOINT}`)
})
