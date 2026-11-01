#define MyAppVersion "0.1.0"
[Setup]
AppId={{0566E2AB-CC22-4BD3-BB98-DA1DD87F4C70}
AppName=LANES
AppVersion={#MyAppVersion}
DefaultDirName={autopf}\LANES
DefaultGroupName=LANES
UninstallDisplayIcon={app}\LANES.exe
OutputDir=..\dist\installer
OutputBaseFilename=LANES-{#MyAppVersion}-Setup
SetupIconFile=..\build\icons\lanes.ico
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=lowest
[Files]
Source: "..\dist\LANES-win32-x64\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
[Icons]
Name: "{group}\LANES"; Filename: "{app}\LANES.exe"
Name: "{autodesktop}\LANES"; Filename: "{app}\LANES.exe"; Tasks: desktopicon
[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; Flags: unchecked
[Run]
Filename: "{app}\LANES.exe"; Description: "Launch LANES"; Flags: nowait postinstall skipifsilent
