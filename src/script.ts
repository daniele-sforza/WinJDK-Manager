export const BATCH_SCRIPT = `@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0jdk.ps1" %*
`;

export const POWERSHELL_SCRIPT = `<#
.SYNOPSIS
    WinJDK Manager (jdk.ps1)
.DESCRIPTION
    A PowerShell CLI tool to download, list, switch, link, and delete JDK versions on Windows.
    Supports multiple JDK providers (Temurin, Corretto, Zulu, Microsoft, OpenJDK).
.EXAMPLE
    jdk list
    jdk install 21 temurin
    jdk use 21
    jdk link 11 C:\\my\\custom\\jdk
    jdk update 21
    jdk remove 17
#>

param (
    [Parameter(Position=0)]
    [string]$Command = 'help',

    [Parameter(Position=1)]
    [string]$Version,

    [Parameter(Position=2)]
    [string]$ProviderOrPath,

    [Parameter(Position=3)]
    [string]$Param3,

    [Parameter(Position=4)]
    [string]$Param4
)

$ErrorActionPreference = 'Stop'
$JdkDir = Join-Path $env:USERPROFILE ".jdk"

# Ensure JDK directory exists
if (-not (Test-Path $JdkDir)) {
    New-Item -ItemType Directory -Path $JdkDir | Out-Null
}

# Auto-detect native platform architecture of the host
$DetectedArch = 'x64'
if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64' -or $env:PROCESSOR_ARCHITEW6432 -eq 'ARM64') {
    $DetectedArch = 'arm64'
} else {
    try {
        $ProcArch = Get-CimInstance Win32_Processor -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Architecture -First 1
        if ($ProcArch -eq 12) {
            $DetectedArch = 'arm64'
        }
    } catch {}
}

# Parse parameters based on command type for 100% legacy compatibility
$Architecture = $null
$EnvScope = 'System'

if ($Command -eq 'use') {
    # Legacy: jdk use <version> [provider] [scope]
    if ($Param3) {
        if ($Param3 -eq 'System' -or $Param3 -eq 'User') {
            $EnvScope = $Param3
        } else {
            Write-Color "Error: Scope must be 'System' or 'User'" Red
            exit 1
        }
    }
} elseif ($Command -eq 'install' -or $Command -eq 'update') {
    # Usage: jdk install <version> [provider] [architecture]
    if ($Param3) {
        if ($Param3.ToLower() -eq 'x64' -or $Param3.ToLower() -eq 'arm64') {
            $Architecture = $Param3.ToLower()
        } else {
            Write-Color "Error: Architecture must be 'x64' or 'arm64'" Red
            exit 1
        }
    }
}

# Distinguish if the second parameter is architecture or provider name
$Provider = 'temurin'
if ($ProviderOrPath) {
    if ($ProviderOrPath.ToLower() -eq 'x64' -or $ProviderOrPath.ToLower() -eq 'arm64') {
        $Architecture = $ProviderOrPath.ToLower()
    } else {
        $Provider = $ProviderOrPath.ToLower()
    }
}

# Fallback to detected native platform if not specified
if (-not $Architecture) {
    $Architecture = $DetectedArch
}

function Write-Color {
    param([string]$Text, [ConsoleColor]$Color)
    Write-Host $Text -ForegroundColor $Color
}

function Get-InstalledJDKs {
    if (Test-Path $JdkDir) {
        Get-ChildItem -Path $JdkDir -Directory | Select-Object Name, FullName
    }
}

function Test-JdkMatch {
    param(
        [string]$Name,
        [string]$Version,
        [string]$ProviderOrPath
    )

    $Parts = $Name.Split('-')
    if ($Parts.Count -lt 2) { return $false }
    
    $ItemProvider = $Parts[0]
    $ItemVersion = $Parts[1]
    $ItemArch = if ($Parts.Count -gt 2) { $Parts[2] } else { $null }

    if ($ItemVersion -ne $Version) {
        return $false
    }

    if (-not $ProviderOrPath) {
        return $true
    }

    $ProviderOrPathLower = $ProviderOrPath.ToLower()

    if ($Name.ToLower() -eq $ProviderOrPathLower) {
        return $true
    }

    if ($ProviderOrPathLower.Contains('-')) {
        $SearchParts = $ProviderOrPathLower.Split('-')
        $SearchProv = $SearchParts[0]
        $SearchArch = $SearchParts[1]

        if ($ItemProvider -eq $SearchProv -and $ItemArch -eq $SearchArch) {
            return $true
        }
    }

    if ($ItemProvider -eq $ProviderOrPathLower) {
        return $true
    }

    if ($ItemArch -and ($ItemArch -eq $ProviderOrPathLower)) {
        return $true
    }

    if ($Name -match [regex]::Escape($ProviderOrPathLower)) {
        return $true
    }

    return $false
}

function Set-JavaHome {
    param([string]$Path, [string]$Scope)
    
    $TargetScope = if ($Scope -eq 'User') { 'User' } else { 'Machine' }

    try {
        # Update JAVA_HOME
        [Environment]::SetEnvironmentVariable("JAVA_HOME", $Path, $TargetScope)
        
        # Update PATH
        $SystemPath = [Environment]::GetEnvironmentVariable("PATH", $TargetScope)
        if ($null -eq $SystemPath) { $SystemPath = "" }
        
        # Remove old JDK paths from PATH
        $Paths = $SystemPath -split ";" | Where-Object { $_ -notlike "*\\.jdk\\*" -and $_ -ne "" }
        
        # Add new JDK bin to PATH
        $NewPath = "$Path\\bin;" + ($Paths -join ";")
        [Environment]::SetEnvironmentVariable("PATH", $NewPath, $TargetScope)
        
        # Update current session
        $env:JAVA_HOME = $Path
        $env:PATH = "$Path\\bin;" + (($env:PATH -split ";" | Where-Object { $_ -notlike "*\\.jdk\\*" -and $_ -ne "" }) -join ";")
        
        Write-Color "Successfully switched to JDK at $Path (Scope: $Scope)" Green
    } catch [System.Security.SecurityException] {
        Write-Color "Error: Access denied. Modifying System environment variables requires Administrator privileges." Red
        Write-Color "Please run this command in an elevated terminal (Run as Administrator), or use the 'User' scope:" Yellow
        Write-Color "  jdk use <version> [provider] User" Yellow
        exit 1
    } catch {
        Write-Color "An unexpected error occurred while setting environment variables: $_" Red
        exit 1
    }
}

function Verify-Checksum {
    param([string]$FilePath, [string]$ExpectedHash, [string]$Algorithm = "SHA256")
    if (-not $ExpectedHash) {
        Write-Color "Warning: No checksum provided for verification." Yellow
        return $true
    }
    Write-Color "Verifying $Algorithm checksum..." Cyan
    $ActualHash = (Get-FileHash -Path $FilePath -Algorithm $Algorithm).Hash
    if ($ActualHash -eq $ExpectedHash) {
        Write-Color "Checksum verified successfully." Green
        return $true
    } else {
        Write-Color "Error: Checksum mismatch!" Red
        Write-Color "Expected: $ExpectedHash" Red
        Write-Color "Actual:   $ActualHash" Red
        return $false
    }
}

function Install-Temurin {
    param([string]$Ver, [string]$Arch)
    $ApiArch = if ($Arch -eq 'arm64') { 'aarch64' } else { 'x64' }
    $ApiUrl = "https://api.adoptium.net/v3/assets/feature_releases/$Ver/ga?architecture=$ApiArch&heap_size=normal&image_type=jdk&jvm_impl=hotspot&os=windows"
    
    try {
        $Response = Invoke-RestMethod -Uri $ApiUrl -ErrorAction Stop
        $Asset = $Response | Select-Object -ExpandProperty binaries | Where-Object { $_.package.name -match "\\.zip$" } | Select-Object -First 1
        
        if ($Asset) {
            $DownloadUrl = $Asset.package.link
            $ExpectedChecksum = $Asset.package.checksum
            $FileName = $Asset.package.name
            $ZipPath = Join-Path $JdkDir $FileName
            $ExtractDir = Join-Path $JdkDir "temurin-$Ver-$Arch"
            
            Write-Color "Downloading Temurin $Ver ($Arch) from $DownloadUrl..." Cyan
            Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipPath
            
            if (-not (Verify-Checksum -FilePath $ZipPath -ExpectedHash $ExpectedChecksum -Algorithm "SHA256")) {
                Remove-Item $ZipPath -Force
                exit 1
            }
            
            Write-Color "Extracting archive..." Cyan
            if (Test-Path $ExtractDir) { Remove-Item -Path $ExtractDir -Recurse -Force }
            Expand-Archive -Path $ZipPath -DestinationPath $ExtractDir -Force
            Remove-Item $ZipPath
            
            Write-Color "Installed Temurin $Ver ($Arch) to $ExtractDir" Green
        } else {
            Write-Color "Could not find a ZIP package for Temurin $Ver ($Arch)" Red
        }
    } catch {
        Write-Color "Failed to fetch Temurin $Ver ($Arch). Ensure the version and architecture exist." Red
    }
}

function Install-Corretto {
    param([string]$Ver, [string]$Arch)
    $ApiArch = if ($Arch -eq 'arm64') { 'aarch64' } else { 'x64' }
    
    # Amazon Corretto URL pattern
    $DownloadUrl = "https://corretto.aws/downloads/latest/amazon-corretto-$Ver-$ApiArch-windows-jdk.zip"
    $ChecksumUrl = "https://corretto.aws/downloads/latest_checksum/amazon-corretto-$Ver-$ApiArch-windows-jdk.zip"
    $ZipPath = Join-Path $JdkDir "corretto-$Ver-$Arch.zip"
    $ExtractDir = Join-Path $JdkDir "corretto-$Ver-$Arch"
    
    try {
        $ExpectedChecksum = ""
        try {
            $ExpectedChecksum = (Invoke-RestMethod -Uri $ChecksumUrl -ErrorAction Stop).Trim()
        } catch {
            Write-Color "Warning: Could not fetch checksum for Corretto $Ver ($Arch)." Yellow
        }

        Write-Color "Downloading Corretto $Ver ($Arch) from $DownloadUrl..." Cyan
        Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipPath
        
        if ($ExpectedChecksum) {
            $Algorithm = if ($ExpectedChecksum.Length -eq 32) { "MD5" } else { "SHA256" }
            if (-not (Verify-Checksum -FilePath $ZipPath -ExpectedHash $ExpectedChecksum -Algorithm $Algorithm)) {
                Remove-Item $ZipPath -Force
                exit 1
            }
        }

        Write-Color "Extracting archive..." Cyan
        if (Test-Path $ExtractDir) { Remove-Item -Path $ExtractDir -Recurse -Force }
        Expand-Archive -Path $ZipPath -DestinationPath $ExtractDir -Force
        Remove-Item $ZipPath
        
        Write-Color "Installed Corretto $Ver ($Arch) to $ExtractDir" Green
    } catch {
        Write-Color "Failed to fetch Corretto $Ver ($Arch). Ensure the version and architecture exist." Red
        if (Test-Path $ZipPath) { Remove-Item $ZipPath }
    }
}

function Install-Zulu {
    param([string]$Ver, [string]$Arch)
    $ApiArch = if ($Arch -eq 'arm64') { 'arm' } else { 'x86' }
    
    # Azul Zulu API
    $ApiUrl = "https://api.azul.com/metadata/v1/zulu/packages/?java_version=$Ver&os=windows&arch=$ApiArch&hw_bitness=64&ext=zip&archive_type=zip&java_package_type=jdk&latest=true"
    
    try {
        $Response = Invoke-RestMethod -Uri $ApiUrl -ErrorAction Stop
        if ($Response.Count -gt 0) {
            $DownloadUrl = $Response[0].download_url
            $ExpectedChecksum = $Response[0].sha256_hash
            $ZipPath = Join-Path $JdkDir "zulu-$Ver-$Arch.zip"
            $ExtractDir = Join-Path $JdkDir "zulu-$Ver-$Arch"
            
            Write-Color "Downloading Zulu $Ver ($Arch) from $DownloadUrl..." Cyan
            Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipPath
            
            if (-not (Verify-Checksum -FilePath $ZipPath -ExpectedHash $ExpectedChecksum -Algorithm "SHA256")) {
                Remove-Item $ZipPath -Force
                exit 1
            }

            Write-Color "Extracting archive..." Cyan
            if (Test-Path $ExtractDir) { Remove-Item -Path $ExtractDir -Recurse -Force }
            Expand-Archive -Path $ZipPath -DestinationPath $ExtractDir -Force
            Remove-Item $ZipPath
            
            Write-Color "Installed Zulu $Ver ($Arch) to $ExtractDir" Green
        } else {
            Write-Color "Could not find a ZIP package for Zulu $Ver ($Arch)" Red
        }
    } catch {
        Write-Color "Failed to fetch Zulu $Ver ($Arch). Ensure the version and architecture exist." Red
    }
}

function Install-Microsoft {
    param([string]$Ver, [string]$Arch)
    $ApiArch = if ($Arch -eq 'arm64') { 'aarch64' } else { 'x64' }
    
    # Microsoft Build of OpenJDK
    $ApiUrl = "https://aka.ms/download-jdk/microsoft-jdk-$Ver-windows-$ApiArch.zip"
    $ChecksumUrl = "https://aka.ms/download-jdk/microsoft-jdk-$Ver-windows-$ApiArch.zip.sha256sum.txt"
    $ZipPath = Join-Path $JdkDir "microsoft-$Ver-$Arch.zip"
    $ExtractDir = Join-Path $JdkDir "microsoft-$Ver-$Arch"
    
    try {
        $ExpectedChecksum = ""
        try {
            $ChecksumText = (Invoke-RestMethod -Uri $ChecksumUrl -ErrorAction Stop)
            $ExpectedChecksum = $ChecksumText.Split(' ')[0].Trim()
        } catch {
            Write-Color "Warning: Could not fetch checksum for Microsoft JDK $Ver ($Arch)." Yellow
        }

        Write-Color "Downloading Microsoft JDK $Ver ($Arch) from $ApiUrl..." Cyan
        Invoke-WebRequest -Uri $ApiUrl -OutFile $ZipPath
        
        if ($ExpectedChecksum) {
            if (-not (Verify-Checksum -FilePath $ZipPath -ExpectedHash $ExpectedChecksum -Algorithm "SHA256")) {
                Remove-Item $ZipPath -Force
                exit 1
            }
        }

        Write-Color "Extracting archive..." Cyan
        if (Test-Path $ExtractDir) { Remove-Item -Path $ExtractDir -Recurse -Force }
        Expand-Archive -Path $ZipPath -DestinationPath $ExtractDir -Force
        Remove-Item $ZipPath
        
        Write-Color "Installed Microsoft JDK $Ver ($Arch) to $ExtractDir" Green
    } catch {
        Write-Color "Failed to fetch Microsoft JDK $Ver ($Arch). Ensure the version and architecture exist." Red
        if (Test-Path $ZipPath) { Remove-Item $ZipPath }
    }
}

function Install-OpenJDK {
    param([string]$Ver, [string]$Arch)
    $ApiArch = if ($Arch -eq 'arm64') { 'aarch64' } else { 'x64' }
    
    # Official OpenJDK via Foojay Disco API
    $ApiUrl = "https://api.foojay.io/disco/v3.0/packages/jdks?version=$Ver&operating_system=windows&architecture=$ApiArch&archive_type=zip&distribution=oracle_open_jdk&latest=per_update"
    
    try {
        $Response = Invoke-RestMethod -Uri $ApiUrl -ErrorAction Stop
        if ($Response.result.Count -gt 0) {
            $DownloadUrl = $Response.result[0].links.pkg_download_redirect
            $InfoUrl = $Response.result[0].links.pkg_info_uri
            $ZipPath = Join-Path $JdkDir "openjdk-$Ver-$Arch.zip"
            $ExtractDir = Join-Path $JdkDir "openjdk-$Ver-$Arch"
            
            $ExpectedChecksum = ""
            try {
                $InfoResponse = Invoke-RestMethod -Uri $InfoUrl -ErrorAction Stop
                $ChecksumUrl = $InfoResponse.result[0].checksum_uri
                if ($ChecksumUrl) {
                    $ExpectedChecksum = (Invoke-RestMethod -Uri $ChecksumUrl -ErrorAction Stop).Trim()
                }
            } catch {
                Write-Color "Warning: Could not fetch checksum for OpenJDK $Ver ($Arch)." Yellow
            }

            Write-Color "Downloading OpenJDK $Ver ($Arch) from $DownloadUrl..." Cyan
            Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipPath
            
            if ($ExpectedChecksum) {
                if (-not (Verify-Checksum -FilePath $ZipPath -ExpectedHash $ExpectedChecksum -Algorithm "SHA256")) {
                    Remove-Item $ZipPath -Force
                    exit 1
                }
            }

            Write-Color "Extracting archive..." Cyan
            if (Test-Path $ExtractDir) { Remove-Item -Path $ExtractDir -Recurse -Force }
            Expand-Archive -Path $ZipPath -DestinationPath $ExtractDir -Force
            Remove-Item $ZipPath
            
            Write-Color "Installed OpenJDK $Ver ($Arch) to $ExtractDir" Green
        } else {
            Write-Color "Could not find a ZIP package for OpenJDK $Ver ($Arch)" Red
        }
    } catch {
        Write-Color "Failed to fetch OpenJDK $Ver ($Arch). Ensure the version exists." Red
    }
}

switch ($Command) {
    'list' {
        Write-Color "Installed JDKs in \${JdkDir}:" Cyan
        $Installed = Get-InstalledJDKs
        if ($Installed) {
            foreach ($jdk in $Installed) {
                $ActiveJavaHome = [Environment]::GetEnvironmentVariable("JAVA_HOME", "User")
                if (-not $ActiveJavaHome) {
                    $ActiveJavaHome = [Environment]::GetEnvironmentVariable("JAVA_HOME", "Machine")
                }
                if (-not $ActiveJavaHome) {
                    $ActiveJavaHome = $env:JAVA_HOME
                }
                
                $IsActive = ($ActiveJavaHome -ne $null) -and ($ActiveJavaHome.StartsWith($jdk.FullName))
                if ($IsActive) {
                    Write-Color "  * $($jdk.Name) (Active)" Green
                } else {
                    Write-Host "    $($jdk.Name)"
                }
            }
        } else {
            Write-Host "  No JDKs installed."
        }
    }
    
    'install' {
        if (-not $Version) {
            Write-Color "Error: Version is required for install." Red
            exit 1
        }
        
        switch ($Provider) {
            'temurin' { Install-Temurin $Version $Architecture }
            'corretto' { Install-Corretto $Version $Architecture }
            'zulu' { Install-Zulu $Version $Architecture }
            'microsoft' { Install-Microsoft $Version $Architecture }
            'openjdk' { Install-OpenJDK $Version $Architecture }
            default { Write-Color "Unknown provider: $Provider. Supported: temurin, corretto, zulu, microsoft, openjdk" Red }
        }
    }
    
    'use' {
        if (-not $Version) {
            Write-Color "Error: Version is required for use." Red
            exit 1
        }
        
        $Targets = @(Get-InstalledJDKs | Where-Object { Test-JdkMatch -Name $_.Name -Version $Version -ProviderOrPath $ProviderOrPath })
        
        if ($Targets.Count -gt 1) {
            Write-Color "Multiple JDKs found for version $Version. Please specify a provider or architecture:" Yellow
            $Targets | ForEach-Object { 
                $Parts = $_.Name.Split('-')
                $Prov = $Parts[0]
                $Arch = if ($Parts.Count -gt 2) { $Parts[2] } else { "" }
                if ($Arch) {
                    Write-Host "  jdk use $Version $Prov-$Arch"
                } else {
                    Write-Host "  jdk use $Version $Prov"
                }
            }
            exit 1
        } elseif ($Targets.Count -eq 1) {
            $Target = $Targets[0]
            # Find the actual home directory (where bin\\javac.exe lives)
            $Javac = Get-ChildItem -Path $Target.FullName -Recurse -Filter "javac.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($Javac) {
                Set-JavaHome -Path $Javac.Directory.Parent.FullName -Scope $EnvScope
            } else {
                Write-Color "Could not find bin\\javac.exe in $($Target.FullName). Is it a valid JDK?" Red
            }
        } else {
            Write-Color "JDK matching '$Version' $(if($ProviderOrPath){"and provider/arch '$ProviderOrPath' "})not found. Use 'jdk list' to see installed versions." Red
        }
    }
    
    'remove' {
        if (-not $Version) {
            Write-Color "Error: Version is required for remove." Red
            exit 1
        }
        
        $Targets = @(Get-InstalledJDKs | Where-Object { Test-JdkMatch -Name $_.Name -Version $Version -ProviderOrPath $ProviderOrPath })
        
        if ($Targets.Count -gt 1) {
            Write-Color "Multiple JDKs found for version $Version. Please specify a provider or architecture:" Yellow
            $Targets | ForEach-Object { 
                $Parts = $_.Name.Split('-')
                $Prov = $Parts[0]
                $Arch = if ($Parts.Count -gt 2) { $Parts[2] } else { "" }
                if ($Arch) {
                    Write-Host "  jdk remove $Version $Prov-$Arch"
                } else {
                    Write-Host "  jdk remove $Version $Prov"
                }
            }
            exit 1
        } elseif ($Targets.Count -eq 1) {
            $Target = $Targets[0]
            $Confirm = Read-Host "Are you sure you want to remove $($Target.Name)? (y/N)"
            if ($Confirm -match "^y") {
                Remove-Item -Path $Target.FullName -Recurse -Force
                Write-Color "Removed $($Target.Name)" Green
            } else {
                Write-Host "Aborted."
            }
        } else {
            Write-Color "JDK matching '$Version' $(if($ProviderOrPath){"and provider/arch '$ProviderOrPath' "})not found." Red
        }
    }
    
    'link' {
        if (-not $Version -or -not $ProviderOrPath) {
            Write-Color "Error: Version and Path are required for link." Red
            Write-Host "Usage: jdk link <version> <path>"
            exit 1
        }
        
        if (-not (Test-Path $ProviderOrPath)) {
            Write-Color "Error: Path '$ProviderOrPath' does not exist." Red
            exit 1
        }
        
        $LinkPath = Join-Path $JdkDir "linked-$Version"
        if (Test-Path $LinkPath) {
            Remove-Item -Path $LinkPath -Force -Recurse
        }
        
        New-Item -ItemType Junction -Path $LinkPath -Target $ProviderOrPath | Out-Null
        Write-Color "Linked version $Version to $ProviderOrPath" Green
    }
    
    'update' {
        if (-not $Version) {
            Write-Color "Error: Version is required for update." Red
            exit 1
        }
        
        $Targets = @(Get-InstalledJDKs | Where-Object { Test-JdkMatch -Name $_.Name -Version $Version -ProviderOrPath $ProviderOrPath })
        
        if ($Targets.Count -eq 0) {
            Write-Color "JDK matching '$Version' $(if($ProviderOrPath){"and provider/arch '$ProviderOrPath' "})not found. Cannot update." Red
            exit 1
        }
        
        if ($Targets.Count -gt 1) {
            Write-Color "Multiple JDKs found for version $Version. Please specify a provider or architecture:" Yellow
            $Targets | ForEach-Object { 
                $Parts = $_.Name.Split('-')
                $Prov = $Parts[0]
                $Arch = if ($Parts.Count -gt 2) { $Parts[2] } else { "" }
                if ($Arch) {
                    Write-Host "  jdk update $Version $Prov-$Arch"
                } else {
                    Write-Host "  jdk update $Version $Prov"
                }
            }
            exit 1
        } elseif ($Targets.Count -eq 1) {
            $Target = $Targets[0]
            $Parts = $Target.Name.Split('-')
            $Provider = $Parts[0]
            $Arch = if ($Parts.Count -gt 2) { $Parts[2] } else { $Architecture }
            
            if ($Provider -eq 'linked') {
                Write-Color "Cannot update a linked JDK." Red
                exit 1
            }
            
            Write-Color "Found existing $Provider $Version ($Arch). Reinstalling to fetch the latest patch..." Cyan
            Remove-Item -Path $Target.FullName -Recurse -Force
            
            switch ($Provider) {
                'temurin' { Install-Temurin $Version $Arch }
                'corretto' { Install-Corretto $Version $Arch }
                'zulu' { Install-Zulu $Version $Arch }
                'microsoft' { Install-Microsoft $Version $Arch }
                'openjdk' { Install-OpenJDK $Version $Arch }
            }
        }
    }
    
    'help' {
        Write-Host "WinJDK Manager - Usage" -ForegroundColor Cyan
        Write-Host "----------------------"
        Write-Host "jdk list                                 - List installed JDKs"
        Write-Host "jdk install <version> [provider] [arch]  - Install a JDK (Providers: temurin, corretto, zulu, microsoft, openjdk)"
        Write-Host "                                           (Arch: x64, arm64; default: detected platform)"
        Write-Host "jdk use <version> [provider] [scope]     - Set JAVA_HOME and PATH (Scope: System or User, default: System)"
        Write-Host "jdk link <version> <path>                - Link an existing JDK directory"
        Write-Host "jdk update <version> [provider]          - Reinstall a JDK to get the latest patch"
        Write-Host "jdk remove <version> [provider]          - Delete an installed JDK"
        Write-Host ""
        Write-Host "Examples:"
        Write-Host "  jdk install 21 temurin arm64"
        Write-Host "  jdk install 17 openjdk x64"
        Write-Host "  jdk install 21 arm64"
        Write-Host "  jdk link 8 C:\\Program Files\\Java\\jdk1.8.0_202"
        Write-Host "  jdk use 21"
        Write-Host "  jdk use 21 corretto-arm64"
        Write-Host "  jdk use 21 temurin User"
        Write-Host "  jdk update 21 temurin"
        Write-Host "  jdk remove 17 openjdk"
    }
}
`;
