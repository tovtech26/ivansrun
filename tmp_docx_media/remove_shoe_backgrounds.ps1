param(
  [string[]]$OnlySkus
)

Add-Type -AssemblyName System.Drawing

function Get-ColorDistanceSq {
  param(
    [System.Drawing.Color]$A,
    [System.Drawing.Color]$B
  )

  $dr = [int]$A.R - [int]$B.R
  $dg = [int]$A.G - [int]$B.G
  $db = [int]$A.B - [int]$B.B
  return ($dr * $dr) + ($dg * $dg) + ($db * $db)
}

function Get-AverageColor {
  param(
    [System.Drawing.Bitmap]$Bitmap
  )

  $samples = New-Object System.Collections.Generic.List[System.Drawing.Color]
  $stepX = [Math]::Max([int]($Bitmap.Width / 24), 1)
  $stepY = [Math]::Max([int]($Bitmap.Height / 24), 1)

  for ($x = 0; $x -lt $Bitmap.Width; $x += $stepX) {
    $samples.Add($Bitmap.GetPixel($x, 0))
    $samples.Add($Bitmap.GetPixel($x, $Bitmap.Height - 1))
  }

  for ($y = 0; $y -lt $Bitmap.Height; $y += $stepY) {
    $samples.Add($Bitmap.GetPixel(0, $y))
    $samples.Add($Bitmap.GetPixel($Bitmap.Width - 1, $y))
  }

  $sumR = 0
  $sumG = 0
  $sumB = 0

  foreach ($color in $samples) {
    $sumR += [int]$color.R
    $sumG += [int]$color.G
    $sumB += [int]$color.B
  }

  $count = [Math]::Max($samples.Count, 1)
  return [System.Drawing.Color]::FromArgb(
    [int]($sumR / $count),
    [int]($sumG / $count),
    [int]($sumB / $count)
  )
}

function Test-IsBackground {
  param(
    [System.Drawing.Color]$Color,
    [System.Drawing.Color]$BackgroundColor,
    [int]$DistanceThresholdSq
  )

  $distance = Get-ColorDistanceSq -A $Color -B $BackgroundColor
  if ($distance -le $DistanceThresholdSq) {
    return $true
  }

  $spread = ([int][Math]::Max($Color.R, [Math]::Max($Color.G, $Color.B))) - ([int][Math]::Min($Color.R, [Math]::Min($Color.G, $Color.B)))
  $brightness = ([int]$Color.R + [int]$Color.G + [int]$Color.B) / 3

  if ($spread -lt 14 -and $brightness -gt 220) {
    return $true
  }

  return $false
}

function Get-LargestComponentMask {
  param(
    [bool[]]$ForegroundMask,
    [int]$Width,
    [int]$Height
  )

  $visited = New-Object 'bool[]' ($Width * $Height)
  $largestMask = New-Object 'bool[]' ($Width * $Height)
  $largestSize = 0

  $dx = @(1, -1, 0, 0, 1, 1, -1, -1)
  $dy = @(0, 0, 1, -1, 1, -1, 1, -1)

  for ($y = 0; $y -lt $Height; $y++) {
    for ($x = 0; $x -lt $Width; $x++) {
      $startIndex = ($y * $Width) + $x
      if (-not $ForegroundMask[$startIndex] -or $visited[$startIndex]) {
        continue
      }

      $queueX = New-Object System.Collections.Generic.Queue[int]
      $queueY = New-Object System.Collections.Generic.Queue[int]
      $componentIndexes = New-Object System.Collections.Generic.List[int]

      $visited[$startIndex] = $true
      $queueX.Enqueue($x)
      $queueY.Enqueue($y)

      while ($queueX.Count -gt 0) {
        $cx = $queueX.Dequeue()
        $cy = $queueY.Dequeue()
        $currentIndex = ($cy * $Width) + $cx
        $componentIndexes.Add($currentIndex)

        for ($i = 0; $i -lt $dx.Length; $i++) {
          $nx = $cx + $dx[$i]
          $ny = $cy + $dy[$i]

          if ($nx -lt 0 -or $ny -lt 0 -or $nx -ge $Width -or $ny -ge $Height) {
            continue
          }

          $neighborIndex = ($ny * $Width) + $nx
          if ($visited[$neighborIndex] -or -not $ForegroundMask[$neighborIndex]) {
            continue
          }

          $visited[$neighborIndex] = $true
          $queueX.Enqueue($nx)
          $queueY.Enqueue($ny)
        }
      }

      if ($componentIndexes.Count -gt $largestSize) {
        $largestSize = $componentIndexes.Count
        $largestMask = New-Object 'bool[]' ($Width * $Height)
        foreach ($index in $componentIndexes) {
          $largestMask[$index] = $true
        }
      }
    }
  }

  return @{
    Mask = $largestMask
    Size = $largestSize
  }
}

