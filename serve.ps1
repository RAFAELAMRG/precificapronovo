# Pure PowerShell HTTP Server to serve ES6 modules locally on port 3000
# Run: powershell -ExecutionPolicy Bypass -File serve.ps1

$port = 3000
$basePath = "C:\Users\Pichau\.gemini\antigravity\scratch\marketplace-pricing-saas"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
try {
    $listener.Start()
    Write-Host "--------------------------------------------------------"
    Write-Host " PrecificaPro Dev Server is running!"
    Write-Host " Access the SaaS here: http://localhost:$port/"
    Write-Host " Press Ctrl+C in terminal to stop the server."
    Write-Host "--------------------------------------------------------"
} catch {
    Write-Error "Failed to start listener on port $port. Check if port is already in use."
    exit
}

# Keep running until closed
while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/") {
            $urlPath = "/index.html"
        }
        
        # Clean query parameters if any
        if ($urlPath.Contains("?")) {
            $urlPath = $urlPath.Substring(0, $urlPath.IndexOf("?"))
        }

        $filePath = [System.IO.Path]::Combine($basePath, $urlPath.TrimStart('/').Replace('/', '\'))
        
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            
            # Identify MIME Type
            if ($filePath.EndsWith(".html")) {
                $response.ContentType = "text/html; charset=utf-8"
            } elseif ($filePath.EndsWith(".css")) {
                $response.ContentType = "text/css"
            } elseif ($filePath.EndsWith(".js")) {
                $response.ContentType = "application/javascript; charset=utf-8"
            } elseif ($filePath.EndsWith(".svg")) {
                $response.ContentType = "image/svg+xml"
            } elseif ($filePath.EndsWith(".json")) {
                $response.ContentType = "application/json"
            } else {
                $response.ContentType = "application/octet-stream"
            }
            
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errorBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found - PrecificaPro Dev Server")
            $response.ContentType = "text/plain"
            $response.ContentLength64 = $errorBytes.Length
            $response.OutputStream.Write($errorBytes, 0, $errorBytes.Length)
        }
        $response.Close()
    } catch {
        # Catch connection resets or manual server aborts silently
    }
}
