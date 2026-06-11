Add-Type -AssemblyName System.Drawing

$srcPath = "c:\Users\Lenovo\Desktop\shopiators-merchant-mobie\assets\images\shopiators-favicon-org.png"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source image not found: $srcPath"
    exit 1
}

$srcImage = [System.Drawing.Image]::FromFile($srcPath)

# Function to resize and center image
function Create-Resized-Image {
    param(
        [string]$outputPath,
        [int]$canvasWidth,
        [int]$canvasHeight,
        [int]$targetLogoWidth,
        [int]$targetLogoHeight,
        [System.Drawing.Color]$bgColor,
        [bool]$isTransparent
    )

    $bitmap = New-Object System.Drawing.Bitmap $canvasWidth, $canvasHeight
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

    # Set high quality settings
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    if ($isTransparent) {
        $graphics.Clear([System.Drawing.Color]::Transparent)
    } else {
        $graphics.Clear($bgColor)
    }

    # Calculate centered position
    $x = ($canvasWidth - $targetLogoWidth) / 2
    $y = ($canvasHeight - $targetLogoHeight) / 2

    # Draw the logo
    $graphics.DrawImage($srcImage, $x, $y, $targetLogoWidth, $targetLogoHeight)

    # Save
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $graphics.Dispose()
    $bitmap.Dispose()
    Write-Host "Created: $outputPath"
}

# 1. Create icon.png (1024x1024, white background, logo size 700x700 centered)
Create-Resized-Image `
    -outputPath "c:\Users\Lenovo\Desktop\shopiators-merchant-mobie\assets\images\icon.png" `
    -canvasWidth 1024 `
    -canvasHeight 1024 `
    -targetLogoWidth 700 `
    -targetLogoHeight 700 `
    -bgColor ([System.Drawing.Color]::White) `
    -isTransparent $false

# 2. Create android-icon-foreground.png (1024x1024, transparent background, logo size 650x650 centered)
Create-Resized-Image `
    -outputPath "c:\Users\Lenovo\Desktop\shopiators-merchant-mobie\assets\images\android-icon-foreground.png" `
    -canvasWidth 1024 `
    -canvasHeight 1024 `
    -targetLogoWidth 650 `
    -targetLogoHeight 650 `
    -bgColor ([System.Drawing.Color]::Transparent) `
    -isTransparent $true

# 3. Create android-icon-background.png (1024x1024, solid white background)
$bgBitmap = New-Object System.Drawing.Bitmap 1024, 1024
$bgGraphics = [System.Drawing.Graphics]::FromImage($bgBitmap)
$bgGraphics.Clear([System.Drawing.Color]::White)
$bgBitmap.Save("c:\Users\Lenovo\Desktop\shopiators-merchant-mobie\assets\images\android-icon-background.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bgGraphics.Dispose()
$bgBitmap.Dispose()
Write-Host "Created android-icon-background.png"

# 4. Create favicon.png (48x48, transparent background, logo size 40x40 centered)
Create-Resized-Image `
    -outputPath "c:\Users\Lenovo\Desktop\shopiators-merchant-mobie\assets\images\favicon.png" `
    -canvasWidth 48 `
    -canvasHeight 48 `
    -targetLogoWidth 40 `
    -targetLogoHeight 40 `
    -bgColor ([System.Drawing.Color]::Transparent) `
    -isTransparent $true

# 5. Create splash-icon.png (logo for splash screen, transparent background, size 300x300 centered in a 512x512 canvas)
Create-Resized-Image `
    -outputPath "c:\Users\Lenovo\Desktop\shopiators-merchant-mobie\assets\images\splash-icon.png" `
    -canvasWidth 512 `
    -canvasHeight 512 `
    -targetLogoWidth 300 `
    -targetLogoHeight 300 `
    -bgColor ([System.Drawing.Color]::Transparent) `
    -isTransparent $true

$srcImage.Dispose()
Write-Host "All icons processed successfully!"
