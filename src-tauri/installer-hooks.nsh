; NSIS Installer Hooks for Writto
; This file contains custom macros that are executed during install/uninstall

; Hook: Runs before removing any files, registry keys and shortcuts
!macro NSIS_HOOK_PREUNINSTALL
  ; Nothing to do before uninstall
!macroend

; Hook: Runs after files, registry keys and shortcuts have been removed
!macro NSIS_HOOK_POSTUNINSTALL
  ; Clean up OpenWithList entries for .md files
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.md\OpenWithList"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.markdown\OpenWithList"
  
  ; Clean up application registration in Classes
  DeleteRegKey HKCU "Software\Classes\Applications\writto.exe"
  DeleteRegKey HKCU "Software\Classes\Applications\Writto.exe"
  
  ; Clean up OpenWithProgids if exists
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.md\OpenWithProgids" "Writto.md"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.markdown\OpenWithProgids" "Writto.md"
  
  ; Refresh the shell to apply changes
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
!macroend
