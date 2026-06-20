param(
  [string[]]$OnlySkus
)

Add-Type -AssemblyName System.Drawing

$source = @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class ShoeCutout
{
    public static void ExportCutout(string inputPath, string outputPath)
    {
        using (var original = new Bitmap(inputPath))
        using (var bitmap = new Bitmap(original.Width, original.Height, PixelFormat.Format32bppArgb))
        {
            using (var g = Graphics.FromImage(bitmap))
            {
                g.DrawImage(original, 0, 0, original.Width, original.Height);
            }

            int width = bitmap.Width;
            int height = bitmap.Height;
            var rect = new Rectangle(0, 0, width, height);
            var data = bitmap.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);

            byte[] pixels = new byte[Math.Abs(data.Stride) * height];
            Marshal.Copy(data.Scan0, pixels, 0, pixels.Length);
            bitmap.UnlockBits(data);

            int stride = Math.Abs(data.Stride);
            int sampleCount = 0;
            long sumR = 0;
            long sumG = 0;
            long sumB = 0;
            int stepX = Math.Max(width / 24, 1);
            int stepY = Math.Max(height / 24, 1);

            Action<int, int> addSample = (x, y) =>
            {
                int idx = (y * stride) + (x * 4);
                sumB += pixels[idx];
                sumG += pixels[idx + 1];
                sumR += pixels[idx + 2];
                sampleCount++;
            };

            for (int x = 0; x < width; x += stepX)
            {
                addSample(x, 0);
                addSample(x, height - 1);
            }

            for (int y = 0; y < height; y += stepY)
            {
                addSample(0, y);
                addSample(width - 1, y);
            }

            int bgR = (int)(sumR / Math.Max(sampleCount, 1));
            int bgG = (int)(sumG / Math.Max(sampleCount, 1));
            int bgB = (int)(sumB / Math.Max(sampleCount, 1));
            int distanceThresholdSq = 2400;

            Func<int, bool> isBackground = idx =>
            {
                int b = pixels[idx];
                int g = pixels[idx + 1];
                int r = pixels[idx + 2];
                int dr = r - bgR;
                int dg = g - bgG;
                int db = b - bgB;
                int distance = (dr * dr) + (dg * dg) + (db * db);
                if (distance <= distanceThresholdSq)
                {
                    return true;
                }

                int max = Math.Max(r, Math.Max(g, b));
                int min = Math.Min(r, Math.Min(g, b));
                int spread = max - min;
                int brightness = (r + g + b) / 3;
                return spread < 14 && brightness > 220;
            };

            int total = width * height;
            bool[] bgConnected = new bool[total];
            bool[] queued = new bool[total];
            var queue = new Queue<int>();
            int[] dx = new[] { 1, -1, 0, 0, 1, 1, -1, -1 };
            int[] dy = new[] { 0, 0, 1, -1, 1, -1, 1, -1 };

            Action<int, int> seed = (x, y) =>
            {
                int flat = (y * width) + x;
                if (queued[flat])
                {
                    return;
                }

                int idx = (y * stride) + (x * 4);
                if (!isBackground(idx))
                {
                    return;
                }

                queued[flat] = true;
                queue.Enqueue(flat);
            };

            for (int x = 0; x < width; x++)
            {
                seed(x, 0);
                seed(x, height - 1);
            }

            for (int y = 0; y < height; y++)
            {
                seed(0, y);
                seed(width - 1, y);
            }

            while (queue.Count > 0)
            {
                int flat = queue.Dequeue();
                if (bgConnected[flat])
                {
                    continue;
                }

                bgConnected[flat] = true;
                int x = flat % width;
                int y = flat / width;

                for (int i = 0; i < dx.Length; i++)
                {
                    int nx = x + dx[i];
                    int ny = y + dy[i];
                    if (nx < 0 || ny < 0 || nx >= width || ny >= height)
                    {
                        continue;
                    }

                    int nFlat = (ny * width) + nx;
                    if (queued[nFlat])
                    {
                        continue;
                    }

                    int nIdx = (ny * stride) + (nx * 4);
                    if (!isBackground(nIdx))
                    {
                        continue;
                    }

                    queued[nFlat] = true;
                    queue.Enqueue(nFlat);
                }
            }

            bool[] foreground = new bool[total];
            for (int i = 0; i < total; i++)
            {
                foreground[i] = !bgConnected[i];
            }

            bool[] visited = new bool[total];
            bool[] largestMask = new bool[total];
            int largestCount = 0;

            for (int flat = 0; flat < total; flat++)
            {
                if (!foreground[flat] || visited[flat])
                {
                    continue;
                }

                var component = new List<int>();
                queue.Clear();
                queue.Enqueue(flat);
                visited[flat] = true;

                while (queue.Count > 0)
                {
                    int current = queue.Dequeue();
                    component.Add(current);
                    int x = current % width;
                    int y = current / width;

                    for (int i = 0; i < dx.Length; i++)
                    {
                        int nx = x + dx[i];
                        int ny = y + dy[i];
                        if (nx < 0 || ny < 0 || nx >= width || ny >= height)
                        {
                            continue;
                        }

                        int next = (ny * width) + nx;
                        if (visited[next] || !foreground[next])
                        {
                            continue;
                        }

                        visited[next] = true;
                        queue.Enqueue(next);
                    }
                }

                if (component.Count > largestCount)
                {
                    largestCount = component.Count;
                    largestMask = new bool[total];
                    foreach (int idx in component)
                    {
                        largestMask[idx] = true;
                    }
                }
            }

            if (largestCount < 1000)
            {
                throw new InvalidOperationException("Foreground extraction failed for " + inputPath);
            }

            int minX = width;
            int minY = height;
            int maxX = 0;
            int maxY = 0;

            for (int flat = 0; flat < total; flat++)
            {
                if (!largestMask[flat])
                {
                    continue;
                }

                int x = flat % width;
                int y = flat / width;
                if (x < minX) minX = x;
                if (y < minY) minY = y;
                if (x > maxX) maxX = x;
                if (y > maxY) maxY = y;
            }

            bool[] keepMask = (bool[])largestMask.Clone();
            for (int pass = 0; pass < 2; pass++)
            {
                bool[] expanded = (bool[])keepMask.Clone();
                for (int flat = 0; flat < total; flat++)
                {
                    if (!keepMask[flat])
                    {
                        continue;
                    }

                    int x = flat % width;
                    int y = flat / width;
                    for (int i = 0; i < dx.Length; i++)
                    {
                        int nx = x + dx[i];
                        int ny = y + dy[i];
                        if (nx < 0 || ny < 0 || nx >= width || ny >= height)
                        {
                            continue;
                        }

                        expanded[(ny * width) + nx] = true;
                    }
                }

                keepMask = expanded;
            }

            int padding = 20;
            int cropX = Math.Max(minX - padding, 0);
            int cropY = Math.Max(minY - padding, 0);
            int cropWidth = Math.Min((maxX - minX + 1) + (padding * 2), width - cropX);
            int cropHeight = Math.Min((maxY - minY + 1) + (padding * 2), height - cropY);
            int outStride = cropWidth * 4;
            byte[] outPixels = new byte[outStride * cropHeight];
            int alphaStartSq = 225;
            int alphaEndSq = 7225;

            for (int y = 0; y < cropHeight; y++)
            {
                int srcY = cropY + y;
                for (int x = 0; x < cropWidth; x++)
                {
                    int srcX = cropX + x;
                    int srcFlat = (srcY * width) + srcX;
                    if (!keepMask[srcFlat])
                    {
                        continue;
                    }

                    int srcIdx = (srcY * stride) + (srcX * 4);
                    int outIdx = (y * outStride) + (x * 4);
                    int b = pixels[srcIdx];
                    int g = pixels[srcIdx + 1];
                    int r = pixels[srcIdx + 2];
                    int dr = r - bgR;
                    int dg = g - bgG;
                    int db = b - bgB;
                    int distanceSq = (dr * dr) + (dg * dg) + (db * db);
                    int alpha;

                    if (distanceSq <= alphaStartSq)
                    {
                        alpha = 0;
                    }
                    else if (distanceSq >= alphaEndSq)
                    {
                        alpha = 255;
                    }
                    else
                    {
                        alpha = ((distanceSq - alphaStartSq) * 255) / (alphaEndSq - alphaStartSq);
                    }

                    if (largestMask[srcFlat] && alpha < 96)
                    {
                        alpha = 96;
                    }

                    outPixels[outIdx] = pixels[srcIdx];
                    outPixels[outIdx + 1] = pixels[srcIdx + 1];
                    outPixels[outIdx + 2] = pixels[srcIdx + 2];
                    outPixels[outIdx + 3] = (byte)alpha;
                }
            }

            using (var output = new Bitmap(cropWidth, cropHeight, PixelFormat.Format32bppArgb))
            {
                var outRect = new Rectangle(0, 0, cropWidth, cropHeight);
                var outData = output.LockBits(outRect, ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
                Marshal.Copy(outPixels, 0, outData.Scan0, outPixels.Length);
                output.UnlockBits(outData);
                output.Save(outputPath, ImageFormat.Png);
            }
        }
    }
}
"@

Add-Type -TypeDefinition $source -ReferencedAssemblies System.Drawing

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
    [ShoeCutout]::ExportCutout($_.FullName, $outputPath)
    Write-Output "DONE`t$sku`t$($_.Name)"
  }
}
