param([switch]$NoBrowser)

$ErrorActionPreference = 'Stop'
$VorykiDirectory = $PSScriptRoot
$VorykiUrl = 'http://127.0.0.1:8771/'

function Get-VorykiServerStatus {
    try {
        $VorykiResponse = Invoke-WebRequest -Uri $VorykiUrl -UseBasicParsing -TimeoutSec 2
        if ($VorykiResponse.Content -match '<title>Voryki' -and
            $VorykiResponse.Content -match 'id="playButton"' -and
            $VorykiResponse.Content -match 'src="game.js"') {
            return 'voryki'
        }
        return 'other'
    }
    catch {
        $VorykiClient = New-Object System.Net.Sockets.TcpClient
        try {
            $VorykiConnect = $VorykiClient.BeginConnect('127.0.0.1', 8771, $null, $null)
            if ($VorykiConnect.AsyncWaitHandle.WaitOne(500) -and $VorykiClient.Connected) {
                $VorykiClient.EndConnect($VorykiConnect)
                return 'other'
            }
            return 'none'
        }
        catch { return 'none' }
        finally { $VorykiClient.Dispose() }
    }
}

try {
    if (-not (Test-Path -LiteralPath (Join-Path $VorykiDirectory 'index.html'))) {
        throw 'Khong thay index.html. Hay giu launcher trong thu muc game goc.'
    }

    $VorykiStatus = Get-VorykiServerStatus
    if ($VorykiStatus -eq 'other') {
        throw 'Cong 8771 dang duoc ung dung khac su dung. Launcher khong dung ung dung do. Hay dong dich vu o cong nay roi thu lai.'
    }
    if ($VorykiStatus -eq 'none') {
        $VorykiPythonCandidates = @(
            (Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe')
        )
        foreach ($VorykiCommand in @('python.exe', 'python3.exe')) {
            $VorykiFound = Get-Command $VorykiCommand -ErrorAction SilentlyContinue
            if ($VorykiFound -and $VorykiFound.Source -notmatch '\\WindowsApps\\') {
                $VorykiPythonCandidates += $VorykiFound.Source
            }
        }
        $VorykiPython = $null
        foreach ($VorykiCandidate in ($VorykiPythonCandidates | Select-Object -Unique)) {
            if (Test-Path -LiteralPath $VorykiCandidate -PathType Leaf) {
                $VorykiPython = $VorykiCandidate
                break
            }
        }
        $VorykiArguments = @('-m', 'http.server', '8771', '--bind', '127.0.0.1')
        if (-not $VorykiPython) {
            $VorykiPyLauncher = Get-Command 'py.exe' -ErrorAction SilentlyContinue
            if ($VorykiPyLauncher) {
                $VorykiPython = $VorykiPyLauncher.Source
                $VorykiArguments = @('-3') + $VorykiArguments
            }
        }
        if (-not $VorykiPython) {
            throw 'Chua tim thay Python. Can Python 3 hoac runtime Python cua Codex de mo game. Cai Python 3, giu nguyen thu muc game va chay launch.bat lai.'
        }

        $VorykiProcess = Start-Process -FilePath $VorykiPython -ArgumentList $VorykiArguments `
            -WorkingDirectory $VorykiDirectory -WindowStyle Hidden -PassThru `
            -RedirectStandardOutput (Join-Path $VorykiDirectory 'server.log') `
            -RedirectStandardError (Join-Path $VorykiDirectory 'server-error.log')
        for ($VorykiAttempt = 0; $VorykiAttempt -lt 30; $VorykiAttempt++) {
            Start-Sleep -Milliseconds 150
            $VorykiStatus = Get-VorykiServerStatus
            if ($VorykiStatus -eq 'voryki') { break }
            if ($VorykiProcess.HasExited -or $VorykiStatus -eq 'other') { break }
        }
        if ($VorykiStatus -ne 'voryki') {
            throw 'May chu chua mo duoc. Xem server-error.log trong thu muc game de biet chi tiet. Launcher khong dung bat ky tien trinh nao.'
        }
    }

    Write-Host "Voryki san sang: $VorykiUrl" -ForegroundColor Green
    Write-Host 'Luu game tai cung dia chi va cung trinh duyet. Esc > Xuat ban luu de sao luu.'
    if (-not $NoBrowser) { Start-Process -FilePath $VorykiUrl }
    exit 0
}
catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
