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
    [ValidateSet('list', 'install', 'use', 'remove', 'link', 'update', 'help')]
    [string]$Command = 'help',

    [Parameter(Position=1)]
    [string]$Version,

    [Parameter(Position=2)]
    [string]$ProviderOrPath,

    [Parameter(Position=3)]
    [ValidateSet('System', 'User')]
    [string]$EnvScope = 'System'
)

$ErrorActionPreference = 'Stop'
$JdkDir = Join-Path $env:USERPROFILE ".jdk"

# Ensure JDK directory exists
if (-not (Test-Path $JdkDir)) {
    New-Item -ItemType Directory -Path $JdkDir | Out-Null
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

function Install-Temurin {
    param([string]$Ver)
    $ApiUrl = "https://api.adoptium.net/v3/assets/feature_releases/$Ver/ga?architecture=x64&heap_size=normal&image_type=jdk&jvm_impl=hotspot&os=windows"
    
    try {
        $Response = Invoke-RestMethod -Uri $ApiUrl -ErrorAction Stop
        $Asset = $Response | Select-Object -ExpandProperty binaries | Where-Object { $_.package.name -match "\\.zip$" } | Select-Object -First 1
        
        if ($Asset) {
            $DownloadUrl = $Asset.package.link
            $FileName = $Asset.package.name
            $ZipPath = Join-Path $JdkDir $FileName
            $ExtractDir = Join-Path $JdkDir "temurin-$Ver"
            
            Write-Color "Downloading Temurin $Ver from $DownloadUrl..." Cyan
            Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipPath
            
            Write-Color "Extracting archive..." Cyan
            if (Test-Path $ExtractDir) { Remove-Item -Path $ExtractDir -Recurse -Force }
            Expand-Archive -Path $ZipPath -DestinationPath $ExtractDir -Force
            Remove-Item $ZipPath
            
            Write-Color "Installed Temurin $Ver to $ExtractDir" Green
        } else {
            Write-Color "Could not find a ZIP package for Temurin $Ver" Red
        }
    } catch {
        Write-Color "Failed to fetch Temurin $Ver. Ensure the version exists." Red
    }
}

function Install-Corretto {
    param([string]$Ver)
    # Amazon Corretto URL pattern
    $DownloadUrl = "https://corretto.aws/downloads/latest/amazon-corretto-$Ver-x64-windows-jdk.zip"
    $ZipPath = Join-Path $JdkDir "corretto-$Ver.zip"
    $ExtractDir = Join-Path $JdkDir "corretto-$Ver"
    
    try {
        Write-Color "Downloading Corretto $Ver from $DownloadUrl..." Cyan
        Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipPath
        
        Write-Color "Extracting archive..." Cyan
        if (Test-Path $ExtractDir) { Remove-Item -Path $ExtractDir -Recurse -Force }
        Expand-Archive -Path $ZipPath -DestinationPath $ExtractDir -Force
        Remove-Item $ZipPath
        
        Write-Color "Installed Corretto $Ver to $ExtractDir" Green
    } catch {
        Write-Color "Failed to fetch Corretto $Ver. Ensure the version exists." Red
        if (Test-Path $ZipPath) { Remove-Item $ZipPath }
    }
}

function Install-Zulu {
    param([string]$Ver)
    # Azul Zulu API
    $ApiUrl = "https://api.azul.com/metadata/v1/zulu/packages/?java_version=$Ver&os=windows&arch=x86&hw_bitness=64&ext=zip&archive_type=zip&java_package_type=jdk&latest=true"
    
    try {
        $Response = Invoke-RestMethod -Uri $ApiUrl -ErrorAction Stop
        if ($Response.Count -gt 0) {
            $DownloadUrl = $Response[0].download_url
            $ZipPath = Join-Path $JdkDir "zulu-$Ver.zip"
            $ExtractDir = Join-Path $JdkDir "zulu-$Ver"
            
            Write-Color "Downloading Zulu $Ver from $DownloadUrl..." Cyan
            Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipPath
            
            Write-Color "Extracting archive..." Cyan
            if (Test-Path $ExtractDir) { Remove-Item -Path $ExtractDir -Recurse -Force }
            Expand-Archive -Path $ZipPath -DestinationPath $ExtractDir -Force
            Remove-Item $ZipPath
            
            Write-Color "Installed Zulu $Ver to $ExtractDir" Green
        } else {
            Write-Color "Could not find a ZIP package for Zulu $Ver" Red
        }
    } catch {
        Write-Color "Failed to fetch Zulu $Ver. Ensure the version exists." Red
    }
}

function Install-Microsoft {
    param([string]$Ver)
    # Microsoft Build of OpenJDK
    $ApiUrl = "https://aka.ms/download-jdk/microsoft-jdk-$Ver-windows-x64.zip"
    $ZipPath = Join-Path $JdkDir "microsoft-$Ver.zip"
    $ExtractDir = Join-Path $JdkDir "microsoft-$Ver"
    
    try {
        Write-Color "Downloading Microsoft JDK $Ver from $ApiUrl..." Cyan
        Invoke-WebRequest -Uri $ApiUrl -OutFile $ZipPath
        
        Write-Color "Extracting archive..." Cyan
        if (Test-Path $ExtractDir) { Remove-Item -Path $ExtractDir -Recurse -Force }
        Expand-Archive -Path $ZipPath -DestinationPath $ExtractDir -Force
        Remove-Item $ZipPath
        
        Write-Color "Installed Microsoft JDK $Ver to $ExtractDir" Green
    } catch {
        Write-Color "Failed to fetch Microsoft JDK $Ver. Ensure the version exists." Red
        if (Test-Path $ZipPath) { Remove-Item $ZipPath }
    }
}

function Install-OpenJDK {
    param([string]$Ver)
    # Official OpenJDK via Foojay Disco API
    $ApiUrl = "https://api.foojay.io/disco/v3.0/packages/jdks?version=$Ver&operating_system=windows&architecture=x64&archive_type=zip&distribution=oracle_open_jdk&latest=per_update"
    
    try {
        $Response = Invoke-RestMethod -Uri $ApiUrl -ErrorAction Stop
        if ($Response.result.Count -gt 0) {
            $DownloadUrl = $Response.result[0].links.pkg_download_redirect
            $ZipPath = Join-Path $JdkDir "openjdk-$Ver.zip"
            $ExtractDir = Join-Path $JdkDir "openjdk-$Ver"
            
            Write-Color "Downloading OpenJDK $Ver from $DownloadUrl..." Cyan
            Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipPath
            
            Write-Color "Extracting archive..." Cyan
            if (Test-Path $ExtractDir) { Remove-Item -Path $ExtractDir -Recurse -Force }
            Expand-Archive -Path $ZipPath -DestinationPath $ExtractDir -Force
            Remove-Item $ZipPath
            
            Write-Color "Installed OpenJDK $Ver to $ExtractDir" Green
        } else {
            Write-Color "Could not find a ZIP package for OpenJDK $Ver" Red
        }
    } catch {
        Write-Color "Failed to fetch OpenJDK $Ver. Ensure the version exists." Red
    }
}

switch ($Command) {
    'list' {
        Write-Color "Installed JDKs in \${JdkDir}:" Cyan
        $Installed = Get-InstalledJDKs
        if ($Installed) {
            foreach ($jdk in $Installed) {
                $IsActive = ($env:JAVA_HOME -ne $null) -and ($env:JAVA_HOME.StartsWith($jdk.FullName))
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
        
        $Provider = if ($ProviderOrPath) { $ProviderOrPath.ToLower() } else { 'temurin' }
        switch ($Provider) {
            'temurin' { Install-Temurin $Version }
            'corretto' { Install-Corretto $Version }
            'zulu' { Install-Zulu $Version }
            'microsoft' { Install-Microsoft $Version }
            'openjdk' { Install-OpenJDK $Version }
            default { Write-Color "Unknown provider: $Provider. Supported: temurin, corretto, zulu, microsoft, openjdk" Red }
        }
    }
    
    'use' {
        if (-not $Version) {
            Write-Color "Error: Version is required for use." Red
            exit 1
        }
        
        $Targets = @(Get-InstalledJDKs | Where-Object { $_.Name -match "-$Version$" -or $_.Name -match "-$Version\b" })
        if ($ProviderOrPath) {
            $Targets = @($Targets | Where-Object { $_.Name -match "^$ProviderOrPath-" })
        }
        
        if ($Targets.Count -gt 1) {
            Write-Color "Multiple JDKs found for version $Version. Please specify a provider:" Yellow
            $Targets | ForEach-Object { Write-Host "  jdk use $Version $($_.Name.Split('-')[0])" }
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
            Write-Color "JDK matching '$Version' $(if($ProviderOrPath){"and provider '$ProviderOrPath' "})not found. Use 'jdk list' to see installed versions." Red
        }
    }
    
    'remove' {
        if (-not $Version) {
            Write-Color "Error: Version is required for remove." Red
            exit 1
        }
        
        $Targets = @(Get-InstalledJDKs | Where-Object { $_.Name -match "-$Version$" -or $_.Name -match "-$Version\b" })
        if ($ProviderOrPath) {
            $Targets = @($Targets | Where-Object { $_.Name -match "^$ProviderOrPath-" })
        }
        
        if ($Targets.Count -gt 1) {
            Write-Color "Multiple JDKs found for version $Version. Please specify a provider:" Yellow
            $Targets | ForEach-Object { Write-Host "  jdk remove $Version $($_.Name.Split('-')[0])" }
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
            Write-Color "JDK matching '$Version' $(if($ProviderOrPath){"and provider '$ProviderOrPath' "})not found." Red
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
        
        $Targets = @(Get-InstalledJDKs | Where-Object { $_.Name -match "-$Version$" -or $_.Name -match "-$Version\b" })
        if ($ProviderOrPath) {
            $Targets = @($Targets | Where-Object { $_.Name -match "^$ProviderOrPath-" })
        }
        
        if ($Targets.Count -eq 0) {
            Write-Color "JDK matching '$Version' $(if($ProviderOrPath){"and provider '$ProviderOrPath' "})not found. Cannot update." Red
            exit 1
        }
        
        if ($Targets.Count -gt 1) {
            Write-Color "Multiple JDKs found for version $Version. Please specify a provider:" Yellow
            $Targets | ForEach-Object { Write-Host "  jdk update $Version $($_.Name.Split('-')[0])" }
            exit 1
        } elseif ($Targets.Count -eq 1) {
            $Target = $Targets[0]
            $Provider = $Target.Name.Split('-')[0]
            if ($Provider -eq 'linked') {
                Write-Color "Cannot update a linked JDK." Red
                exit 1
            }
            
            Write-Color "Found existing $Provider $Version. Reinstalling to fetch the latest patch..." Cyan
            Remove-Item -Path $Target.FullName -Recurse -Force
            
            switch ($Provider) {
                'temurin' { Install-Temurin $Version }
                'corretto' { Install-Corretto $Version }
                'zulu' { Install-Zulu $Version }
                'microsoft' { Install-Microsoft $Version }
                'openjdk' { Install-OpenJDK $Version }
            }
        }
    }
    
    'help' {
        Write-Host "WinJDK Manager - Usage" -ForegroundColor Cyan
        Write-Host "----------------------"
        Write-Host "jdk list                                 - List installed JDKs"
        Write-Host "jdk install <version> [provider]         - Install a JDK (Providers: temurin, corretto, zulu, microsoft, openjdk)"
        Write-Host "jdk use <version> [provider] [scope]     - Set JAVA_HOME and PATH (Scope: System or User, default: System)"
        Write-Host "jdk link <version> <path>                - Link an existing JDK directory"
        Write-Host "jdk update <version> [provider]          - Reinstall a JDK to get the latest patch"
        Write-Host "jdk remove <version> [provider]          - Delete an installed JDK"
        Write-Host ""
        Write-Host "Examples:"
        Write-Host "  jdk install 21 temurin"
        Write-Host "  jdk install 17 openjdk"
        Write-Host "  jdk link 8 C:\\Program Files\\Java\\jdk1.8.0_202"
        Write-Host "  jdk use 21"
        Write-Host "  jdk use 21 corretto"
        Write-Host "  jdk use 21 temurin User"
        Write-Host "  jdk update 21 temurin"
        Write-Host "  jdk remove 17 openjdk"
    }
}
`;
