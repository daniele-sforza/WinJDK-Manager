# WinJDK Manager

A lightning-fast PowerShell CLI tool to download, list, switch, link, and delete JDK versions on Windows. Stop messing with Environment Variables manually. WinJDK Manager handles downloading, extracting, and linking the JDK to your PATH automatically.

## Features

- **Multiple Providers:** Download directly from Adoptium (Temurin), Amazon Corretto, Azul Zulu, Microsoft Build of OpenJDK, and official OpenJDK APIs.
- **Instant Switching:** Switch between JDK versions instantly. Automatically updates `JAVA_HOME` and `PATH` for the System (or User).
- **Link Existing JDKs:** Already have a JDK installed? Use the link command to add it to WinJDK Manager without redownloading.
- **No Admin Rights Required (Optional):** Can update User environment variables if you don't have Administrator privileges.
- **No Dependencies:** Built entirely with native Windows PowerShell.

## Installation

1. Download `jdk.ps1` and `jdk.bat`.
2. Place both files in a directory that is already in your system's `PATH` (e.g., `C:\Scripts`).
3. Open a new terminal. You can now use the `jdk` command from anywhere!

## Usage

```powershell
WinJDK Manager - Usage
----------------------
jdk list                                 - List installed JDKs
jdk install <version> [provider]         - Install a JDK (Providers: temurin, corretto, zulu, microsoft, openjdk)
jdk use <version> [provider] [scope]     - Set JAVA_HOME and PATH (Scope: System or User, default: System)
jdk link <version> <path>                - Link an existing JDK directory
jdk update <version> [provider]          - Reinstall a JDK to get the latest patch
jdk remove <version> [provider]          - Delete an installed JDK
```

### Examples

**Install a JDK:**
```powershell
jdk install 21 temurin
jdk install 17 openjdk
```

**Use a JDK (Switch):**
```powershell
jdk use 21
jdk use 21 corretto
jdk use 21 temurin User
```
*Note: Modifying System environment variables (the default) requires running your terminal as an Administrator. If you do not have admin rights, append `User` to the `use` command to update your local user variables instead.*

**Link an Existing JDK:**
```powershell
jdk link 8 "C:\Program Files\Java\jdk1.8.0_202"
```

**Update a JDK to the latest patch:**
```powershell
jdk update 21 temurin
```

**Remove a JDK:**
```powershell
jdk remove 17 openjdk
```

## How it works

WinJDK Manager downloads the requested JDK zip files directly from the official provider APIs, extracts them to `~/.jdk/`, and updates your `JAVA_HOME` and `PATH` environment variables to point to the selected version. The `jdk.bat` file acts as a convenient wrapper so you don't have to type `powershell -File jdk.ps1` every time.