function Export-Cutout {
  param(
    [string]$InputPath,
    [string]$OutputPath
  )

  $bitmap = [System.Drawing.Bitmap]::new($InputPath)

  try {
    $width = $bitmap.Width
    $height = $bitmap.Height
    $totalPixels = $width * $height

    $backgroundColor = Get-AverageColor -Bitmap $bitmap
    $distanceThresholdSq = 2400

    $backgroundConnected = New-Object 'bool[]' $totalPixels
    $queued = New-Object 'bool[]' $totalPixels
    $queueX = New-Object System.Collections.Generic.Queue[int]
    $queueY = New-Object System.Collections.Generic.Queue[int]

    function Add-BackgroundSeed {
      param([int]$SeedX, [int]$SeedY)

      $seedIndex = ($SeedY * $width) + $SeedX
      if ($queued[$seedIndex]) {
        return
      }

      $seedColor = $bitmap.GetPixel($SeedX, $SeedY)
      if (-not (Test-IsBackground -Color $seedColor -BackgroundColor $backgroundColor -DistanceThresholdSq $distanceThresholdSq)) {
        return
      }

      $queued[$seedIndex] = $true
      $queueX.Enqueue($SeedX)
      $queueY.Enqueue($SeedY)
    }

    for ($x = 0; $x -lt $width; $x++) {
      Add-BackgroundSeed -SeedX $x -SeedY 0
      Add-BackgroundSeed -SeedX $x -SeedY ($height - 1)
    }

    for ($y = 0; $y -lt $height; $y++) {
      Add-BackgroundSeed -SeedX 0 -SeedY $y
      Add-BackgroundSeed -SeedX ($width - 1) -SeedY $y
    }

    $dx = @(1, -1, 0, 0, 1, 1, -1, -1)
    $dy = @(0, 0, 1, -1, 1, -1, 1, -1)

    while ($queueX.Count -gt 0) {
      $x = $queueX.Dequeue()
      $y = $queueY.Dequeue()
      $index = ($y * $width) + $x
      if ($backgroundConnected[$index]) {
        continue
      }

      $backgroundConnected[$index] = $true

      for ($i = 0; $i -lt $dx.Length; $i++) {
        $nx = $x + $dx[$i]
        $ny = $y + $dy[$i]
        if ($nx -lt 0 -or $ny -lt 0 -or $nx -ge $width -or $ny -ge $height) {
          continue
        }

        $neighborIndex = ($ny * $width) + $nx
        if ($queued[$neighborIndex]) {
          continue
        }

        $neighborColor = $bitmap.GetPixel($nx, $ny)
        if (Test-IsBackground -Color $neighborColor -BackgroundColor $backgroundColor -DistanceThresholdSq $distanceThresholdSq) {
          $queued[$neighborIndex] = $true
          $queueX.Enqueue($nx)
          $queueY.Enqueue($ny)
        }
      }
    }

    $foregroundMask = New-Object 'bool[]' $totalPixels
    for ($y = 0; $y -lt $height; $y++) {
      for ($x = 0; $x -lt $width; $x++) {
        $index = ($y * $width) + $x
        if (-not $backgroundConnected[$index]) {
          $foregroundMask[$index] = $true
        }
      }
    }

    $largest = Get-LargestComponentMask -ForegroundMask $foregroundMask -Width $width -Height $height
    if ($largest.Size -lt 1000) {
      throw "Foreground extraction failed for $InputPath"
    }

    $selectedMask = $largest.Mask
    $minX = $width
    $minY = $height
    $maxX = 0
    $maxY = 0

    for ($y = 0; $y -lt $height; $y++) {
      for ($x = 0; $x -lt $width; $x++) {
        $index = ($y * $width) + $x
        if (-not $selectedMask[$index]) {
          continue
        }

        if ($x -lt $minX) { $minX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }

    $padding = 20
    $cropX = [Math]::Max($minX - $padding, 0)
    $cropY = [Math]::Max($minY - $padding, 0)
    $cropWidth = [Math]::Min(($maxX - $minX + 1) + ($padding * 2), $width - $cropX)
    $cropHeight = [Math]::Min(($maxY - $minY + 1) + ($padding * 2), $height - $cropY)

    $outputBitmap = [System.Drawing.Bitmap]::new($cropWidth, $cropHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

    try {
      for ($y = 0; $y -lt $cropHeight; $y++) {
        for ($x = 0; $x -lt $cropWidth; $x++) {
          $sourceX = $cropX + $x
          $sourceY = $cropY + $y
          $sourceIndex = ($sourceY * $width) + $sourceX

          if ($selectedMask[$sourceIndex]) {
            $color = $bitmap.GetPixel($sourceX, $sourceY)
            $outputBitmap.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $color.R, $color.G, $color.B))
          } else {
            $outputBitmap.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
          }
        }
      }

      $outputDirectory = Split-Path -Parent $OutputPath
      if (-not (Test-Path $outputDirectory)) {
        New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
      }

      $outputBitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    finally {
      $outputBitmap.Dispose()
    }
  }
  finally {
    $bitmap.Dispose()
  }
}

$skuMap = [ordered]@{
  '028' = '028-irunsvan-heat-1-0'
  '166' = '166-irunsvan-fei-ran-3-0'
  '121' = '121-irunsvan-chasing-wind-1-0'
  '126' = '126-irunsvan-chasing-light-1-0'
  '066' = '066-irunsvan-heat-2-0'
  '072' = '072-irunsvan-breeze-suc-1-0'
  '098' = '098-irunsvan-heat-2-0-pro'
  '125' = '125-irunsvan-feiran-gt-3-0'
  '131' = '131-irunsvan-shadow-wing-3-0'
  '087' = '087-irunsvan-shadowing-2-0-plus'
  '2503' = '2503-irunsvan-shadow-wing-2-0-pro'
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$sourceRoot = Join-Path $repoRoot 'public\product-images\SKUs'
$outputRoot = Join-Path $repoRoot 'tmp_docx_media\shoe_graphics'

foreach ($sku in $skuMap.Keys) {
  if ($OnlySkus -and ($OnlySkus -notcontains $sku)) {
    continue
  }

  $sourceDir = Join-Path $sourceRoot $sku
  if (-not (Test-Path $sourceDir)) {
    Write-Warning "Missing source folder for SKU $sku"
    continue
  }

  $targetDir = Join-Path $outputRoot $skuMap[$sku]
  $cutoutDir = Join-Path $targetDir 'cutouts'
  $originalDir = Join-Path $targetDir 'originals'

  New-Item -ItemType Directory -Path $cutoutDir -Force | Out-Null
  New-Item -ItemType Directory -Path $originalDir -Force | Out-Null

  Get-ChildItem -Path $sourceDir -File | Where-Object { $_.Extension -match '^\.(jpg|jpeg|png|webp)$' } | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $originalDir $_.Name) -Force

    $outputName = [System.IO.Path]::GetFileNameWithoutExtension($_.Name) + '.png'
    $outputPath = Join-Path $cutoutDir $outputName
    Export-Cutout -InputPath $_.FullName -OutputPath $outputPath
    Write-Output "DONE`t$sku`t$($_.Name)"
  }
}
